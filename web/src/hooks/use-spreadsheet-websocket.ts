import { useEffect, useRef, useState, useCallback } from 'react';
import { SpreadsheetSheetData, SpreadsheetOp } from '../types/view';

interface UseSpreadsheetWebSocketOptions {
    viewId: string;
    workspaceId: string;
    enabled: boolean;
    isPublic?: boolean;
    skipInitialFetch?: boolean;
}

interface SpreadsheetMessage {
    type: 'init' | 'acquire_lock' | 'lock_acquired' | 'initialize_data' | 'op' | 'sync';
    sheets?: SpreadsheetSheetData[];
    ops?: SpreadsheetOp[];
    initialized?: boolean;
    lock_acquired?: boolean;
    session_id?: string;
}

// Generate a unique session ID for this browser tab (persists across reconnects)
const generateSessionId = () => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function useSpreadsheetWebSocket(options: UseSpreadsheetWebSocketOptions) {
    const { viewId, workspaceId, enabled, isPublic = false, skipInitialFetch = false } = options;

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const sessionIdRef = useRef<string>(generateSessionId());
    const [isConnected, setIsConnected] = useState(false);
    const [sheets, setSheets] = useState<SpreadsheetSheetData[] | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [pendingOps, setPendingOps] = useState<SpreadsheetOp[]>([]);
    const initializingRef = useRef(false);

    // Check if any op is a structural change that requires full re-mount
    const isStructuralChange = (ops: SpreadsheetOp[]): boolean => {
        return ops.some(op => {
            const opAny = op as any;
            // Check for sheet-level operations that cause frozen object issues
            return opAny.op === 'addSheet' ||
                   opAny.op === 'deleteSheet' ||
                   opAny.path?.includes('addSheet') ||
                   opAny.path?.includes('deleteSheet');
        });
    };

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
                console.log('Spreadsheet WebSocket connected');
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

                    const message: SpreadsheetMessage = JSON.parse(data);

                    switch (message.type) {
                        case 'init':
                            console.log('[WebSocket] Received init message:', {
                                initialized: message.initialized,
                                hasSheets: !!message.sheets,
                                sheetsCount: message.sheets?.length || 0,
                                skipInitialFetch
                            });

                            // Skip initial data fetch if requested (e.g., public mode using API)
                            if (skipInitialFetch) {
                                console.log('[WebSocket] Skipping initial WebSocket data fetch (using API data)');
                                setIsInitialized(true);
                                break;
                            }

                            // If server has sheets data from Redis, use it directly (no DB fetch needed)
                            if (message.initialized && message.sheets) {
                                console.log('[WebSocket] Using spreadsheet data from Redis cache:', {
                                    sheetsCount: message.sheets.length,
                                    firstSheetId: message.sheets[0]?.id,
                                    firstSheetName: message.sheets[0]?.name,
                                    firstSheetCelldataLength: message.sheets[0]?.celldata?.length || 0
                                });
                                setSheets(message.sheets);
                                setIsInitialized(true);
                                initializingRef.current = false;
                                break;
                            }

                            // Room not initialized in Redis, try to acquire lock to fetch from DB
                            if (!message.initialized && !initializingRef.current) {
                                console.log('[WebSocket] Redis cache empty, acquiring lock to fetch from DB');
                                initializingRef.current = true;
                                ws.send(JSON.stringify({ type: 'acquire_lock' }));
                            }
                            break;

                        case 'lock_acquired':
                            if (message.lock_acquired && !isInitialized && !isPublic) {
                                // We got the lock, fetch data from API and initialize
                                try {
                                    // Fetch view data
                                    const viewResponse = await fetch(`/api/v1/workspaces/${workspaceId}/views/${viewId}`, {
                                        credentials: 'include'
                                    });
                                    if (!viewResponse.ok) throw new Error('Failed to fetch view');
                                    const viewData = await viewResponse.json();

                                    // Parse sheets from view.data
                                    let sheetsData: SpreadsheetSheetData[] = [];
                                    if (viewData.data) {
                                        try {
                                            const parsed = JSON.parse(viewData.data);
                                            if (Array.isArray(parsed) && parsed.length > 0) {
                                                sheetsData = parsed;
                                            }
                                        } catch (e) {
                                            console.warn('Failed to parse sheets:', e);
                                        }
                                    }

                                    // If no sheets, create default empty sheet
                                    if (sheetsData.length === 0) {
                                        sheetsData = [{
                                            id: 'sheet1',
                                            name: 'Sheet1',
                                            order: 0,
                                            row: 100,
                                            column: 26,
                                            celldata: []
                                        }];
                                    }

                                    // Send initialize_data message
                                    ws.send(JSON.stringify({
                                        type: 'initialize_data',
                                        sheets: sheetsData
                                    }));

                                    // Update local state
                                    setSheets(sheetsData);
                                    setIsInitialized(true);
                                    initializingRef.current = false;
                                } catch (error) {
                                    console.error('Failed to initialize spreadsheet:', error);
                                    initializingRef.current = false;
                                }
                            } else {
                                // Another client got the lock, wait for initialization
                                initializingRef.current = false;
                            }
                            break;

                        case 'initialize_data':
                            // Another client initialized the room, apply the data
                            if (message.sheets) {
                                setSheets(message.sheets);
                            }
                            setIsInitialized(true);
                            initializingRef.current = false;
                            break;

                        case 'op':
                            // Received operations from other clients
                            // Skip if the op came from this same browser tab
                            if (message.session_id === sessionIdRef.current) {
                                console.log('Ignoring op from self (same session)');
                                break;
                            }
                            if (message.ops && message.ops.length > 0) {
                                // Check if this is a structural change (addSheet, deleteSheet)
                                // These require full re-mount due to immer frozen object issues
                                if (isStructuralChange(message.ops)) {
                                    console.log('Received structural change, triggering re-mount');
                                    if (message.sheets && message.sheets.length > 0) {
                                        setSheets(message.sheets);
                                    }
                                } else {
                                    // For regular cell edits, use applyOp for smooth UX
                                    console.log('Received cell ops, using applyOp');
                                    setPendingOps(prev => [...prev, ...message.ops!]);
                                }
                            }
                            break;

                        case 'sync':
                            // Full sync (for reconnection scenarios)
                            if (message.sheets) {
                                setSheets(message.sheets);
                            }
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
    }, [enabled, viewId, workspaceId, isPublic, skipInitialFetch, isInitialized]);

    // Send operations to server (with full sheets data for persistence)
    const sendOps = useCallback((ops: SpreadsheetOp[], currentSheets?: SpreadsheetSheetData[]) => {
        // Don't send updates in public/read-only mode
        if (isPublic) {
            console.log('Ignoring ops in public mode');
            return;
        }

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const message = {
                type: 'op',
                ops,
                sheets: currentSheets,
                session_id: sessionIdRef.current
            };
            console.log('[WebSocket] Sending op message:', {
                type: 'op',
                opsCount: ops?.length || 0,
                sheetsCount: currentSheets?.length || 0,
                hasSheetsData: !!currentSheets && currentSheets.length > 0,
                messageSize: JSON.stringify(message).length
            });
            // Include sheets data so server can update Redis for persistence
            // Include session_id so we can filter out our own ops
            wsRef.current.send(JSON.stringify(message));
        }
    }, [isPublic]);

    // Clear pending ops after they've been applied
    const clearPendingOps = useCallback(() => {
        setPendingOps([]);
    }, []);

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
        sendOps,
        isConnected,
        sheets,
        pendingOps,
        clearPendingOps,
        isInitialized
    };
}
