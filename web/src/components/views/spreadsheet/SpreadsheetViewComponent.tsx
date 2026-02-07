import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Workbook, WorkbookInstance } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { setAutoFreeze } from 'immer';
import { useTranslation } from 'react-i18next';
import { SpreadsheetSheetData, SpreadsheetOp } from '../../../types/view';
import { useSpreadsheetWebSocket } from '../../../hooks/use-spreadsheet-websocket';

// Disable immer's auto-freezing to allow fortune-sheet to mutate internal state
// This fixes "Cannot delete property 'data'" errors when adding/modifying sheets
setAutoFreeze(false);

// Use any for fortune-sheet internal types since they're not fully exported
type Sheet = any;
type Op = any;

// Deep clone helper to ensure fortune-sheet gets mutable data
const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

interface SpreadsheetViewComponentProps {
    view?: {
        id: string;
        data: string;
    };
    isPublic?: boolean;
    workspaceId?: string;
    viewId?: string;
    initialSheets?: SpreadsheetSheetData[];
    disableWebSocket?: boolean;
}

const SpreadsheetViewComponent = ({
    view,
    isPublic = false,
    workspaceId,
    viewId,
    initialSheets,
    disableWebSocket = false
}: SpreadsheetViewComponentProps) => {
    const { t } = useTranslation();
    const workbookRef = useRef<WorkbookInstance | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse initial sheets from view.data
    const parsedInitialSheets = React.useMemo(() => {
        if (initialSheets && initialSheets.length > 0) {
            return initialSheets;
        }
        if (view?.data) {
            try {
                const parsed = JSON.parse(view.data);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed as SpreadsheetSheetData[];
                }
            } catch (e) {
                console.warn('Failed to parse view.data:', e);
            }
        }
        // Default empty sheet
        return [{
            id: 'sheet1',
            name: 'Sheet1',
            order: 0,
            row: 100,
            column: 26,
            celldata: []
        }] as SpreadsheetSheetData[];
    }, [view?.data, initialSheets]);

    // WebSocket connection
    const {
        sendOps,
        isConnected,
        sheets: remoteSheets,
        pendingOps,
        clearPendingOps
    } = useSpreadsheetWebSocket({
        viewId: viewId || '',
        workspaceId: workspaceId || '',
        enabled: !disableWebSocket && !!viewId && (isPublic || !!workspaceId),
        isPublic: isPublic,
        skipInitialFetch: isPublic && !!initialSheets,
    });

    // Initial sheets for first render only - deep clone to ensure mutable data
    const [initialData] = useState<Sheet[]>(() => deepClone(parsedInitialSheets) as unknown as Sheet[]);

    // Ref to track current sheets for sending to server (updated via onChange)
    const localSheetsRef = useRef<Sheet[]>(initialData);

    const [isReady, setIsReady] = useState(false);

    // Track data version to force Workbook re-mount when external data arrives
    const [dataVersion, setDataVersion] = useState(0);
    const [externalData, setExternalData] = useState<Sheet[] | null>(null);

    // Flag to prevent sending ops back when applying remote ops
    const isApplyingRemoteOpsRef = useRef(false);

    // Handle onChange from fortune-sheet - only update ref, don't trigger re-render
    const handleSheetsChange = useCallback((data: Sheet[]) => {
        localSheetsRef.current = data;
    }, []);

    // Update sheets from external source (Redis) - force Workbook re-mount with new data
    const updateSheetsFromExternal = useCallback((data: Sheet[]) => {
        const clonedData = deepClone(data);
        localSheetsRef.current = clonedData;
        setExternalData(clonedData);
        setDataVersion(v => v + 1);
    }, []);

    // Monitor container size
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateSize = () => {
            const { width, height } = container.getBoundingClientRect();
            if (width > 0 && height > 0) {
                setIsReady(true);
            }
        };

        const resizeObserver = new ResizeObserver(() => {
            updateSize();
        });

        resizeObserver.observe(container);
        // Initial size check with a small delay to ensure layout is ready
        setTimeout(updateSize, 100);

        return () => resizeObserver.disconnect();
    }, []);

    // Sync remote data from Redis (force Workbook re-mount for structural changes)
    useEffect(() => {
        if (remoteSheets && remoteSheets.length > 0) {
            console.log('Received sheets from Redis, re-mounting Workbook');
            updateSheetsFromExternal(remoteSheets as unknown as Sheet[]);
        }
    }, [remoteSheets, updateSheetsFromExternal]);

    // Handle pending ops from other clients (for regular cell edits)
    useEffect(() => {
        if (pendingOps.length > 0 && workbookRef.current) {
            // Set flag to prevent sending these ops back to server
            isApplyingRemoteOpsRef.current = true;
            pendingOps.forEach(op => {
                try {
                    // Cast to Op[] for fortune-sheet compatibility
                    workbookRef.current?.applyOp([op as unknown as Op]);
                } catch (e) {
                    console.error('Failed to apply op:', e);
                }
            });
            // Clear flag after applying all ops
            isApplyingRemoteOpsRef.current = false;
            clearPendingOps();
        }
    }, [pendingOps, clearPendingOps]);

    // Handle local operations (send to server)
    const handleOp = useCallback((ops: Op[]) => {
        // Skip if we're applying remote ops (to prevent sending them back)
        if (isApplyingRemoteOpsRef.current) {
            return;
        }
        if (!isPublic && ops.length > 0) {
            // Cast to SpreadsheetOp[] for our WebSocket protocol
            // Include current sheets data for server persistence and broadcasting to other clients
            sendOps(ops as unknown as SpreadsheetOp[], localSheetsRef.current as unknown as SpreadsheetSheetData[]);
        }
    }, [isPublic, sendOps]);

    // Compute which data to use for Workbook
    const workbookData = externalData || initialData;

    return (
        <div ref={containerRef} className="relative w-full h-full bg-white dark:bg-neutral-900">
            {/* Loading state */}
            {!isReady && (
                <div className="absolute inset-0 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center z-20">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-neutral-300 border-t-primary rounded-full animate-spin" />
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">
                            {t('spreadsheet.loading') || 'Loading spreadsheet...'}
                        </span>
                    </div>
                </div>
            )}

            {/* Connection status indicator */}
            {!isPublic && !disableWebSocket && isReady && (
                <div className="absolute top-2 right-2 z-10 bg-white dark:bg-neutral-800 rounded-lg shadow-md px-3 py-2 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                        isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                        {isConnected
                            ? t('spreadsheet.connected') || 'Connected'
                            : t('spreadsheet.disconnected') || 'Disconnected'}
                    </span>
                </div>
            )}

            {/* FortuneSheet Workbook */}
            {isReady && (
                <div style={{ width: '100%', height: '100%' }}>
                    <Workbook
                        key={`workbook-${dataVersion}`}
                        ref={workbookRef}
                        data={workbookData}
                        onChange={handleSheetsChange}
                        onOp={handleOp}
                        showToolbar={!isPublic}
                        showFormulaBar={!isPublic}
                        showSheetTabs={true}
                        row={100}
                        column={26}
                        allowEdit={!isPublic}
                    />
                </div>
            )}
        </div>
    );
};

export default SpreadsheetViewComponent;
