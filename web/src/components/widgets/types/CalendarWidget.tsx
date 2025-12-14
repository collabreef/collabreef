import { FC, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Loader2, ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';
import { getView, getViewObjects, getViews } from '@/api/view';
import useCurrentWorkspaceId from '@/hooks/use-currentworkspace-id';
import { CalendarWidgetConfig } from '@/types/widget';
import { CalendarSlotData, ViewObject } from '@/types/view';
import { Link } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import Widget from '@/components/widgets/Widget';
import { registerWidget, WidgetProps, WidgetConfigFormProps } from '../widgetRegistry';

interface CalendarWidgetProps extends WidgetProps {
  config: CalendarWidgetConfig;
}

const CalendarWidget: FC<CalendarWidgetProps> = ({ config }) => {
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

  // Parse slots from view objects for calendar view
  const slots = useMemo(() => {
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
  }, [objects]);

  // Find the earliest date to determine the default month
  const defaultDate = useMemo(() => {
    if (slots.length === 0) return new Date();

    const dates = slots.map(slot => new Date(slot.date)).sort((a, b) => a.getTime() - b.getTime());
    return dates[0];
  }, [slots]);

  const [currentDate, setCurrentDate] = useState(defaultDate);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const calendarDays: (number | null)[] = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add all days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Check if a day has any slots
  const getSlotsForDay = (day: number | null) => {
    if (!day) return [];

    return slots.filter(slot => {
      const slotDate = new Date(slot.date);
      return (
        slotDate.getDate() === day &&
        slotDate.getMonth() === month &&
        slotDate.getFullYear() === year
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const handleDayClick = (day: number | null) => {
    if (!day) return;
    const daySlotsData = getSlotsForDay(day);
    if (daySlotsData.length > 0) {
      setSelectedDay(day);
    }
  };

  const selectedDaySlots = useMemo(() => {
    if (!selectedDay) return [];

    // Filter viewObjects directly by date to maintain 1:1 mapping
    return objects.filter(vo => {
      try {
        const date = new Date(vo.data);
        return (
          date.getDate() === selectedDay &&
          date.getMonth() === month &&
          date.getFullYear() === year
        );
      } catch {
        return false;
      }
    });
  }, [selectedDay, objects, year, month]);

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

  if (view.type !== 'calendar') {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        {t('widgets.invalidViewType')}
      </div>
    );
  }

  return (
    <Widget withPadding={false}>
      <div
        className="h-full flex flex-col items-start p-3 relative"
        onClick={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="font-semibold">
              {monthNames[month]} {year}
            </div>
            <Link
              to={`/workspaces/${workspaceId}/views/${config.viewId}`}
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 bg-white dark:bg-neutral-800 rounded shadow-sm hover:shadow-md transition-shadow border dark:border-neutral-600 flex items-center"
              title="Go to View"
            >
              <ExternalLink size={14} className="text-neutral-700 dark:text-neutral-300" />
            </Link>
          </div>
          <div>
            <button
              onClick={(e) => {
                e.preventDefault();
                previousMonth();
              }}
              className="p-3 rounded bg-white dark:bg-neutral-800"
              title="Previous month"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                nextMonth();
              }}
              className="p-3 rounded bg-white dark:bg-neutral-800"
              title="Next month"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className='flex-1 flex flex-col justify-start w-full'>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((d, i) => (
              <div key={i} className="flex items-center justify-center text-gray-500 dark:text-gray-400 aspect-square">
                {d}
              </div>
            ))}

            {calendarDays.map((d, index) => {
              const daySlotsData = getSlotsForDay(d);
              const slotCount = daySlotsData.length;

              // Determine background color based on slot count
              let bgColorClass = '';
              if (slotCount > 0) {
                if (slotCount === 1) {
                  bgColorClass = 'bg-blue-100 dark:bg-blue-900/30';
                } else if (slotCount === 2) {
                  bgColorClass = 'bg-blue-200 dark:bg-blue-800/40';
                } else if (slotCount === 3) {
                  bgColorClass = 'bg-blue-300 dark:bg-blue-700/50';
                } else {
                  bgColorClass = 'bg-blue-400 dark:bg-blue-600/60';
                }
              }

              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(d)}
                  className={twMerge(`
                    aspect-square flex items-center justify-center rounded transition-colors`,
                    d ? 'text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-800' : '',
                    slotCount > 0 ? `cursor-pointer ${bgColorClass}` : ''
                  )}
                >
                  {d}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected day info */}
        {selectedDay && selectedDaySlots.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 p-3 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border dark:border-neutral-700 z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sm">
                {monthNames[month]} {selectedDay}, {year}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedDay(null);
                }}
                aria-label='close'
                className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
              >
                <X size={14} />
              </button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {selectedDaySlots.map((viewObject) => (
                <Link
                  key={viewObject.id}
                  to={`/workspaces/${workspaceId}/views/${config.viewId}/objects/${viewObject.id}`}
                  className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 px-2 py-1.5 rounded transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {viewObject.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Widget>
  );
};

// Configuration Form Component
export const CalendarWidgetConfigForm: FC<WidgetConfigFormProps<CalendarWidgetConfig>> = ({
  config,
  onChange,
}) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();

  const { data: views = [] } = useQuery({
    queryKey: ['views', workspaceId],
    queryFn: () => getViews(workspaceId),
    enabled: !!workspaceId,
  });

  // Filter only calendar views
  const calendarViews = views.filter((view: any) => view.type === 'calendar');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">{t('widgets.config.selectView')}</label>
        <select
          value={config.viewId}
          onChange={(e) => onChange({ ...config, viewId: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
        >
          <option value="">{t('widgets.config.selectViewPlaceholder')}</option>
          {calendarViews.map((view: any) => (
            <option key={view.id} value={view.id}>
              {view.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showControls"
          checked={config.showControls}
          onChange={(e) => onChange({ ...config, showControls: e.target.checked })}
        />
        <label htmlFor="showControls" className="text-sm">{t('widgets.config.showControls')}</label>
      </div>
    </div>
  );
};

// Register widget
registerWidget({
  type: 'calendar',
  label: 'widgets.types.calendar',
  description: 'widgets.types.calendarDesc',
  defaultConfig: {
    viewId: '',
    showControls: true,
  },
  Component: CalendarWidget,
  ConfigForm: CalendarWidgetConfigForm,
  minWidth: 2,
  maxWidth: 2,
  minHeight: 6,
  maxHeight: 6,
});

export default CalendarWidget;
