import { FC, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { getView, getViewObjects } from '@/api/view';
import useCurrentWorkspaceId from '@/hooks/use-currentworkspace-id';
import { ViewWidgetConfig } from '@/types/widget';
import { MapMarkerData, CalendarSlotData, ViewObject } from '@/types/view';
import MiniMapView from '@/components/notedetailsidebar/MiniMapView';
import MiniCalendarView from '@/components/notedetailsidebar/MiniCalendarView';
import Widget from '@/components/widgets/Widget';

interface ViewWidgetProps {
  config: ViewWidgetConfig;
}

const ViewWidget: FC<ViewWidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();

  const { data: view, isLoading: isLoadingView } = useQuery({
    queryKey: ['view', workspaceId, config.viewId],
    queryFn: () => getView(workspaceId, config.viewId),
    enabled: !!workspaceId && !!config.viewId,
  });

  const { data: objects = [] } = useQuery({
    queryKey: ['view-objects', workspaceId, config.viewId],
    queryFn: () => getViewObjects(workspaceId, config.viewId, 1, 100),
    enabled: !!workspaceId && !!config.viewId,
  });

  // Parse markers from view objects for map view
  const markers = useMemo(() => {
    if (view?.type !== 'map') return [];
    return objects
      .filter((obj: ViewObject) => obj.type === 'map_marker')
      .map((obj: ViewObject) => {
        try {
          return JSON.parse(obj.data) as MapMarkerData;
        } catch {
          return null;
        }
      })
      .filter((m): m is MapMarkerData => m !== null);
  }, [objects, view?.type]);

  // Parse slots from view objects for calendar view
  const slots = useMemo(() => {
    if (view?.type !== 'calendar') return [];
    return objects
      .filter((obj: ViewObject) => obj.type === 'calendar_slot')
      .map((obj: ViewObject) => {
        try {
          return JSON.parse(obj.data) as CalendarSlotData;
        } catch {
          // If data is a direct date string
          return { date: obj.data } as CalendarSlotData;
        }
      })
      .filter((s): s is CalendarSlotData => s !== null && !!s.date);
  }, [objects, view?.type]);

  if (!config.viewId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        {t('widgets.noViewSelected')}
      </div>
    );
  }

  if (isLoadingView) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-500" size={24} />
      </div>
    );
  }

  if (!view) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        {t('widgets.viewNotFound')}
      </div>
    );
  }

  return (
    <Widget withPadding={false}>

      <div className="h-full flex flex-col">
        {view.type === 'map' ? (
          <MiniMapView
            markers={markers}
            viewObjects={objects}
            viewId={config.viewId}
            workspaceId={workspaceId}
          />
        ) : (
          <MiniCalendarView
            slots={slots}
            viewObjects={objects}
            viewId={config.viewId}
            workspaceId={workspaceId}
          />
        )}
      </div>
    </Widget>
  );
};

export default ViewWidget;