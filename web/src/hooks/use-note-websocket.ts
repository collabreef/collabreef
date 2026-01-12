import { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';

// Helper function to decode base64 string to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Helper function to split concatenated JSON messages
function splitConcatenatedJSON(data: string): string[] {
    const messages: string[] = [];
    let depth = 0;
    let start = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < data.length; i++) {
        const char = data[i];

        if (escapeNext) {
            escapeNext = false;
            continue;
        }

        if (char === '\\') {
            escapeNext = true;
            continue;
        }

        if (char === '"' && !escapeNext) {
            inString = !inString;
        }

        if (!inString) {
            if (char === '{') {
                depth++;
            } else if (char === '}') {
                depth--;
                if (depth === 0) {
                    // Found complete JSON object
                    messages.push(data.substring(start, i + 1));
                    start = i + 1;
                }
            }
        }
    }

    return messages;
}

interface UseNoteWebSocketOptions {
    noteId: string;
    workspaceId: string;
    enabled: boolean;
}

interface UserInfo {
    id: string;
    name: string;
}

interface NoteData {
    id: string;
    visibility: string;
    title: string;
    content: string;
    created_at: string;
    created_by: string;
    updated_at: string;
    updated_by: string;
}

interface NoteMessage {
    type: 'init' | 'update_title' | 'update_content' | 'user_join' | 'user_leave' | 'active_users' | 'snapshot' | 'snapshot_ready' | 'yjs_update';

    // Full note metadata (in init message)
    id?: string;
    visibility?: string;
    created_at?: string;
    created_by?: string;
    updated_at?: string;
    updated_by?: string;

    // Content data
    title?: string;
    content?: string;

    // Collaboration
    user?: UserInfo;
    users?: UserInfo[];

    // Y.js data (can be base64 string or byte array)
    snapshot?: string | number[];  // Y.js snapshot as base64 string or byte array
    need_initialize?: boolean;
    yjs_update?: string | number[];  // Y.js CRDT update as base64 string or byte array
}

