import { useState, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout';
import { Settings2 } from 'lucide-react';
import OneColumn from '@/components/onecolumn/OneColumn';
import SidebarButton from '@/components/sidebar/SidebarButton';
import useCurrentWorkspaceId from '@/hooks/use-currentworkspace-id';
import { getWidgets, updateWidget, deleteWidget, WidgetData, getWidgetPath } from '@/api/widget';
import { useToastStore } from '@/stores/toast';
import WidgetRenderer from '@/components/widgets/WidgetRenderer';
import AddWidgetMenu from '@/components/widgets/AddWidgetMenu';
import EditWidgetDialog from '@/components/widgets/EditWidgetDialog';
import { parseWidgetPosition, stringifyWidgetPosition, WidgetPosition, parseWidgetConfig, FolderWidgetConfig } from '@/types/widget';
import { getWidget } from '@/components/widgets/widgetRegistry';

import 'react-grid-layout/css/styles.css';
import { useWorkspaceStore } from '@/stores/workspace';

const ResponsiveGridLayout = WidthProvider(Responsive);

const LAYOUT_SAVE_DEBOUNCE_MS = 500;

const WorkspaceHomePage = () => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const { getWorkspaceById } = useWorkspaceStore()
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [editingWidget, setEditingWidget] = useState<WidgetData | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('xl');
  const [isPathDropdownOpen, setIsPathDropdownOpen] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const widgetsRef = useRef<WidgetData[]>([]);

  // Get current folder from URL params
  const currentFolderId = searchParams.get('folder') || '';

  const { data: widgetsData, isLoading } = useQuery({
    queryKey: ['widgets', workspaceId, currentFolderId],
    queryFn: () => getWidgets(workspaceId, 1, 100, undefined, undefined, currentFolderId),
    enabled: !!workspaceId,
  });

  // Fetch current folder path if we're inside a folder
  const { data: folderPath } = useQuery({
    queryKey: ['widgetPath', workspaceId, currentFolderId],
    queryFn: () => getWidgetPath(workspaceId, currentFolderId),
    enabled: !!workspaceId && !!currentFolderId,
  });

  // Ensure widgets is always an array (API might return null)
  const widgets = widgetsData ?? [];

  // Sort widgets by position (top to bottom, left to right)
  const sortedWidgets = useMemo(() => {
    return [...widgets].sort((a, b) => {
      const posA = parseWidgetPosition(a as any);
      const posB = parseWidgetPosition(b as any);

      // Sort by y (top to bottom) first
      const yA = posA.y ?? 0;
      const yB = posB.y ?? 0;
      if (yA !== yB) {
        return yA - yB;
      }

      // Then sort by x (left to right)
      const xA = posA.x ?? 0;
      const xB = posB.x ?? 0;
      return xA - xB;
    });
  }, [widgets]);

  // Keep widgets ref in sync for use in callbacks
  widgetsRef.current = sortedWidgets;

  const updateMutation = useMutation({
    mutationFn: ({ id, position }: { id: string; position: string }) =>
      updateWidget(workspaceId, { id, position }),
    onError: () => {
      addToast({ type: 'error', title: t('widgets.updateError') });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWidget(workspaceId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widgets', workspaceId] });
    },
    onError: () => {
      addToast({ type: 'error', title: t('widgets.deleteError') });
    },
  });

  // Generate responsive layouts from widget positions
  const layouts = useMemo((): Layouts => {
    const baseLayout: Layout[] = sortedWidgets.map((widget, index) => {
      const position = parseWidgetPosition(widget as any);
      const widgetModule = getWidget(widget.type);

      return {
        i: widget.id!,
        x: position.x ?? (index % 3) * 4,
        y: position.y ?? Math.floor(index / 3) * 4,
        w: position.width ?? 4,
        h: position.height ?? 4,
        minW: widgetModule?.minWidth ?? 2,
        minH: widgetModule?.minHeight ?? 1,
        maxW: position.maxWidth ?? widgetModule?.maxWidth,
        maxH: position.maxHeight ?? widgetModule?.maxHeight,
      };
    });

    // Helper function to clamp width for smaller breakpoints
    const clampLayoutWidth = (layout: Layout[], maxCols: number): Layout[] => {
      return layout.map(item => ({
        ...item,
        w: Math.min(item.w, maxCols),
        x: Math.min(item.x, Math.max(0, maxCols - item.w)),
      }));
    };

    // Helper function to reflow layout for small screens (sort by y then x, then pack)
    const reflowLayout = (layout: Layout[], maxCols: number): Layout[] => {
      // Sort by y (vertical) first, then x (horizontal)
      const sorted = [...layout].sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
      });

      // Pack items into new layout
      const result: Layout[] = [];
      let currentX = 0;
      let currentY = 0;
      let rowHeight = 0;

      sorted.forEach((item) => {
        const w = Math.min(item.w, maxCols);

        // If widget doesn't fit in current row, move to next row
        if (currentX + w > maxCols) {
          currentX = 0;
          currentY += rowHeight;
          rowHeight = 0;
        }

        result.push({
          ...item,
          w,
          x: currentX,
          y: currentY,
        });

        currentX += w;
        rowHeight = Math.max(rowHeight, item.h);
      });

      return result;
    };

    return {
      xl: baseLayout,
      lg: clampLayoutWidth(baseLayout, 8),
      md: clampLayoutWidth(baseLayout, 6),
      sm: reflowLayout(baseLayout, 4),
      xs: reflowLayout(baseLayout, 2),
      xxs: reflowLayout(baseLayout, 1),
    };
  }, [sortedWidgets]);

  // Save layout with debounce
  const saveLayout = useCallback(
    (allLayouts: Layouts) => {
      // Use current breakpoint's layout to save user changes
      // Fallback order: current breakpoint -> xl -> lg -> any available layout
      const layoutToSave =
        allLayouts[currentBreakpoint as keyof Layouts] ||
        allLayouts.xl ||
        allLayouts.lg ||
        allLayouts.md ||
        allLayouts.sm;

      if (!layoutToSave || layoutToSave.length === 0) return;

      const updates: Promise<unknown>[] = [];
      const currentWidgets = widgetsRef.current;

      layoutToSave.forEach((item) => {
        const widget = currentWidgets.find((w) => w.id === item.i);
        if (widget) {
          const currentPosition = parseWidgetPosition(widget as any);
          const newPosition: WidgetPosition = {
            x: item.x,
            y: item.y,
            width: item.w,
            height: item.h,
          };

          // Only update if position changed
          if (
            currentPosition.x !== newPosition.x ||
            currentPosition.y !== newPosition.y ||
            currentPosition.width !== newPosition.width ||
            currentPosition.height !== newPosition.height
          ) {
            updates.push(
              updateMutation.mutateAsync({
                id: widget.id!,
                position: stringifyWidgetPosition(newPosition),
              })
            );
          }
        }
      });

      // Wait for all updates to complete, then refresh data
      if (updates.length > 0) {
        Promise.all(updates).then(() => {
          queryClient.invalidateQueries({ queryKey: ['widgets', workspaceId] });
        });
      }
    },
    [currentBreakpoint, updateMutation, queryClient, workspaceId]
  );

  const handleLayoutChange = useCallback(
    (_currentLayout: Layout[], allLayouts: Layouts) => {
      if (!isEditMode) return;

      // Clear any pending save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce the save operation
      saveTimeoutRef.current = setTimeout(() => {
        saveLayout(allLayouts);
      }, LAYOUT_SAVE_DEBOUNCE_MS);
    },
    [isEditMode, saveLayout]
  );

  const handleDeleteWidget = (widgetId: string) => {
    if (window.confirm(t('widgets.deleteConfirm'))) {
      deleteMutation.mutate(widgetId);
    }
  };

  const handleEditWidget = (widget: WidgetData) => {
    setEditingWidget(widget);
  };

  const handleBreakpointChange = useCallback((newBreakpoint: string) => {
    setCurrentBreakpoint(newBreakpoint);
  }, []);

  // Navigate to a folder
  const handleFolderClick = useCallback((folderId: string) => {
    setSearchParams({ folder: folderId });
    setIsPathDropdownOpen(false);
  }, [setSearchParams]);

  // Navigate to root
  const handleNavigateToRoot = useCallback(() => {
    setSearchParams({});
    setIsPathDropdownOpen(false);
  }, [setSearchParams]);

  // Get current folder name
  const currentFolderName = useMemo(() => {
    if (!folderPath || folderPath.length === 0) return '';
    const lastFolder = folderPath[folderPath.length - 1];
    try {
      const config = parseWidgetConfig(lastFolder as any) as FolderWidgetConfig;
      return config.name || 'Folder';
    } catch {
      return 'Folder';
    }
  }, [folderPath]);

  return (
    <OneColumn>
      <div className="w-full px-4 xl:px-0">
        <div className="py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 h-10">
              <SidebarButton />

              {/* Folder Path Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsPathDropdownOpen(!isPathDropdownOpen)}
                  className="flex gap-2 items-center max-w-[calc(100vw-165px)] overflow-x-auto whitespace-nowrap sm:text-xl font-semibold hide-scrollbar hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg px-2 py-1 transition-colors"
                >
                  
                  {currentFolderId ? 
                      <span>{currentFolderName}</span>
                      :<span>{getWorkspaceById(workspaceId)?.name ?? ""}</span>
                  }
                </button>

                {/* Dropdown Menu */}
                {isPathDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsPathDropdownOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-neutral-900 border dark:border-neutral-700 rounded-lg shadow-lg z-20 min-w-[200px]">
                      <div className="py-1">
                        <button
                          onClick={handleNavigateToRoot}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
                        >
                          <span>{getWorkspaceById(workspaceId)?.name ?? ""}</span>
                        </button>

                        {folderPath && folderPath.map((folder, index) => {
                          const config = parseWidgetConfig(folder as any) as FolderWidgetConfig;
                          const folderName = config.name || 'Folder';
                          return (
                            <button
                              key={folder.id}
                              onClick={() => handleFolderClick(folder.id!)}
                              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
                              style={{ paddingLeft: `${(index + 1) * 12 + 16}px` }}
                            >
                              <span>{folderName}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <button
                aria-label="toggle edit mode"
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isEditMode
                  ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'
                  }`}
              >
                <Settings2 size={20} />
              </button>
              <AddWidgetMenu parentId={currentFolderId} />
            </div>
          </div>

          <div className="mt-2">
            {isLoading ? (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-48 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : sortedWidgets.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-500 dark:text-gray-400 mb-4">
                  {t('widgets.noWidgets')}
                </div>
              </div>
            ) : (
              <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                breakpoints={{ xl: 1400, lg: 1183, md: 983, sm: 640, xs: 320, xxs: 200 }}
                cols={{ xl: 10, lg: 8, md: 6, sm: 4, xs: 2, xxs: 1 }}
                rowHeight={60}
                containerPadding={[0, 0]}
                onLayoutChange={handleLayoutChange}
                onBreakpointChange={handleBreakpointChange}
                isDraggable={isEditMode}
                isResizable={isEditMode}
                draggableHandle=".widget-drag-handle"
                compactType={null}
                preventCollision={true}
              >
                {sortedWidgets.map((widget) => (
                  <div
                    key={widget.id}
                    className="bg-white dark:bg-neutral-900 border dark:border-neutral-700 rounded-lg"
                  >
                    <WidgetRenderer
                      widget={widget}
                      isEditMode={isEditMode}
                      canDragResize={isEditMode}
                      onEdit={() => handleEditWidget(widget)}
                      onDelete={() => handleDeleteWidget(widget.id!)}
                      onFolderClick={handleFolderClick}
                    />
                  </div>
                ))}
              </ResponsiveGridLayout>
            )}
          </div>
        </div>
      </div>

      {editingWidget && (
        <EditWidgetDialog
          widget={editingWidget}
          isOpen={!!editingWidget}
          onClose={() => setEditingWidget(null)}
        />
      )}
    </OneColumn>
  );
};

export default WorkspaceHomePage;