import { NodeViewProps, NodeViewWrapper } from "@tiptap/react"
import { ChevronUp, ChevronDown, Edit3, Trash2, Star } from "lucide-react"
import { useState, useRef, useEffect, useCallback } from "react"
import { useDragMenu, NodeTouchMenu } from "@/components/editor/DragMenuContext"

const RatingNodeComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, selected, editor, deleteNode, getPos }) => {
  const { rating, maxRating, label } = node.attrs
  const isEditable = editor.isEditable
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches
  const [isEditing, setIsEditing] = useState(rating === 0 && !label)
  const [hoverRating, setHoverRating] = useState(0)
  const [inputRating, setInputRating] = useState<number>(rating ?? 0)
  const [inputMaxRating, setInputMaxRating] = useState<number>(maxRating ?? 5)
  const [inputLabel, setInputLabel] = useState<string>(label ?? '')
  const labelRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) setTimeout(() => labelRef.current?.focus(), 0)
  }, [isEditing])

  const handleSubmit = () => {
    updateAttributes({ rating: inputRating, maxRating: inputMaxRating, label: inputLabel })
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
    if (e.key === 'Escape' && (rating > 0 || label)) {
      setInputRating(rating ?? 0); setInputMaxRating(maxRating ?? 5); setInputLabel(label ?? ''); setIsEditing(false)
    }
  }

  const handleMoveUp = useCallback(() => {
    const pos = getPos()
    if (pos === undefined) return
    const { state } = editor
    const $pos = state.doc.resolve(pos)
    if ($pos.index() === 0) return
    const nodeBefore = $pos.nodeBefore
    if (!nodeBefore) return
    editor.view.dispatch(state.tr.replaceWith(pos - nodeBefore.nodeSize, pos + node.nodeSize, [node, nodeBefore]))
  }, [editor, node, getPos])

  const handleMoveDown = useCallback(() => {
    const pos = getPos()
    if (pos === undefined) return
    const { state } = editor
    const $pos = state.doc.resolve(pos)
    if ($pos.index() >= $pos.parent.childCount - 1) return
    const nodeAfterPos = pos + node.nodeSize
    const nodeAfter = state.doc.resolve(nodeAfterPos).nodeAfter
    if (!nodeAfter) return
    editor.view.dispatch(state.tr.replaceWith(pos, nodeAfterPos + nodeAfter.nodeSize, [nodeAfter, node]))
  }, [editor, node, getPos])

  const nodeActions = [
    { label: 'Move up', icon: <ChevronUp size={14} />, onClick: handleMoveUp },
    { label: 'Move down', icon: <ChevronDown size={14} />, onClick: handleMoveDown },
    { label: 'Edit', icon: <Edit3 size={14} />, onClick: () => { setInputRating(rating ?? 0); setInputMaxRating(maxRating ?? 5); setInputLabel(label ?? ''); setIsEditing(true) } },
    { label: 'Delete', icon: <Trash2 size={14} />, onClick: deleteNode, variant: 'danger' as const },
  ]

  useDragMenu(getPos, () => nodeActions)

  if (isEditing || (rating === 0 && !label)) {
    return (
      <NodeViewWrapper className="rating-node select-none border dark:border-neutral-700 rounded p-3 bg-gray-100 dark:bg-neutral-800">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Star size={18} />
            <span className="text-sm font-medium">Rating</span>
          </div>
          <input ref={labelRef} type="text" className="px-3 py-2 text-sm rounded border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Label (optional)..." value={inputLabel} onChange={e => setInputLabel(e.target.value)} onKeyDown={handleKeyDown} />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Rating ({inputRating}/{inputMaxRating})</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: inputMaxRating }, (_, i) => i + 1).map(i => (
                <button key={i} type="button" onClick={() => setInputRating(i)} onMouseEnter={() => setHoverRating(i)} onMouseLeave={() => setHoverRating(0)} className="p-0.5 transition-transform hover:scale-110 focus:outline-none">
                  <Star size={24} className={i <= (hoverRating || inputRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-neutral-600'} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Max stars:</span>
            {[3, 5, 10].map(n => (
              <button key={n} type="button" onClick={() => { setInputMaxRating(n); if (inputRating > n) setInputRating(n) }} className={`px-2 py-0.5 text-xs rounded border transition-colors ${inputMaxRating === n ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 dark:border-neutral-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'}`}>{n}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors" onClick={handleSubmit}>Save</button>
            {(rating > 0 || label) && (
              <button className="px-3 py-2 text-sm rounded border border-gray-300 dark:border-neutral-600 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 transition-colors" onClick={() => { setInputRating(rating ?? 0); setInputMaxRating(maxRating ?? 5); setInputLabel(label ?? ''); setIsEditing(false) }}>Cancel</button>
            )}
          </div>
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper>
      <div className="relative group my-1">
        <div className={`flex items-center rounded-lg border dark:border-neutral-700 overflow-hidden bg-white dark:bg-neutral-900 shadow-sm px-4 py-3 gap-3 ${selected ? 'ring-2 ring-blue-500' : ''}`}>
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            {label && <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{label}</p>}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: maxRating }, (_, i) => i + 1).map(i => (
                <Star key={i} size={18} className={i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-neutral-600'} />
              ))}
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{rating}/{maxRating}</span>
            </div>
          </div>
        </div>
        {isTouchDevice && isEditable && (
          <NodeTouchMenu visible={selected} actions={nodeActions} />
        )}
      </div>
    </NodeViewWrapper>
  )
}

export default RatingNodeComponent
