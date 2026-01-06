import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { FlowViewData, FlowNodeData, FlowEdgeData, View, EdgeType, MarkerType } from '../../../types/view'
import { getNotesForViewObject, removeNoteFromViewObject, deleteViewObject, updateViewObject, updateView, createViewObject } from '../../../api/view'
import { PlusCircle, MoreVertical, Edit2, Trash2, X } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Dialog } from 'radix-ui'
import AddNoteDialog from '../AddNoteDialog'
import { useToastStore } from '../../../stores/toast'
import { useTranslation } from 'react-i18next'
import Renderer from '../../renderer/Renderer'
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Node,
    Edge,
    Connection,
    NodeChange,
    EdgeChange,
    OnConnect,
    BackgroundVariant,
    Handle,
    Position,
    EdgeProps,
    BaseEdge,
    getSmoothStepPath,
    getSimpleBezierPath,
    getStraightPath,
    EdgeLabelRenderer,
    NodeResizer,
    OnSelectionChangeParams,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

interface FlowViewComponentProps {
    view?: View
    viewObjects?: any[] // nodes and edges
    isPublic?: boolean
    workspaceId?: string
    viewId?: string
}

const FlowViewComponent = ({
    view,
    viewObjects = [],
    isPublic = false,
    workspaceId,
    viewId
}: FlowViewComponentProps) => {
    const navigate = useNavigate()
    const params = useParams<{ workspaceId?: string; viewId?: string }>()
    const queryClient = useQueryClient()
    const { addToast } = useToastStore()
    const { t } = useTranslation()
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')
    const [editingColor, setEditingColor] = useState('')

    // Edge editing states
    const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null)
    const [editingEdgeLabel, setEditingEdgeLabel] = useState('')
    const [editingEdgeColor, setEditingEdgeColor] = useState('#64748b')
    const [editingEdgeStyle, setEditingEdgeStyle] = useState<'solid' | 'dashed'>('solid')
    const [editingEdgeMarkerStart, setEditingEdgeMarkerStart] = useState<boolean>(false)
    const [editingEdgeMarkerEnd, setEditingEdgeMarkerEnd] = useState<boolean>(true)
    const [editingEdgeMarkerStartType, setEditingEdgeMarkerStartType] = useState<MarkerType>('arrow')
    const [editingEdgeMarkerEndType, setEditingEdgeMarkerEndType] = useState<MarkerType>('arrow')
    const [editingEdgeType, setEditingEdgeType] = useState<EdgeType>('smoothstep')

    // Track selected nodes for handle visibility
    const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set())

    const currentWorkspaceId = workspaceId || params.workspaceId
    const currentViewId = viewId || params.viewId

    // Separate nodes and edges from viewObjects
    const nodes = useMemo(() => viewObjects.filter((obj) => obj.type === 'flow_node'), [viewObjects])
    const edges = useMemo(() => viewObjects.filter((obj) => obj.type === 'flow_edge'), [viewObjects])

    // Mutations
    const createEdgeMutation = useMutation({
        mutationFn: async ({ source, target, sourceHandle, targetHandle }: { source: string, target: string, sourceHandle?: string | null, targetHandle?: string | null }) => {
            const edgeData: FlowEdgeData = {
                source,
                target,
                sourceHandle: sourceHandle || undefined,
                targetHandle: targetHandle || undefined,
                stroke: '#64748b', // Default gray color
                markerEnd: 'arrow', // Default arrow at end
                markerStart: 'none', // No arrow at start by default
                markerStartType: 'arrow', // Default marker type
                markerEndType: 'arrow', // Default marker type
                edgeType: 'smoothstep', // Default curve type
            }

            const edgeObject = await createViewObject(currentWorkspaceId!, currentViewId!, {
                name: `${source} → ${target}`,
                type: 'flow_edge',
                data: JSON.stringify(edgeData)
            })

            return edgeObject
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['view-objects', currentWorkspaceId, currentViewId] })
        },
        onError: () => {
            addToast({ title: t('views.edgeCreatedError'), type: 'error' })
        }
    })

    const deleteEdgeMutation = useMutation({
        mutationFn: async (edgeId: string) => {
            await deleteViewObject(currentWorkspaceId!, currentViewId!, edgeId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['view-objects', currentWorkspaceId, currentViewId] })
        },
        onError: () => {
            addToast({ title: t('views.objectDeletedError'), type: 'error' })
        }
    })

    const deleteNodeMutation = useMutation({
        mutationFn: async (nodeId: string) => {
            await deleteViewObject(currentWorkspaceId!, currentViewId!, nodeId)

            // Also remove from view.data.nodes if it exists
            if (view?.data) {
                try {
                    const viewData: FlowViewData = JSON.parse(view.data)
                    if (viewData.nodes) {
                        const newNodes = viewData.nodes.filter(id => id !== nodeId)
                        const newViewData: FlowViewData = {
                            ...viewData,
                            nodes: newNodes
                        }
                        await updateView(currentWorkspaceId!, currentViewId!, {
                            data: JSON.stringify(newViewData)
                        })
                    }
                } catch (e) {
                    console.error('Failed to update view data after deleting node:', e)
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['view-objects', currentWorkspaceId, currentViewId] })
            queryClient.invalidateQueries({ queryKey: ['view', currentWorkspaceId, currentViewId] })
        },
        onError: () => {
            addToast({ title: t('views.objectDeletedError'), type: 'error' })
        }
    })

    const updateNodeMutation = useMutation({
        mutationFn: ({ nodeId, name, data }: { nodeId: string, name: string, data: string }) =>
            updateViewObject(currentWorkspaceId!, currentViewId!, nodeId, { name, data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['view-objects', currentWorkspaceId, currentViewId] })
            setEditingNodeId(null)
            setEditingName('')
            setEditingColor('')
        },
        onError: () => {
            addToast({ title: t('views.objectUpdatedError'), type: 'error' })
        }
    })

    const updateEdgeMutation = useMutation({
        mutationFn: ({ edgeId, name, data }: { edgeId: string, name?: string, data: string }) =>
            updateViewObject(currentWorkspaceId!, currentViewId!, edgeId, { name, data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['view-objects', currentWorkspaceId, currentViewId] })
            setEditingEdgeId(null)
            setEditingEdgeLabel('')
            setEditingEdgeColor('#64748b')
            setEditingEdgeStyle('solid')
            setEditingEdgeMarkerStart(false)
            setEditingEdgeMarkerEnd(true)
            setEditingEdgeMarkerStartType('arrow')
            setEditingEdgeMarkerEndType('arrow')
            setEditingEdgeType('smoothstep')
        },
        onError: () => {
            addToast({ title: t('views.objectUpdatedError'), type: 'error' })
        }
    })

    // Handlers
    const handleNoteClick = useCallback((noteId: string) => {
        const path = isPublic
            ? `/explore/notes/${noteId}`
            : `/workspaces/${currentWorkspaceId}/notes/${noteId}`
        navigate(path)
    }, [isPublic, currentWorkspaceId, navigate])

    const handleEditNode = useCallback((nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId)
        if (node) {
            setEditingNodeId(nodeId)
            setEditingName(node.name)
            try {
                const nodeData: FlowNodeData = node.data ? JSON.parse(node.data) : { position: { x: 0, y: 0 } }
                setEditingColor(nodeData.color || '')
            } catch (e) {
                setEditingColor('')
            }
        }
    }, [nodes])

    const handleDeleteNode = useCallback((nodeId: string) => {
        if (window.confirm(t('views.deleteObjectConfirm'))) {
            deleteNodeMutation.mutate(nodeId)
        }
    }, [t, deleteNodeMutation])

    const handleDeleteEdge = useCallback((edgeId: string) => {
        if (window.confirm(t('views.deleteObjectConfirm'))) {
            deleteEdgeMutation.mutate(edgeId)
        }
    }, [t, deleteEdgeMutation])

    const handleEditEdge = useCallback((edgeId: string) => {
        const edge = edges.find(e => e.id === edgeId)
        if (edge) {
            setEditingEdgeId(edgeId)
            try {
                const edgeData: FlowEdgeData = edge.data ? JSON.parse(edge.data) : { source: '', target: '' }
                setEditingEdgeLabel(edgeData.label || '')
                setEditingEdgeColor(edgeData.stroke || '#64748b')
                setEditingEdgeStyle(edgeData.strokeDasharray ? 'dashed' : 'solid')
                setEditingEdgeMarkerStart(edgeData.markerStart === 'arrow' || edgeData.markerStart === 'arrowclosed')
                setEditingEdgeMarkerEnd(edgeData.markerEnd !== 'none')
                setEditingEdgeMarkerStartType(edgeData.markerStartType || 'arrow')
                setEditingEdgeMarkerEndType(edgeData.markerEndType || 'arrow')
                setEditingEdgeType(edgeData.edgeType || 'smoothstep')
            } catch (e) {
                setEditingEdgeLabel('')
                setEditingEdgeColor('#64748b')
                setEditingEdgeStyle('solid')
                setEditingEdgeMarkerStart(false)
                setEditingEdgeMarkerEnd(true)
                setEditingEdgeMarkerStartType('arrow')
                setEditingEdgeMarkerEndType('arrow')
                setEditingEdgeType('smoothstep')
            }
        }
    }, [edges])

    const handleSaveEdgeEdit = useCallback(() => {
        if (!editingEdgeId) return

        const edge = edges.find(e => e.id === editingEdgeId)
        if (!edge) return

        try {
            const existingData: FlowEdgeData = edge.data ? JSON.parse(edge.data) : { source: '', target: '' }
            const newData: FlowEdgeData = {
                ...existingData,
                label: editingEdgeLabel || undefined,
                stroke: editingEdgeColor,
                strokeDasharray: editingEdgeStyle === 'dashed' ? '5,5' : undefined,
                markerStart: editingEdgeMarkerStart ? editingEdgeMarkerStartType : 'none',
                markerEnd: editingEdgeMarkerEnd ? editingEdgeMarkerEndType : 'none',
                markerStartType: editingEdgeMarkerStartType,
                markerEndType: editingEdgeMarkerEndType,
                edgeType: editingEdgeType,
            }

            updateEdgeMutation.mutate({
                edgeId: editingEdgeId,
                name: editingEdgeLabel || `${existingData.source} → ${existingData.target}`,
                data: JSON.stringify(newData)
            })
        } catch (e) {
            addToast({ title: t('views.objectUpdatedError'), type: 'error' })
        }
    }, [editingEdgeId, edges, editingEdgeLabel, editingEdgeColor, editingEdgeStyle, editingEdgeMarkerStart, editingEdgeMarkerEnd, editingEdgeMarkerStartType, editingEdgeMarkerEndType, editingEdgeType, updateEdgeMutation, addToast, t])

    const handleSaveEdit = useCallback(() => {
        if (!editingNodeId || !editingName.trim()) return

        const node = nodes.find(n => n.id === editingNodeId)
        if (!node) return

        try {
            const existingData: FlowNodeData = node.data ? JSON.parse(node.data) : { position: { x: 0, y: 0 } }
            const newData: FlowNodeData = {
                ...existingData,
                color: editingColor || undefined
            }

            updateNodeMutation.mutate({
                nodeId: editingNodeId,
                name: editingName.trim(),
                data: JSON.stringify(newData)
            })
        } catch (e) {
            addToast({ title: t('views.objectUpdatedError'), type: 'error' })
        }
    }, [editingNodeId, editingName, nodes, editingColor, updateNodeMutation, addToast, t])

    // Convert viewObjects to React Flow nodes
    const flowNodes: Node[] = useMemo(() => {
        return nodes.map((node) => {
            let nodeData: FlowNodeData = {
                position: { x: 0, y: 0 }
            }
            try {
                if (node.data) {
                    nodeData = JSON.parse(node.data)
                }
            } catch (e) {
                console.error('Failed to parse node data:', e)
            }

            const isSelected = selectedNodeIds.has(node.id)

            return {
                id: node.id,
                type: 'custom',
                position: nodeData.position,
                selected: isSelected,
                data: {
                    ...node,
                    color: nodeData.color,
                    width: nodeData.width || 250,
                    height: nodeData.height,
                    onEdit: handleEditNode,
                    onDelete: handleDeleteNode,
                    onNoteClick: handleNoteClick,
                    isPublic,
                    workspaceId: currentWorkspaceId,
                    viewId: currentViewId,
                    isSelected,
                },
                style: {
                    backgroundColor: nodeData.color || '#fff',
                    width: nodeData.width || 250,
                    height: nodeData.height,
                }
            }
        })
    }, [nodes, currentWorkspaceId, currentViewId, isPublic, handleNoteClick, handleEditNode, handleDeleteNode, selectedNodeIds])

    // Convert viewObjects to React Flow edges
    const flowEdges: Edge[] = useMemo(() => {
        return edges.map((edge) => {
            let edgeData: FlowEdgeData = {
                source: '',
                target: ''
            }
            try {
                if (edge.data) {
                    edgeData = JSON.parse(edge.data)
                }
            } catch (e) {
                console.error('Failed to parse edge data:', e)
            }

            // Build style object
            const edgeStyle: Record<string, any> = {
                stroke: edgeData.stroke || '#64748b',
                strokeWidth: 2,
            }
            if (edgeData.strokeDasharray) {
                edgeStyle.strokeDasharray = edgeData.strokeDasharray
            }

            // Determine markers - use the correct React Flow marker format with color
            const arrowColor = edgeData.stroke || '#64748b'
            const markerStart = (edgeData.markerStart === 'arrow' || edgeData.markerStart === 'arrowclosed')
                ? { type: edgeData.markerStart as const, color: arrowColor }
                : undefined
            const markerEnd = (edgeData.markerEnd === 'arrow' || edgeData.markerEnd === 'arrowclosed')
                ? { type: edgeData.markerEnd as const, color: arrowColor }
                : undefined

            const edgeType = edgeData.edgeType || 'smoothstep'

            return {
                id: edge.id,
                type: isPublic ? edgeType : 'custom-edge', // Use custom edge type with delete button
                source: edgeData.source,
                target: edgeData.target,
                sourceHandle: edgeData.sourceHandle,
                targetHandle: edgeData.targetHandle,
                label: edgeData.label, // Don't show label if not explicitly set
                animated: edgeData.animated,
                style: edgeStyle,
                markerStart,
                markerEnd,
                data: {
                    viewObjectId: edge.id, // Store original view object ID for deletion
                    onDelete: handleDeleteEdge,
                    onEdit: handleEditEdge,
                    edgeType, // Pass edge type to custom edge component
                }
            }
        })
    }, [edges, isPublic, handleDeleteEdge, handleEditEdge])

    const [reactFlowNodes, setNodes, onNodesChange] = useNodesState<Node>([])
    const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

    // Update nodes and edges when viewObjects change
    // Use a ref to track the previous viewObjects to avoid unnecessary updates
    const prevNodesRef = useRef<string>('')
    const prevEdgesRef = useRef<string>('')

    useEffect(() => {
        const nodesKey = nodes.map(n => `${n.id}-${n.data}`).join(',')
        if (nodesKey !== prevNodesRef.current) {
            prevNodesRef.current = nodesKey
            setNodes(flowNodes)
        }
    }, [nodes, flowNodes])

    useEffect(() => {
        const edgesKey = edges.map(e => `${e.id}-${e.data}`).join(',')
        if (edgesKey !== prevEdgesRef.current) {
            prevEdgesRef.current = edgesKey
            setEdges(flowEdges)
        }
    }, [edges, flowEdges])

    // Handle node position and dimension changes
    const handleNodesChangeWithSave = useCallback(
        (changes: NodeChange[]) => {
            onNodesChange(changes)

            if (isPublic) return // Don't save changes in public view

            // Save position and dimension changes to backend
            changes.forEach((change) => {
                if (change.type === 'position' && change.position && !change.dragging) {
                    const node = nodes.find((n) => n.id === change.id)
                    if (node) {
                        let nodeData: FlowNodeData = {
                            position: { x: 0, y: 0 }
                        }
                        try {
                            if (node.data) {
                                nodeData = JSON.parse(node.data)
                            }
                        } catch (e) {
                            console.error('Failed to parse node data:', e)
                        }

                        const newData: FlowNodeData = {
                            ...nodeData,
                            position: change.position,
                        }

                        updateViewObject(
                            currentWorkspaceId!,
                            currentViewId!,
                            change.id,
                            { data: JSON.stringify(newData) }
                        ).catch(() => {
                            addToast({ title: t('views.objectUpdatedError'), type: 'error' })
                        })
                    }
                }
                // Handle dimension changes from resizing
                if (change.type === 'dimensions' && change.dimensions) {
                    const node = nodes.find((n) => n.id === change.id)
                    if (node) {
                        let nodeData: FlowNodeData = {
                            position: { x: 0, y: 0 }
                        }
                        try {
                            if (node.data) {
                                nodeData = JSON.parse(node.data)
                            }
                        } catch (e) {
                            console.error('Failed to parse node data:', e)
                        }

                        const newData: FlowNodeData = {
                            ...nodeData,
                            width: change.dimensions.width,
                            height: change.dimensions.height,
                        }

                        updateViewObject(
                            currentWorkspaceId!,
                            currentViewId!,
                            change.id,
                            { data: JSON.stringify(newData) }
                        ).catch(() => {
                            addToast({ title: t('views.objectUpdatedError'), type: 'error' })
                        })
                    }
                }
            })
        },
        [onNodesChange, nodes, currentWorkspaceId, currentViewId, addToast, t, isPublic]
    )

    const onConnect: OnConnect = useCallback(
        (connection: Connection) => {
            if (!connection.source || !connection.target) return
            if (isPublic) return // Don't allow creating edges in public view

            // Optimistically add edge to UI
            setEdges((eds) => addEdge(connection, eds))

            // Save edge to backend
            createEdgeMutation.mutate({
                source: connection.source,
                target: connection.target,
                sourceHandle: connection.sourceHandle,
                targetHandle: connection.targetHandle
            })
        },
        [setEdges, createEdgeMutation, isPublic]
    )

    // Handle selection changes to track selected nodes
    const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
        const selectedNodes = params.nodes.map(node => node.id)
        setSelectedNodeIds(new Set(selectedNodes))
    }, [])

    // Handle edge changes including deletion
    const handleEdgesChangeWithDelete = useCallback(
        (changes: EdgeChange[]) => {
            onEdgesChange(changes)

            if (isPublic) return

            // Handle edge deletions
            changes.forEach((change) => {
                if (change.type === 'remove') {
                    const edge = reactFlowEdges.find((e) => e.id === change.id)
                    if (edge?.data && typeof edge.data === 'object' && 'viewObjectId' in edge.data) {
                        deleteEdgeMutation.mutate(edge.data.viewObjectId as string)
                    }
                }
            })
        },
        [onEdgesChange, reactFlowEdges, deleteEdgeMutation, isPublic]
    )

    // Custom node and edge components
    const nodeTypes = useMemo(
        () => ({
            custom: FlowNodeComponent,
        }),
        []
    )

    const edgeTypes = useMemo(
        () => ({
            'custom-edge': CustomEdge,
        }),
        []
    )

    return (
        <>
            <div className="h-full w-full">
                <ReactFlow
                    nodes={reactFlowNodes}
                    edges={reactFlowEdges}
                    onNodesChange={handleNodesChangeWithSave}
                    onEdgesChange={handleEdgesChangeWithDelete}
                    onConnect={onConnect}
                    onSelectionChange={onSelectionChange}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    edgesReconnectable={!isPublic}
                    edgesFocusable={true}
                    nodesDraggable={!isPublic}
                    nodesConnectable={!isPublic}
                    nodesFocusable={!isPublic}
                    elementsSelectable={true}
                    selectNodesOnDrag={false}
                    panOnDrag={[1, 2]}
                    selectionOnDrag={false}
                    deleteKeyCode={isPublic ? null : "Delete"}
                >
                    <Controls />
                    <MiniMap />
                    <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                </ReactFlow>

                {viewObjects.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-neutral-400 dark:text-neutral-500">
                            No nodes yet. Create your first node to get started.
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Node Dialog */}
            <Dialog.Root open={!!editingNodeId} onOpenChange={(open) => !open && setEditingNodeId(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[400px] z-50">
                        <Dialog.Title className="text-xl font-semibold mb-4">
                            {t('views.editNode')}
                        </Dialog.Title>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {t('views.nodeName')}
                                </label>
                                <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    className="w-full px-3 py-2 border dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                                    placeholder={t('views.enterName')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {t('views.color')}
                                </label>
                                <input
                                    type="color"
                                    value={editingColor || '#ffffff'}
                                    onChange={(e) => setEditingColor(e.target.value)}
                                    className="w-full h-10 border dark:border-neutral-600 rounded-lg cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <Dialog.Close asChild>
                                <button className="px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                    {t('common.cancel')}
                                </button>
                            </Dialog.Close>
                            <button
                                onClick={handleSaveEdit}
                                disabled={updateNodeMutation.isPending || !editingName.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updateNodeMutation.isPending ? t('common.saving') : t('common.save')}
                            </button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Edit Edge Dialog */}
            <Dialog.Root open={!!editingEdgeId} onOpenChange={(open) => !open && setEditingEdgeId(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[400px] z-50">
                        <Dialog.Title className="text-xl font-semibold mb-4">
                            {t('views.editEdge')}
                        </Dialog.Title>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {t('views.edgeLabel')}
                                </label>
                                <input
                                    type="text"
                                    value={editingEdgeLabel}
                                    onChange={(e) => setEditingEdgeLabel(e.target.value)}
                                    className="w-full px-3 py-2 border dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                                    placeholder={t('common.optional')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {t('views.edgeColor')}
                                </label>
                                <input
                                    type="color"
                                    value={editingEdgeColor}
                                    onChange={(e) => setEditingEdgeColor(e.target.value)}
                                    className="w-full h-10 border dark:border-neutral-600 rounded-lg cursor-pointer"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {t('views.edgeStyle')}
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEditingEdgeStyle('solid')}
                                        className={`flex-1 px-3 py-2 border dark:border-neutral-600 rounded-lg ${
                                            editingEdgeStyle === 'solid'
                                                ? 'bg-primary text-white'
                                                : 'bg-white dark:bg-neutral-800'
                                        }`}
                                    >
                                        {t('views.solidLine')}
                                    </button>
                                    <button
                                        onClick={() => setEditingEdgeStyle('dashed')}
                                        className={`flex-1 px-3 py-2 border dark:border-neutral-600 rounded-lg ${
                                            editingEdgeStyle === 'dashed'
                                                ? 'bg-primary text-white'
                                                : 'bg-white dark:bg-neutral-800'
                                        }`}
                                    >
                                        {t('views.dashedLine')}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {t('views.curveType')}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setEditingEdgeType('smoothstep')}
                                        className={`px-3 py-2 border dark:border-neutral-600 rounded-lg text-sm ${
                                            editingEdgeType === 'smoothstep'
                                                ? 'bg-primary text-white'
                                                : 'bg-white dark:bg-neutral-800'
                                        }`}
                                    >
                                        {t('views.smoothStep')}
                                    </button>
                                    <button
                                        onClick={() => setEditingEdgeType('step')}
                                        className={`px-3 py-2 border dark:border-neutral-600 rounded-lg text-sm ${
                                            editingEdgeType === 'step'
                                                ? 'bg-primary text-white'
                                                : 'bg-white dark:bg-neutral-800'
                                        }`}
                                    >
                                        {t('views.step')}
                                    </button>
                                    <button
                                        onClick={() => setEditingEdgeType('bezier')}
                                        className={`px-3 py-2 border dark:border-neutral-600 rounded-lg text-sm ${
                                            editingEdgeType === 'bezier'
                                                ? 'bg-primary text-white'
                                                : 'bg-white dark:bg-neutral-800'
                                        }`}
                                    >
                                        {t('views.bezier')}
                                    </button>
                                    <button
                                        onClick={() => setEditingEdgeType('straight')}
                                        className={`px-3 py-2 border dark:border-neutral-600 rounded-lg text-sm ${
                                            editingEdgeType === 'straight'
                                                ? 'bg-primary text-white'
                                                : 'bg-white dark:bg-neutral-800'
                                        }`}
                                    >
                                        {t('views.straight')}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {t('views.arrows')}
                                </label>
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={editingEdgeMarkerStart}
                                                onChange={(e) => setEditingEdgeMarkerStart(e.target.checked)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm">{t('views.arrowAtStart')}</span>
                                        </label>
                                        {editingEdgeMarkerStart && (
                                            <div className="ml-6 flex gap-2">
                                                <button
                                                    onClick={() => setEditingEdgeMarkerStartType('arrow')}
                                                    className={`px-3 py-1 border dark:border-neutral-600 rounded text-xs ${
                                                        editingEdgeMarkerStartType === 'arrow'
                                                            ? 'bg-primary text-white'
                                                            : 'bg-white dark:bg-neutral-800'
                                                    }`}
                                                >
                                                    Chevron
                                                </button>
                                                <button
                                                    onClick={() => setEditingEdgeMarkerStartType('arrowclosed')}
                                                    className={`px-3 py-1 border dark:border-neutral-600 rounded text-xs ${
                                                        editingEdgeMarkerStartType === 'arrowclosed'
                                                            ? 'bg-primary text-white'
                                                            : 'bg-white dark:bg-neutral-800'
                                                    }`}
                                                >
                                                    Triangle
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={editingEdgeMarkerEnd}
                                                onChange={(e) => setEditingEdgeMarkerEnd(e.target.checked)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm">{t('views.arrowAtEnd')}</span>
                                        </label>
                                        {editingEdgeMarkerEnd && (
                                            <div className="ml-6 flex gap-2">
                                                <button
                                                    onClick={() => setEditingEdgeMarkerEndType('arrow')}
                                                    className={`px-3 py-1 border dark:border-neutral-600 rounded text-xs ${
                                                        editingEdgeMarkerEndType === 'arrow'
                                                            ? 'bg-primary text-white'
                                                            : 'bg-white dark:bg-neutral-800'
                                                    }`}
                                                >
                                                    Chevron
                                                </button>
                                                <button
                                                    onClick={() => setEditingEdgeMarkerEndType('arrowclosed')}
                                                    className={`px-3 py-1 border dark:border-neutral-600 rounded text-xs ${
                                                        editingEdgeMarkerEndType === 'arrowclosed'
                                                            ? 'bg-primary text-white'
                                                            : 'bg-white dark:bg-neutral-800'
                                                    }`}
                                                >
                                                    Triangle
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <Dialog.Close asChild>
                                <button className="px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                    {t('common.cancel')}
                                </button>
                            </Dialog.Close>
                            <button
                                onClick={handleSaveEdgeEdit}
                                disabled={updateEdgeMutation.isPending}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updateEdgeMutation.isPending ? t('common.saving') : t('common.save')}
                            </button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    )
}

interface FlowNodeComponentProps {
    data: any
    selected?: boolean
}

const FlowNodeComponent = ({ data, selected }: FlowNodeComponentProps) => {
    const [isAddingNote, setIsAddingNote] = useState(false)
    const { t } = useTranslation()
    const { addToast } = useToastStore()
    const queryClient = useQueryClient()
    const resizeTimerRef = useRef<NodeJS.Timeout>()

    const { data: notes = [], refetch: refetchNotes } = useQuery({
        queryKey: ['node-notes', data.workspaceId, data.viewId, data.id],
        queryFn: () => data.isPublic
            ? import('../../../api/view').then((m: any) => m.getPublicNotesForViewObject(data.viewId, data.id))
            : getNotesForViewObject(data.workspaceId, data.viewId, data.id),
        enabled: data.isPublic ? !!data.viewId : (!!data.workspaceId && !!data.viewId)
    })

    const linkedNoteIds = Array.isArray(notes) ? notes.map((note: any) => note.id) : []

    const removeNoteMutation = useMutation({
        mutationFn: async (noteId: string) => {
            await removeNoteFromViewObject(data.workspaceId, data.viewId, data.id, noteId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['node-notes', data.workspaceId, data.viewId, data.id] })
        },
        onError: () => {
            addToast({ title: t('views.noteRemovedError'), type: 'error' })
        }
    })

    const handleRemoveNote = (e: React.MouseEvent, noteId: string) => {
        e.stopPropagation()
        if (window.confirm(t('views.removeNoteConfirm'))) {
            removeNoteMutation.mutate(noteId)
        }
    }

    // Debounced resize handler - saves to backend after 500ms of inactivity
    const handleResizeEnd = useCallback((_: any, params: any) => {
        // Clear any pending save
        if (resizeTimerRef.current) {
            clearTimeout(resizeTimerRef.current)
        }

        // Schedule save after 500ms
        resizeTimerRef.current = setTimeout(() => {
            if (data.workspaceId && data.viewId && data.id) {
                try {
                    const nodeData = data.data ? JSON.parse(data.data) : { position: { x: 0, y: 0 } }
                    const newData = {
                        ...nodeData,
                        width: params.width,
                        height: params.height,
                    }
                    updateViewObject(
                        data.workspaceId,
                        data.viewId,
                        data.id,
                        { data: JSON.stringify(newData) }
                    ).catch(console.error)
                } catch (e) {
                    console.error('Failed to save resize:', e)
                }
            }
        }, 500)
    }, [data])

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (resizeTimerRef.current) {
                clearTimeout(resizeTimerRef.current)
            }
        }
    }, [])

    return (
        <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg p-4 min-w-[250px] h-full relative">
            {/* Resize handles - only show when node is selected and not in public view */}
            {!data.isPublic && (
                <NodeResizer
                    isVisible={!!selected}
                    lineClassName="!border-primary !border-2"
                    handleClassName="!w-3 !h-3 !bg-primary !border-2 !border-white dark:!border-neutral-800 !rounded-sm"
                    onResize={handleResizeEnd}
                />
            )}

            {/* Connection Handles - Always visible in non-public mode for easy connectivity */}
            {!data.isPublic && (
                <>
                    {/* Top Handle */}
                    <Handle
                        type="source"
                        position={Position.Top}
                        id="top"
                        className="!w-2 !h-2 !bg-primary !border-2 !border-white dark:!border-neutral-800 !opacity-40 hover:!w-4 hover:!h-4 hover:!opacity-100 transition-all"
                    />
                    <Handle
                        type="target"
                        position={Position.Top}
                        id="top-target"
                        className="!w-2 !h-2 !bg-primary !border-2 !border-white dark:!border-neutral-800 !opacity-40 hover:!w-4 hover:!h-4 hover:!opacity-100 transition-all"
                    />

                    {/* Right Handle */}
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="right"
                        className="!w-2 !h-2 !bg-primary !border-2 !border-white dark:!border-neutral-800 !opacity-40 hover:!w-4 hover:!h-4 hover:!opacity-100 transition-all"
                    />
                    <Handle
                        type="target"
                        position={Position.Right}
                        id="right-target"
                        className="!w-2 !h-2 !bg-primary !border-2 !border-white dark:!border-neutral-800 !opacity-40 hover:!w-4 hover:!h-4 hover:!opacity-100 transition-all"
                    />

                    {/* Bottom Handle */}
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="bottom"
                        className="!w-2 !h-2 !bg-primary !border-2 !border-white dark:!border-neutral-800 !opacity-40 hover:!w-4 hover:!h-4 hover:!opacity-100 transition-all"
                    />
                    <Handle
                        type="target"
                        position={Position.Bottom}
                        id="bottom-target"
                        className="!w-2 !h-2 !bg-primary !border-2 !border-white dark:!border-neutral-800 !opacity-40 hover:!w-4 hover:!h-4 hover:!opacity-100 transition-all"
                    />

                    {/* Left Handle */}
                    <Handle
                        type="source"
                        position={Position.Left}
                        id="left"
                        className="!w-2 !h-2 !bg-primary !border-2 !border-white dark:!border-neutral-800 !opacity-40 hover:!w-4 hover:!h-4 hover:!opacity-100 transition-all"
                    />
                    <Handle
                        type="target"
                        position={Position.Left}
                        id="left-target"
                        className="!w-2 !h-2 !bg-primary !border-2 !border-white dark:!border-neutral-800 !opacity-40 hover:!w-4 hover:!h-4 hover:!opacity-100 transition-all"
                    />
                </>
            )}

            {/* Node Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {data.color && (
                        <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: data.color }}
                        ></div>
                    )}
                    <div className="font-semibold">
                        {data.name}
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        {notes.length}
                    </div>
                </div>
                {!data.isPublic && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsAddingNote(true)
                            }}
                            className="p-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
                            title={t('views.addNote')}
                        >
                            <PlusCircle size={14} />
                        </button>
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                                <button
                                    className="p-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
                                    title={t('common.more')}
                                >
                                    <MoreVertical size={14} />
                                </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                                <DropdownMenu.Content
                                    className="min-w-[160px] bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 p-1 z-50"
                                    sideOffset={5}
                                >
                                    <DropdownMenu.Item
                                        className="flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer outline-none hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                        onSelect={() => data.onEdit?.(data.id)}
                                    >
                                        <Edit2 size={14} />
                                        {t('actions.edit')}
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                        className="flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer outline-none text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        onSelect={() => data.onDelete?.(data.id)}
                                    >
                                        <Trash2 size={14} />
                                        {t('actions.delete')}
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                    </div>
                )}
            </div>

            {/* Notes */}
            <div
                className="space-y-2 h-[calc(100%-40px)] overflow-y-auto"
                onWheel={(e) => e.stopPropagation()}
            >
                {notes.map((note: any) => (
                    <div
                        key={note.id}
                        onClick={() => data.onNoteClick?.(note.id)}
                        className="relative p-2 pr-6 rounded bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    >
                        {!data.isPublic && (
                            <button
                                onClick={(e) => handleRemoveNote(e, note.id)}
                                className="absolute top-1 right-1 p-0.5 text-neutral-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title={t('views.removeNote')}
                            >
                                <X size={12} />
                            </button>
                        )}
                        <div className="text-xs line-clamp-2 overflow-hidden [&_.prose]:text-xs [&_.prose]:leading-tight">
                            <Renderer content={note.content} />
                        </div>
                    </div>
                ))}

                {notes.length === 0 && (
                    <div className="text-center py-4 text-neutral-400 dark:text-neutral-500 text-xs">
                        No notes
                    </div>
                )}
            </div>

            {/* Add Note Dialog */}
            {!data.isPublic && data.workspaceId && data.viewId && (
                <AddNoteDialog
                    workspaceId={data.workspaceId}
                    viewId={data.viewId}
                    viewObjectId={data.id}
                    viewObjectName={data.name}
                    isOpen={isAddingNote}
                    onOpenChange={setIsAddingNote}
                    linkedNoteIds={linkedNoteIds}
                    onSuccess={refetchNotes}
                />
            )}
        </div>
    )
}

// Custom Edge component with edit and delete buttons
interface CustomEdgeProps extends EdgeProps {
    data?: {
        viewObjectId: string
        onDelete?: (edgeId: string) => void
        onEdit?: (edgeId: string) => void
        edgeType?: EdgeType
    }
}

const CustomEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    markerEnd,
    markerStart,
    style,
    selected,
    label,
}: CustomEdgeProps) => {
    const edgeType = data?.edgeType || 'smoothstep'

    // Get path based on edge type
    let edgePath: string
    let labelX: number
    let labelY: number

    if (edgeType === 'straight') {
        [edgePath, labelX, labelY] = getStraightPath({
            sourceX,
            sourceY,
            targetX,
            targetY,
        })
    } else if (edgeType === 'step' || edgeType === 'smoothstep') {
        [edgePath, labelX, labelY] = getSmoothStepPath({
            sourceX,
            sourceY,
            sourcePosition,
            targetX,
            targetY,
            targetPosition,
            borderRadius: edgeType === 'step' ? 0 : undefined,
        })
    } else {
        // bezier
        [edgePath, labelX, labelY] = getSimpleBezierPath({
            sourceX,
            sourceY,
            sourcePosition,
            targetX,
            targetY,
            targetPosition,
        })
    }

    const onDeleteClick = (evt: React.MouseEvent) => {
        evt.stopPropagation()
        if (data?.onDelete && data?.viewObjectId) {
            data.onDelete(data.viewObjectId)
        }
    }

    const onEditClick = (evt: React.MouseEvent) => {
        evt.stopPropagation()
        if (data?.onEdit && data?.viewObjectId) {
            data.onEdit(data.viewObjectId)
        }
    }

    return (
        <>
            <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} markerStart={markerStart} style={style} />
            {(label || selected) && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: 'all',
                        }}
                        className="nodrag nopan"
                    >
                        <div className="flex items-center gap-2">
                            {/* Label text - always show if exists */}
                            {label && (
                                <div className="px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded text-xs shadow-sm">
                                    {label}
                                </div>
                            )}

                            {/* Edit/Delete buttons - only show when selected */}
                            {selected && (
                                <div className="flex gap-1">
                                    <button
                                        className="w-5 h-5 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs border-2 border-white dark:border-neutral-800 shadow-md transition-all hover:w-6 hover:h-6"
                                        onClick={onEditClick}
                                        title="Edit edge"
                                    >
                                        <Edit2 size={10} />
                                    </button>
                                    <button
                                        className="w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs border-2 border-white dark:border-neutral-800 shadow-md transition-all hover:w-6 hover:h-6"
                                        onClick={onDeleteClick}
                                        title="Delete edge"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    )
}

export default FlowViewComponent
