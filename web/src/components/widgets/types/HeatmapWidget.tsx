import { FC, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getNoteCountsByDate } from '@/api/stats';
import useCurrentWorkspaceId from '@/hooks/use-currentworkspace-id';
import { HeatmapWidgetConfig } from '@/types/widget';
import Widget from '@/components/widgets/Widget';
import { registerWidget, WidgetProps, WidgetConfigFormProps } from '../widgetRegistry';

interface HeatmapWidgetProps extends WidgetProps {
  config: HeatmapWidgetConfig;
}

interface DayData {
  isFirstDayOfMonth: boolean;
  month?: number;
  monthName?: string;
  date: string;
  count: number;
  level: number; // 0-4 for color intensity
}

interface WeekData {
  days: DayData[]
}

const HeatmapWidget: FC<HeatmapWidgetProps> = ({ config }) => {
  const { t, i18n } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const dayCount = config.dayCount ?? 365;
  const showLegend = config.showLegend ?? true;

  // Get timezone offset in minutes (negative for timezones ahead of UTC)
  const timezoneOffset = -new Date().getTimezoneOffset();

  const { data: noteCountsData = [], isLoading } = useQuery({
    queryKey: ['note-counts-by-date', workspaceId, dayCount, timezoneOffset],
    queryFn: () => getNoteCountsByDate(workspaceId, dayCount, timezoneOffset),
    enabled: !!workspaceId,
  });

  const heatmapData = useMemo(() => {
    // Use local dates since backend adjusts for timezone
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate array of days
    const days: DayData[] = [];
    const countMap = new Map<string, number>();

    // Build count map from API response
    if (noteCountsData && Array.isArray(noteCountsData)) {
      noteCountsData.forEach((item) => {
        countMap.set(item.date, item.count);
      });
    }

    // Find max count for normalization
    const maxCount = Math.max(...Array.from(countMap.values()), 1);

    // Month names mapping
    const monthNamesMap: { [key: number]: { en: string, zh: string } } = {
      1: { en: 'Jan', zh: '1月' },
      2: { en: 'Feb', zh: '2月' },
      3: { en: 'Mar', zh: '3月' },
      4: { en: 'Apr', zh: '4月' },
      5: { en: 'May', zh: '5月' },
      6: { en: 'Jun', zh: '6月' },
      7: { en: 'Jul', zh: '7月' },
      8: { en: 'Aug', zh: '8月' },
      9: { en: 'Sep', zh: '9月' },
      10: { en: 'Oct', zh: '10月' },
      11: { en: 'Nov', zh: '11月' },
      12: { en: 'Dec', zh: '12月' }
    };
    const lang = i18n.language.includes('zh') ? 'zh' : 'en';

    // Generate data for each day using local timezone
    for (let i = dayCount - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      // Format as YYYY-MM-DD in local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const count = countMap.get(dateStr) || 0;

      // Calculate level (0-4) based on count
      let level = 0;
      if (count > 0) {
        const ratio = count / maxCount;
        if (ratio <= 0.25) level = 1;
        else if (ratio <= 0.5) level = 2;
        else if (ratio <= 0.75) level = 3;
        else level = 4;
      }

      const monthNum = date.getMonth() + 1;
      const monthName = monthNamesMap[monthNum]?.[lang] || String(monthNum);

      days.push({
        isFirstDayOfMonth: date.getDate() === 1,
        month: monthNum,
        monthName,
        date: dateStr,
        count,
        level
      });
    }

    return days;
  }, [noteCountsData, dayCount, i18n.language]);

  const totalCount = useMemo(() => {
    let totalCount = 0
    noteCountsData.forEach(item => {
      totalCount += item.count
    });

    return totalCount
  }, [noteCountsData])

  // Group days by week
  const weeks = useMemo(() => {
    const result: WeekData[] = [];
    let currentWeek: DayData[] = [];

    heatmapData.forEach((day, index) => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();

      // Start a new week on Sunday (0)
      if (index === 0) {
        // Fill in empty days at the start
        for (let i = 0; i < dayOfWeek; i++) {
          currentWeek.push({ isFirstDayOfMonth: false, date: '', count: 0, level: 0 });
        }
      }

      currentWeek.push(day);

      // End week on Saturday (6)
      if (dayOfWeek === 6 || index === heatmapData.length - 1) {
        // Fill in empty days at the end if needed
        while (currentWeek.length < 7) {
          currentWeek.push({ isFirstDayOfMonth: false, date: '', count: 0, level: 0 });
        }

        result.push({ days: currentWeek });
        currentWeek = [];
      }
    });

    return result;
  }, [heatmapData]);

  const getLevelColor = (level: number) => {
    const colors = [
      'bg-neutral-100 dark:bg-neutral-800', // 0 - no activity
      'bg-green-200 dark:bg-green-900', // 1 - low
      'bg-green-400 dark:bg-green-700', // 2 - medium
      'bg-green-500 dark:bg-green-600', // 3 - high
      'bg-green-600 dark:bg-green-500', // 4 - very high
    ];
    return colors[level] || colors[0];
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Widget>
        <div className="h-full flex items-center justify-center">
          <div className="animate-pulse text-gray-500">{t('common.loading')}</div>
        </div>
      </Widget>
    );
  }

  return (
    <Widget>
      <div className="flex flex-col gap-3 overflow-auto h-full">
        {/* Heatmap Grid */}
        <div className="h-full flex gap-1 overflow-x-auto overflow-y-hidden">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="h-full grid grid-rows-8 text-nowrap gap-1">
              <div className="text-xs text-gray-600 dark:text-gray-400 relative">
                <div className=' absolute'>
                {(() => {
                  const firstDay = week.days.find(x => x.isFirstDayOfMonth);
                  return firstDay?.monthName || "";
                })()}
                </div>
              </div>
              {week.days.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`h-full aspect-square rounded-sm transition-colors ${day.date ? getLevelColor(day.level) : 'bg-transparent'
                    }`}
                  title={day.date ? `${formatDate(day.date)}: ${day.count} notes` : ''}
                />

              ))}
            </div>
          ))}

        </div>

        {/* Legend */}
        {showLegend && (
          <div className='flex justify-between'>
            <div className='text-gray-600 dark:text-gray-400 text-sm'>
              {t('widgets.notesInLastDays', { totalCount, dayCount })}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span>{t('widgets.less')}</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`w-3 h-3 rounded-sm ${getLevelColor(level)}`}
                  />
                ))}
              </div>
              <span>{t('widgets.more')}</span>
            </div>
          </div>
        )}
      </div>
    </Widget>
  );
};

// Configuration Form Component
export const HeatmapWidgetConfigForm: FC<WidgetConfigFormProps<HeatmapWidgetConfig>> = ({
  config,
  onChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('widgets.config.dayCount')}
        </label>
        <input
          type="number"
          min="30"
          max="365"
          value={config.dayCount ?? 365}
          onChange={(e) => onChange({ ...config, dayCount: parseInt(e.target.value) || 365 })}
          className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
        />
        <p className="text-xs text-gray-500 mt-1">
          {t('widgets.config.dayCountHint')}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showLegend"
          checked={config.showLegend ?? true}
          onChange={(e) => onChange({ ...config, showLegend: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="showLegend" className="text-sm">
          {t('widgets.config.showLegend')}
        </label>
      </div>
    </div>
  );
};

// Register widget
registerWidget({
  type: 'heatmap',
  label: 'widgets.types.heatmap',
  description: 'widgets.types.heatmapDesc',
  defaultConfig: {
    dayCount: 365,
    showLegend: true,
  },
  Component: HeatmapWidget,
  ConfigForm: HeatmapWidgetConfigForm,
});

export default HeatmapWidget;
