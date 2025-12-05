import { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ExternalLink, AlertCircle, Loader2, Rss } from 'lucide-react';
import { useParams } from 'react-router';
import { RssWidgetConfig } from '@/types/widget';
import Widget from '@/components/widgets/Widget';
import { registerWidget, WidgetProps, WidgetConfigFormProps } from '../widgetRegistry';
import { fetchRSSFeed } from '@/api/rss';

interface RssWidgetProps extends WidgetProps {
  config: RssWidgetConfig;
}

const RssWidget: FC<RssWidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const maxItems = config.maxItems ?? 10;
  const showDescription = config.showDescription ?? true;
  const showDate = config.showDate ?? true;
  const autoRefresh = config.autoRefresh ?? 0;

  const { data: feed, isLoading, error } = useQuery({
    queryKey: ['rss-feed', config.feedUrl],
    queryFn: () => fetchRSSFeed(config.feedUrl),
    enabled: !!config.feedUrl && !!workspaceId,
    refetchInterval: autoRefresh > 0 ? autoRefresh * 60 * 1000 : false,
    retry: 1,
  });

  if (!config.feedUrl) {
    return (
      <Widget>
        <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm gap-2">
          <Rss size={32} className="opacity-50" />
          <div>{t('widgets.rss.noFeedUrl')}</div>
        </div>
      </Widget>
    );
  }

  if (isLoading) {
    return (
      <Widget>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="animate-spin text-gray-500" size={32} />
        </div>
      </Widget>
    );
  }

  if (error) {
    return (
      <Widget>
        <div className="h-full flex flex-col items-center justify-center gap-2 text-red-500 text-sm px-4 text-center">
          <AlertCircle size={32} />
          <div>{t('widgets.rss.fetchError')}</div>
        </div>
      </Widget>
    );
  }

  const displayItems = feed?.items?.slice(0, maxItems) || [];

  return (
    <Widget>
      <div className="flex flex-col h-full">
        {/* Feed header */}
        {feed?.title && (
          <div className="flex items-center gap-2 mb-3 pb-2 border-b dark:border-neutral-700">
            <Rss size={18} className="text-orange-500 flex-shrink-0" />
            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
              {feed.title}
            </div>
          </div>
        )}

        {/* Feed items */}
        <div className="flex-1 overflow-auto space-y-3">
          {displayItems.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              {t('widgets.rss.noItems')}
            </div>
          ) : (
            displayItems.map((item, index) => (
              <a
                key={item.guid || item.link || index}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 border dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {item.title}
                    </div>
                    {showDescription && item.description && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                        {item.description}
                      </div>
                    )}
                    {showDate && item.pubDate && (
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {new Date(item.pubDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    )}
                  </div>
                  <ExternalLink size={16} className="flex-shrink-0 text-gray-400 mt-0.5" />
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </Widget>
  );
};

// Configuration Form Component
export const RssWidgetConfigForm: FC<WidgetConfigFormProps<RssWidgetConfig>> = ({
  config,
  onChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('widgets.rss.config.feedUrl')} <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          value={config.feedUrl || ''}
          onChange={(e) => onChange({ ...config, feedUrl: e.target.value })}
          placeholder="https://example.com/feed.xml"
          className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <p className="text-xs text-gray-500 mt-1">{t('widgets.rss.config.feedUrlHint')}</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t('widgets.rss.config.maxItems')}
        </label>
        <input
          type="number"
          min="1"
          max="50"
          value={config.maxItems ?? 10}
          onChange={(e) => onChange({ ...config, maxItems: parseInt(e.target.value) || 10 })}
          className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showDescription"
          checked={config.showDescription ?? true}
          onChange={(e) => onChange({ ...config, showDescription: e.target.checked })}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="showDescription" className="text-sm cursor-pointer">
          {t('widgets.rss.config.showDescription')}
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showDate"
          checked={config.showDate ?? true}
          onChange={(e) => onChange({ ...config, showDate: e.target.checked })}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="showDate" className="text-sm cursor-pointer">
          {t('widgets.rss.config.showDate')}
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t('widgets.rss.config.autoRefresh')}
        </label>
        <input
          type="number"
          min="0"
          max="1440"
          value={config.autoRefresh ?? 0}
          onChange={(e) => onChange({ ...config, autoRefresh: parseInt(e.target.value) || 0 })}
          placeholder="0"
          className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">{t('widgets.rss.config.autoRefreshHint')}</p>
      </div>
    </div>
  );
};

// Register widget
registerWidget({
  type: 'rss',
  label: 'widgets.types.rss',
  description: 'widgets.types.rssDesc',
  defaultConfig: {
    feedUrl: '',
    maxItems: 10,
    showDescription: true,
    showDate: true,
    autoRefresh: 0,
  },
  Component: RssWidget,
  ConfigForm: RssWidgetConfigForm,
});

export default RssWidget;