export function useNoteWebSocket(options: UseNoteWebSocketOptions) {
    const { noteId, workspaceId, enabled } = options;

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const debounceTimeoutRef = useRef<NodeJS.Timeout>();

    // Y.js document for CRDT collaboration
    const yDocRef = useRef<Y.Doc | null>(null);
    const yTextRef = useRef<Y.Text | null>(null);

    const [isConnected, setIsConnected] = useState(false);
    const [noteData, setNoteData] = useState<NoteData | null>(null);
    const [hasYjsSnapshot, setHasYjsSnapshot] = useState<boolean | null>(null); // null = unknown, true = has snapshot, false = no snapshot
    const [title, setTitle] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [activeUsers, setActiveUsers] = useState<UserInfo[]>([]);
    const [isReady, setIsReady] = useState(false);

    // Pending title change to send (for debouncing)
    const pendingTitleRef = useRef<string | null>(null);
    const needInitializeRef = useRef(false);
    const hasInitializedSnapshotRef = useRef(false);

    // Initialize Y.js document
    useEffect(() => {
        if (!enabled) return;

        const yDoc = new Y.Doc();
        const yText = yDoc.getText('content');

        yDocRef.current = yDoc;
        yTextRef.current = yText;

        console.log('Y.js document initialized');

        return () => {
            if (yDoc) {
                yDoc.destroy();
            }
        };
    }, [enabled, noteId]);

    const connect = useCallback(() => {
        if (!enabled || !noteId || !workspaceId) return;

        // Build WebSocket URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/notes/${noteId}`;

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.binaryType = 'arraybuffer';

            ws.onopen = () => {
                console.log('Note WebSocket connected');
                setIsConnected(true);
                setIsReady(false);
                needInitializeRef.current = false;
                hasInitializedSnapshotRef.current = false;

                // Send any pending title updates after reconnection
                if (pendingTitleRef.current !== null) {
                    flushPendingTitle();
                }
            };

            ws.onmessage = async (event) => {
                try {
                    // All messages are now JSON format
                    let data: string;
                    if (event.data instanceof Blob) {
                        data = await event.data.text();
                    } else if (event.data instanceof ArrayBuffer) {
                        // Convert ArrayBuffer to string if needed
                        const decoder = new TextDecoder();
                        data = decoder.decode(event.data);
                    } else {
                        data = event.data;
                    }

                    // Validate JSON string before parsing
                    if (!data || typeof data !== 'string' || data.trim().length === 0) {
                        console.warn('[WebSocket] Received empty or invalid message data');
                        return;
                    }

                    // Try to parse as single JSON first
                    let messages: NoteMessage[];
                    try {
                        const singleMessage = JSON.parse(data);
                        messages = [singleMessage];
                    } catch (parseError) {
                        // If parsing fails, try splitting concatenated JSON messages
                        console.warn('[WebSocket] Failed to parse as single JSON, attempting to split concatenated messages');
                        const jsonStrings = splitConcatenatedJSON(data);
                        if (jsonStrings.length === 0) {
                            console.error('[WebSocket] JSON parse error. Data length:', data.length);
                            console.error('[WebSocket] First 200 chars:', data.substring(0, 200));
                            console.error('[WebSocket] Last 200 chars:', data.substring(Math.max(0, data.length - 200)));
                            throw parseError;
                        }
                        console.log('[WebSocket] Split into', jsonStrings.length, 'messages');
                        messages = jsonStrings.map(str => JSON.parse(str));
                    }

                    // Process each message
                    for (const message of messages) {
                        // Validate message type
                        if (!message.type) {
                            console.warn('[WebSocket] Message missing type field:', message);
                            continue;
                        }

                        processMessage(message);
                    }
                } catch (error) {
                    console.error('[WebSocket] Error handling WebSocket message:', error);
                    // Log event data type for debugging
                    if (event.data) {
                        console.error('[WebSocket] Event data type:', typeof event.data);
                        if (event.data instanceof Blob) {
                            console.error('[WebSocket] Blob size:', event.data.size);
                        } else if (event.data instanceof ArrayBuffer) {
                            console.error('[WebSocket] ArrayBuffer byteLength:', event.data.byteLength);
                        } else if (typeof event.data === 'string') {
                            console.error('[WebSocket] String length:', event.data.length);
                        }
                    }
                    // Don't throw - continue processing other messages
                }
            };

            // Process a single message
            const processMessage = (message: NoteMessage) => {
                try {

                    switch (message.type) {
                        case 'init':
                            // Determine if Y.js snapshot exists
                            const hasSnapshot = !message.need_initialize;
                            setHasYjsSnapshot(hasSnapshot);
                            console.log('[WebSocket] Y.js snapshot exists:', hasSnapshot);

                            // Initial state with full note metadata from server
                            if (hasSnapshot && message.id && message.visibility && message.created_at && message.created_by) {
                                // Note is initialized - use WebSocket data
                                const fullNoteData: NoteData = {
                                    id: message.id,
                                    visibility: message.visibility,
                                    title: message.title || '',
                                    content: message.content || '',
                                    created_at: message.created_at,
                                    created_by: message.created_by,
                                    updated_at: message.updated_at || message.created_at,
                                    updated_by: message.updated_by || message.created_by
                                };
                                setNoteData(fullNoteData);
                                console.log('[WebSocket] Received full note metadata (initialized):', fullNoteData);
                            } else {
                                // Note is not initialized - will use REST API data
                                console.log('[WebSocket] Note not initialized, will use REST API');
                            }

                            if (message.title !== undefined) {
                                setTitle(message.title);
                            }
                            if (message.content !== undefined) {
                                setContent(message.content);
                            }
                            if (message.users) {
                                setActiveUsers(message.users);
                            }

                            // Check if we need to initialize snapshot
                            if (message.need_initialize) {
                                console.log('Need to initialize Y.js snapshot from database content');
                                needInitializeRef.current = true;

                                // Initialize Y.Doc from database content
                                if (yDocRef.current && yTextRef.current && message.content) {
                                    yDocRef.current.transact(() => {
                                        yTextRef.current!.delete(0, yTextRef.current!.length);
                                        yTextRef.current!.insert(0, message.content || '');
                                    }, 'init');

                                    // Create and send snapshot to server
                                    const snapshot = Y.encodeStateAsUpdate(yDocRef.current);
                                    const snapshotMsg = {
                                        type: 'snapshot',
                                        snapshot: Array.from(snapshot)
                                    };
                                    ws.send(JSON.stringify(snapshotMsg)); // Send as TEXT message
                                    hasInitializedSnapshotRef.current = true;
                                    setIsReady(true);
                                    console.log('Initialized and sent Y.js snapshot to server');
                                }
                            } else {
                                // Will receive snapshot + updates from server
                                console.log('Will receive Y.js snapshot and updates from server');
                            }

                            console.log('Received initial note state');
                            break;

                        case 'snapshot_ready':
                            // Server has sent all snapshot + updates
                            setIsReady(true);
                            console.log('Snapshot and updates fully loaded, ready for editing');
                            break;

                        case 'update_title':
                            if (message.title !== undefined) {
                                setTitle(message.title);
                            }
                            break;

                        case 'update_content':
                            // Legacy content update (fallback)
                            if (message.content !== undefined) {
                                setContent(message.content);
                            }
                            break;

                        case 'user_join':
                            if (message.user) {
                                setActiveUsers(prev => {
                                    if (prev.some(u => u.id === message.user!.id)) {
                                        return prev;
                                    }
                                    return [...prev, message.user!];
                                });
                                console.log('User joined:', message.user.name);
                            }
                            break;

                        case 'user_leave':
                            if (message.user) {
                                setActiveUsers(prev => prev.filter(u => u.id !== message.user!.id));
                                console.log('User left:', message.user.name);
                            }
                            break;

                        case 'active_users':
                            if (message.users) {
                                setActiveUsers(message.users);
                            }
                            break;

                        case 'snapshot':
                            // Received Y.js snapshot from server (for existing notes)
                            if (message.snapshot && yDocRef.current) {
                                try {
                                    let snapshot: Uint8Array;

                                    // Check if snapshot is base64 string or byte array
                                    if (typeof message.snapshot === 'string') {
                                        // Base64 encoded string
                                        if (message.snapshot.length === 0) {
                                            console.warn('[WebSocket] Empty snapshot string received');
                                            break;
                                        }
                                        snapshot = base64ToUint8Array(message.snapshot);
                                        console.log('[WebSocket] Decoded base64 snapshot:', snapshot.length, 'bytes');
                                    } else if (Array.isArray(message.snapshot)) {
                                        // Byte array (legacy format)
                                        if (message.snapshot.length === 0) {
                                            console.warn('[WebSocket] Empty snapshot array received');
                                            break;
                                        }
                                        // Validate array elements are numbers in valid byte range
                                        const hasInvalidBytes = message.snapshot.some(b => typeof b !== 'number' || b < 0 || b > 255);
                                        if (hasInvalidBytes) {
                                            console.error('[WebSocket] Snapshot contains invalid byte values');
                                            console.error('[WebSocket] First 10 values:', message.snapshot.slice(0, 10));
                                            break;
                                        }
                                        snapshot = new Uint8Array(message.snapshot);
                                        console.log('[WebSocket] Using byte array snapshot:', snapshot.length, 'bytes');
                                    } else {
                                        console.error('[WebSocket] Invalid snapshot type:', typeof message.snapshot);
                                        break;
                                    }

                                    Y.applyUpdate(yDocRef.current, snapshot, 'server');
                                    console.log('[WebSocket] ✓ Applied Y.js snapshot:', snapshot.length, 'bytes');
                                } catch (error) {
                                    console.error('[WebSocket] ✗ Error applying Y.js snapshot:', error);
                                    console.error('[WebSocket] Snapshot type:', typeof message.snapshot);
                                    console.error('[WebSocket] Error details:', error instanceof Error ? error.message : String(error));
                                }
                            }
                            break;

                        case 'yjs_update':
                            // Received Y.js CRDT update from another client
                            if (message.yjs_update && yDocRef.current) {
                                try {
                                    let update: Uint8Array;

                                    // Check if update is base64 string or byte array
                                    if (typeof message.yjs_update === 'string') {
                                        // Base64 encoded string
                                        if (message.yjs_update.length === 0) {
                                            console.warn('[WebSocket] Empty yjs_update string received');
                                            break;
                                        }
                                        update = base64ToUint8Array(message.yjs_update);
                                        console.log('[WebSocket] Decoded base64 update:', update.length, 'bytes');
                                    } else if (Array.isArray(message.yjs_update)) {
                                        // Byte array (legacy format)
                                        if (message.yjs_update.length === 0) {
                                            console.warn('[WebSocket] Empty yjs_update array received');
                                            break;
                                        }
                                        // Validate array elements are numbers in valid byte range
                                        const hasInvalidBytes = message.yjs_update.some(b => typeof b !== 'number' || b < 0 || b > 255);
                                        if (hasInvalidBytes) {
                                            console.error('[WebSocket] Update contains invalid byte values');
                                            console.error('[WebSocket] First 10 values:', message.yjs_update.slice(0, 10));
                                            break;
                                        }
                                        update = new Uint8Array(message.yjs_update);
                                        console.log('[WebSocket] Using byte array update:', update.length, 'bytes');
                                    } else {
                                        console.error('[WebSocket] Invalid yjs_update type:', typeof message.yjs_update);
                                        break;
                                    }

                                    Y.applyUpdate(yDocRef.current, update, 'server');
                                    console.log('[WebSocket] ✓ Applied Y.js update:', update.length, 'bytes');
                                } catch (error) {
                                    console.error('[WebSocket] ✗ Error applying Y.js update:', error);
                                    console.error('[WebSocket] Update type:', typeof message.yjs_update);
                                    console.error('[WebSocket] Error details:', error instanceof Error ? error.message : String(error));
                                    // Don't crash, just log and continue
                                }
                            }
                            break;
                    }
                } catch (error) {
                    console.error('[WebSocket] Error processing message:', error);
                    console.error('[WebSocket] Message type:', message.type);
                    // Don't throw - continue processing other messages
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);

                // Only attempt to reconnect if this is still the active connection
                // (wsRef.current hasn't been cleared by a path change)
                if (enabled && wsRef.current === ws) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log('Attempting to reconnect...');
                        connect();
                    }, 3000);
                }
            };
        } catch (error) {
            console.error('Error creating WebSocket:', error);
        }
    }, [enabled, noteId, workspaceId]);

    // Flush pending title to server
    const flushPendingTitle = useCallback(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }

        if (pendingTitleRef.current !== null) {
            const message: NoteMessage = {
                type: 'update_title',
                title: pendingTitleRef.current
            };
            const data = JSON.stringify(message);
            wsRef.current.send(data); // Send as TEXT message
            console.log('Sent title update:', pendingTitleRef.current.substring(0, 50));
            pendingTitleRef.current = null;
        }
    }, []);

    // Send title update with 300ms debounce
    const sendUpdateTitle = useCallback((newTitle: string) => {
        pendingTitleRef.current = newTitle;
        setTitle(newTitle); // Update local state immediately

        // Clear existing timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Set new timeout
        debounceTimeoutRef.current = setTimeout(() => {
            flushPendingTitle();
        }, 300);
    }, [flushPendingTitle]);

    // Note: Content sync is now handled automatically by Y.js CRDT updates
    // No manual sync needed

    // Setup Y.js update handler only when ready
    useEffect(() => {
        console.log('[WebSocket] Update handler effect - isConnected:', isConnected, 'isReady:', isReady, 'hasYDoc:', !!yDocRef.current, 'hasWS:', !!wsRef.current);

        if (!isConnected || !isReady || !yDocRef.current || !wsRef.current) {
            console.log('[WebSocket] Update handler NOT attached - conditions not met');
            return;
        }

        const yDoc = yDocRef.current;
        const ws = wsRef.current;

        const updateHandler = (update: Uint8Array, origin: any) => {
            console.log('[WebSocket] Y.js update event fired! origin:', origin, 'size:', update.length, 'bytes');

            // Don't send updates that came from the server or during initialization
            if (origin === 'server' || origin === 'init') {
                console.log('[WebSocket] Skipping update with origin:', origin);
                return;
            }

            if (ws.readyState === WebSocket.OPEN) {
                // Get full content from Y.Text for worker to persist to database
                const fullContent = yTextRef.current ? yTextRef.current.toString() : '';

                // Wrap Y.js update in JSON message with full content
                const message: NoteMessage = {
                    type: 'yjs_update',
                    yjs_update: Array.from(update),
                    content: fullContent  // Full content for database persistence
                };
                ws.send(JSON.stringify(message));
                console.log('[WebSocket] Sent Y.js update + content to server:', update.length, 'bytes, content length:', fullContent.length);
            } else {
                console.log('[WebSocket] WARNING: WebSocket not open, readyState:', ws.readyState);
            }
        };

        yDoc.on('update', updateHandler);
        console.log('[WebSocket] ✓ Y.js update handler ATTACHED to WebSocket (ready state)');

        return () => {
            yDoc.off('update', updateHandler);
            console.log('[WebSocket] Y.js update handler detached');
        };
    }, [isConnected, isReady, noteId]);

    // Disconnect and cleanup when noteId changes (path change)
    useEffect(() => {
        // This effect runs whenever noteId changes
        // Return cleanup function to run before the next effect or unmount
        return () => {
            console.log('Path changed, disconnecting from note:', noteId);

            // Clear all timeouts
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = undefined;
            }
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
                debounceTimeoutRef.current = undefined;
            }

            // Close WebSocket connection
            if (wsRef.current) {
                // Disable reconnection before closing
                const ws = wsRef.current;
                wsRef.current = null;

                // Set a no-op onclose handler to prevent reconnection attempts
                ws.onclose = () => {
                    console.log('WebSocket closed (path change)');
                };

                // Close the connection
                ws.close();
                console.log('WebSocket connection closed due to path change');
            }

            // Reset state
            setIsConnected(false);
            setIsReady(false);
            setTitle('');
            setContent('');
            setActiveUsers([]);
            pendingTitleRef.current = null;
            needInitializeRef.current = false;
            hasInitializedSnapshotRef.current = false;
        };
    }, [noteId]);

    // Connect when enabled
    useEffect(() => {
        if (enabled && noteId) {
            connect();
        }

        // Cleanup on unmount or when enabled changes
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [enabled, connect]);

    return {
        isConnected,
        noteData,
        hasYjsSnapshot,
        title,
        content,
        activeUsers,
        sendUpdateTitle,
        yDoc: yDocRef.current,
        yText: yTextRef.current
    };
}
