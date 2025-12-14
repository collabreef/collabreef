import { FC, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Video as VideoIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { VideoWidgetConfig } from '@/types/widget';
import { FileInfo, listFiles } from '@/api/file';
import useCurrentWorkspaceId from '@/hooks/use-currentworkspace-id';
import Widget from '@/components/widgets/Widget';
import { registerWidget, WidgetProps, WidgetConfigFormProps } from '../widgetRegistry';

interface VideoWidgetProps extends WidgetProps {
  config: VideoWidgetConfig;
}

const VideoWidget: FC<VideoWidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const videoUrls = config.videoUrls || [];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + videoUrls.length) % videoUrls.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % videoUrls.length);
  };

  const getCurrentFileName = () => {
    if (videoUrls.length === 0) return '';
    const url = videoUrls[currentIndex];
    const parts = url.split('/');
    return decodeURIComponent(parts[parts.length - 1]);
  };

  if (videoUrls.length === 0) {
    return (
      <Widget withPadding={false}>
        <div className="h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 text-sm">
          <VideoIcon size={48} className="mb-4" />
          <p>{t('widgets.video.noVideo')}</p>
        </div>
      </Widget>
    );
  }

  return (
    <Widget withPadding={false}>
      <div className="relative w-full h-full bg-gray-100 dark:bg-neutral-900">
        {/* Video Display */}
        <div className="w-full h-full flex flex-col">
          <video
            key={videoUrls[currentIndex]}
            src={videoUrls[currentIndex]}
            controls
            className="flex-1 w-full h-full object-contain"
          >
            {t('widgets.video.notSupported')}
          </video>

          {/* Video Info */}
          <div className="px-3 py-2 bg-gray-50 dark:bg-neutral-800 border-t dark:border-neutral-700">
            <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
              {getCurrentFileName()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {currentIndex + 1} / {videoUrls.length}
            </p>
          </div>
        </div>

        {/* Navigation Buttons - Only show if more than one video */}
        {videoUrls.length > 1 && (
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            <button
              onClick={handlePrevious}
              className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all"
              aria-label={t('widgets.video.previous')}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all"
              aria-label={t('widgets.video.next')}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </Widget>
  );
};

// Configuration Form Component
export const VideoWidgetConfigForm: FC<WidgetConfigFormProps<VideoWidgetConfig>> = ({
  config,
  onChange,
}) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const [availableFiles, setAvailableFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load video files
  useEffect(() => {
    const loadVideoFiles = async () => {
      setIsLoading(true);
      try {
        const result = await listFiles(workspaceId, searchQuery, '.mp4,.webm,.ogg,.mov,.avi,.mkv', 100, 1);
        setAvailableFiles(result.files || []);
      } catch (error) {
        console.error('Failed to load video files:', error);
        setAvailableFiles([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadVideoFiles();
    }, 300);

    return () => clearTimeout(timer);
  }, [workspaceId, searchQuery]);

  const handleToggleFile = (file: FileInfo) => {
    const fileUrl = `/api/v1/workspaces/${workspaceId}/files/${file.name}`;
    const currentUrls = config.videoUrls || [];

    if (currentUrls.includes(fileUrl)) {
      // Remove file
      onChange({
        ...config,
        videoUrls: currentUrls.filter(url => url !== fileUrl)
      });
    } else {
      // Add file
      onChange({
        ...config,
        videoUrls: [...currentUrls, fileUrl]
      });
    }
  };

  const isFileSelected = (file: FileInfo) => {
    const fileUrl = `/api/v1/workspaces/${workspaceId}/files/${file.name}`;
    return (config.videoUrls || []).includes(fileUrl);
  };

  const handleRemoveUrl = (index: number) => {
    const currentUrls = config.videoUrls || [];
    onChange({
      ...config,
      videoUrls: currentUrls.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-4">
      {/* Selected video files */}
      {(config.videoUrls || []).length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('widgets.video.config.videoFiles')} ({config.videoUrls?.length || 0})
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {(config.videoUrls || []).map((url, index) => {
              const fileName = decodeURIComponent(url.split('/').pop() || '');
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-500"
                >
                  <VideoIcon size={16} className="text-purple-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {fileName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveUrl(index)}
                    className="flex-shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and file list */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('widgets.video.config.selectVideoFiles')}
        </label>

        {/* Search input */}
        <div className="mb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search') || 'Search files...'}
            className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
          />
        </div>

        {/* File list */}
        <div className="border dark:border-neutral-600 rounded-lg max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : availableFiles.length > 0 ? (
            <div className="divide-y dark:divide-neutral-700">
              {availableFiles.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => handleToggleFile(file)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors ${
                    isFileSelected(file) ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                  }`}
                >
                  <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isFileSelected(file)
                      ? 'bg-purple-500 border-purple-500'
                      : 'border-gray-300 dark:border-neutral-600'
                  }`}>
                    {isFileSelected(file) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <VideoIcon size={18} className="text-purple-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {file.original_name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
              <VideoIcon size={32} className="mb-2" />
              <p className="text-sm">{t('widgets.video.config.noVideoFiles')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Register widget
registerWidget({
  type: 'video',
  label: 'widgets.types.video',
  description: 'widgets.types.videoDesc',
  defaultConfig: {
    videoUrls: [],
  },
  Component: VideoWidget,
  ConfigForm: VideoWidgetConfigForm,
});

export default VideoWidget;
