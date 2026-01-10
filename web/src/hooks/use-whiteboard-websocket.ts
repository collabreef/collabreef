import { useEffect, useRef, useState, useCallback } from 'react';

interface UseWhiteboardWebSocketOptions {
    viewId: string;
    workspaceId: string;
    enabled: boolean;
    isPublic?: boolean;
    skipInitialFetch?: boolean;
}

interface CanvasObject {
    id: string;
    type: 'stroke' | 'shape';
    data: any;
}

interface ViewObject {
    id: string;
    type: string;
    name: string;
    data: any;
}

interface WhiteboardMessage {
    type: 'sync' | 'init' | 'acquire_lock' | 'lock_acquired' | 'initialize_data' | 'add_canvas_object' | 'update_canvas_object' | 'delete_canvas_object' | 'add_view_object' | 'update_view_object' | 'delete_view_object' | 'clear_all';
    canvas_objects?: Record<string, CanvasObject>;
    view_objects?: Record<string, ViewObject>;
    object?: CanvasObject | ViewObject;
    id?: string;
    initialized?: boolean;
    lock_acquired?: boolean;
    yjs_state?: string; // Base64 encoded Y.js state
}

export function useWhiteboardWebSocket(options: UseWhiteboardWebSocketOptions) {
    const { viewId, workspaceId, enabled, isPublic = false, skipInitialFetch = false } = options;

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const [isConnected, setIsConnected] = useState(false);
    const [canvasObjects, setCanvasObjects] = useState<Map<string, CanvasObject> | null>(null);
    const [viewObjects, setViewObjects] = useState<Map<string, ViewObject> | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const initializingRef = useRef(false);

    const connect = useCallback(() => {
        if (!enabled || !viewId) return;
        // For non-public mode, require workspaceId
        if (!isPublic && !workspaceId) return;

        // Build WebSocket URL - use public endpoint for public mode
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const path = isPublic ? `/ws/public/views/${viewId}` : `/ws/views/${viewId}`;
        const wsUrl = `${protocol}//${window.location.host}${path}`;

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('Whiteboard WebSocket connected');
                setIsConnected(true);
            };

            ws.onmessage = async (event) => {
                try {
                    // Handle both text and blob messages
                    let data: string;
                    if (event.data instanceof Blob) {
                        data = await event.data.text();
                    } else {
                        data = event.data;
                    }

                    const message: WhiteboardMessage = JSON.parse(data);

                    switch (message.type) {
                        case 'init':
                            // Skip initial data fetch if requested (e.g., public mode using API)
                            if (skipInitialFetch) {
                                console.log('Skipping initial WebSocket data fetch (using API data)');
                                setIsInitialized(true);
                                break;
                            }

                            // Initial state from server
                            if (message.canvas_objects) {
                                setCanvasObjects(new Map(Object.entries(message.canvas_objects)));
                            }
                            if (message.view_objects) {
                                setViewObjects(new Map(Object.entries(message.view_objects)));
                            }

                            // Check if room is initialized
                            if (message.initialized) {
                                setIsInitialized(true);

                                // If Y.js state is present, apply it
                                if (message.yjs_state && message.yjs_state.length > 0) {
                                    // TODO: Apply Y.js CRDT state to local Y.Doc
                                    // import * as Y from 'yjs'
                                    // const ydoc = new Y.Doc()
                                    // // Decode base64 to Uint8Array
                                    // const binaryString = atob(message.yjs_state)
                                    // const bytes = new Uint8Array(binaryString.length)
                                    // for (let i = 0; i < binaryString.length; i++) {
                                    //     bytes[i] = binaryString.charCodeAt(i)
                                    // }
                                    // Y.applyUpdate(ydoc, bytes)
                                    console.log('Received Y.js state from Redis (base64):', message.yjs_state.length, 'chars');
                                }
                            } else if (!initializingRef.current) {
                                // Room not initialized, try to acquire lock
                                initializingRef.current = true;
                                ws.send(JSON.stringify({ type: 'acquire_lock' }));
                            }
                            break;

                        case 'lock_acquired':
                            if (message.lock_acquired && !isInitialized && !isPublic) {
                                // We got the lock, fetch data from API and initialize
                                // (Public mode should never initialize, only receive)
                                try {
                                    // Fetch view data
                                    const viewResponse = await fetch(`/api/v1/workspaces/${workspaceId}/views/${viewId}`, {
                                        credentials: 'include'
                                    });
                                    if (!viewResponse.ok) throw new Error('Failed to fetch view');
                                    const viewData = await viewResponse.json();

                                    // Fetch view objects
                                    const viewObjectsResponse = await fetch(`/api/v1/workspaces/${workspaceId}/views/${viewId}/objects`, {
                                        credentials: 'include'
                                    });
                                    if (!viewObjectsResponse.ok) throw new Error('Failed to fetch view objects');
                                    const viewObjectsData = await viewObjectsResponse.json();

                                    // Parse canvas objects from view.data
                                    let canvasObjectsData: Record<string, CanvasObject> = {};
                                    if (viewData.data) {
                                        try {
                                            canvasObjectsData = JSON.parse(viewData.data);
                                        } catch (e) {
                                            console.warn('Failed to parse canvas objects:', e);
                                        }
                                    }

                                    // Convert view objects to map
                                    const viewObjectsMap: Record<string, ViewObject> = {};
                                    if (Array.isArray(viewObjectsData)) {
                                        viewObjectsData.forEach((obj: any) => {
                                            viewObjectsMap[obj.id] = {
                                                id: obj.id,
                                                type: obj.type,
                                                name: obj.name,
                                                data: obj.data
                                            };
                                        });
                                    }

                                    // TODO: Initialize Y.js doc with this data
                                    // For now, just send the raw data
                                    // In the future, you should:
                                    // import * as Y from 'yjs'
                                    // const ydoc = new Y.Doc()
                                    // // Populate ydoc with canvasObjectsData and viewObjectsMap
                                    // const state = Y.encodeStateAsUpdate(ydoc)
                                    // // Convert Uint8Array to base64
                                    // const base64State = btoa(String.fromCharCode(...state))

                                    // Send initialize_data message
                                    ws.send(JSON.stringify({
                                        type: 'initialize_data',
                                        canvas_objects: canvasObjectsData,
                                        view_objects: viewObjectsMap,
                                        // yjs_state: base64State // TODO: Add Y.js state here (base64 encoded)
                                    }));

                                    // Update local state
                                    setCanvasObjects(new Map(Object.entries(canvasObjectsData)));
                                    setViewObjects(new Map(Object.entries(viewObjectsMap)));
                                    setIsInitialized(true);
                                    initializingRef.current = false;
                                } catch (error) {
                                    console.error('Failed to initialize whiteboard:', error);
                                    initializingRef.current = false;
                                }
                            } else {
                                // Another client got the lock, wait for initialization
                                initializingRef.current = false;
                            }
                            break;

                        case 'initialize_data':
                            // Another client initialized the room, apply the data
                            if (message.canvas_objects) {
                                setCanvasObjects(new Map(Object.entries(message.canvas_objects)));
                            }
                            if (message.view_objects) {
                                setViewObjects(new Map(Object.entries(message.view_objects)));
                            }

                            // Apply Y.js state if present
                            if (message.yjs_state && message.yjs_state.length > 0) {
                                // TODO: Apply Y.js CRDT state to local Y.Doc
                                // import * as Y from 'yjs'
                                // const ydoc = new Y.Doc()
                                // // Decode base64 to Uint8Array
                                // const binaryString = atob(message.yjs_state)
                                // const bytes = new Uint8Array(binaryString.length)
                                // for (let i = 0; i < binaryString.length; i++) {
                                //     bytes[i] = binaryString.charCodeAt(i)
                                // }
                                // Y.applyUpdate(ydoc, bytes)
                                console.log('Received initialization Y.js state from another client (base64):', message.yjs_state.length, 'chars');
                            }

                            setIsInitialized(true);
                            initializingRef.current = false;
                            break;

                        case 'add_canvas_object':
                        case 'update_canvas_object':
                            if (message.object) {
                                setCanvasObjects(prev => {
                                    const newMap = new Map(prev || []);
                                    newMap.set(message.object!.id, message.object as CanvasObject);
                                    return newMap;
                                });
                            }
                            break;

                        case 'delete_canvas_object':
                            if (message.id) {
                                setCanvasObjects(prev => {
                                    const newMap = new Map(prev || []);
                                    newMap.delete(message.id!);
                                    return newMap;
                                });
                            }
                            break;

                        case 'add_view_object':
                        case 'update_view_object':
                            if (message.object) {
                                setViewObjects(prev => {
                                    const newMap = new Map(prev || []);
                                    newMap.set(message.object!.id, message.object as ViewObject);
                                    return newMap;
                                });
                            }
                            break;

                        case 'delete_view_object':
                            if (message.id) {
                                setViewObjects(prev => {
                                    const newMap = new Map(prev || []);
                                    newMap.delete(message.id!);
                                    return newMap;
                                });
                            }
                            break;

                        case 'clear_all':
                            setCanvasObjects(new Map());
                            setViewObjects(new Map());
                            break;
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setIsConnected(false);
            };

            ws.onclose = () => {
                console.log('WebSocket closed');
                setIsConnected(false);
                wsRef.current = null;

                // Attempt to reconnect after 3 seconds
                if (enabled) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log('Attempting to reconnect...');
                        connect();
                    }, 3000);
                }
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
        }
    }, [enabled, viewId, workspaceId, isPublic]);

    const sendUpdate = useCallback((message: Partial<WhiteboardMessage>) => {
        // Don't send updates in public/read-only mode
        if (isPublic) {
            console.log('Ignoring update in public mode:', message.type);
            return;
        }

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    }, [isPublic]);

    useEffect(() => {
        if (enabled) {
            connect();
        }

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [enabled, connect]);

    return {
        sendUpdate,
        isConnected,
        canvasObjects,
        viewObjects,
        isInitialized
    };
}
