import { FC, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, SkipForward, SkipBack, Music as MusicIcon, X } from 'lucide-react';
import { MusicWidgetConfig } from '@/types/widget';
import { FileInfo, listFiles } from '@/api/file';
import useCurrentWorkspaceId from '@/hooks/use-currentworkspace-id';
import Widget from '@/components/widgets/Widget';
import { registerWidget, WidgetProps, WidgetConfigFormProps } from '../widgetRegistry';

interface MusicWidgetProps extends WidgetProps {
  config: MusicWidgetConfig;
}

const MusicWidget: FC<MusicWidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioUrls = config.audioUrls || [];

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = () => {
    const newIndex = (currentIndex - 1 + audioUrls.length) % audioUrls.length;
    setCurrentIndex(newIndex);
    setIsPlaying(false);
  };

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % audioUrls.length;
    setCurrentIndex(newIndex);
    setIsPlaying(false);
  };

  const handleEnded = () => {
    // Auto play next track
    if (currentIndex < audioUrls.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const getCurrentFileName = () => {
    if (audioUrls.length === 0) return '';
    const url = audioUrls[currentIndex];
    const parts = url.split('/');
    return decodeURIComponent(parts[parts.length - 1]);
  };

  if (audioUrls.length === 0) {
    return (
      <Widget>
        <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
          <MusicIcon size={48} className="mb-4" />
          <p>{t('widgets.music.noAudio')}</p>
        </div>
      </Widget>
    );
  }

  return (
    <Widget>
      <div className="h-full flex flex-col justify-between">
        {/* Audio element */}
        <audio
          ref={audioRef}
          src={audioUrls[currentIndex]}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Track info */}
        <div className="flex-1 flex flex-col items-center justify-center mb-4">
          <MusicIcon size={64} className="text-blue-500 mb-4" />
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 text-center px-4">
            {getCurrentFileName()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {currentIndex + 1} / {audioUrls.length}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePrevious}
            disabled={audioUrls.length <= 1}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t('widgets.music.previous')}
          >
            <SkipBack size={20} />
          </button>

          <button
            onClick={handlePlayPause}
            className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
            aria-label={isPlaying ? t('widgets.music.pause') : t('widgets.music.play')}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>

          <button
            onClick={handleNext}
            disabled={audioUrls.length <= 1}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t('widgets.music.next')}
          >
            <SkipForward size={20} />
          </button>
        </div>
      </div>
    </Widget>
  );
};

// Configuration Form Component
export const MusicWidgetConfigForm: FC<WidgetConfigFormProps<MusicWidgetConfig>> = ({
  config,
  onChange,
}) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const [availableFiles, setAvailableFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load audio files
  useEffect(() => {
    const loadAudioFiles = async () => {
      setIsLoading(true);
      try {
        const result = await listFiles(workspaceId, searchQuery, '.mp3,.wav,.ogg,.m4a,.flac,.aac', 100, 1);
        setAvailableFiles(result.files || []);
      } catch (error) {
        console.error('Failed to load audio files:', error);
        setAvailableFiles([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadAudioFiles();
    }, 300);

    return () => clearTimeout(timer);
  }, [workspaceId, searchQuery]);

  const handleToggleFile = (file: FileInfo) => {
    const fileUrl = `/api/v1/workspaces/${workspaceId}/files/${file.name}`;
    const currentUrls = config.audioUrls || [];

    if (currentUrls.includes(fileUrl)) {
      // Remove file
      onChange({
        ...config,
        audioUrls: currentUrls.filter(url => url !== fileUrl)
      });
    } else {
      // Add file
      onChange({
        ...config,
        audioUrls: [...currentUrls, fileUrl]
      });
    }
  };

  const isFileSelected = (file: FileInfo) => {
    const fileUrl = `/api/v1/workspaces/${workspaceId}/files/${file.name}`;
    return (config.audioUrls || []).includes(fileUrl);
  };

  const handleRemoveUrl = (index: number) => {
    const currentUrls = config.audioUrls || [];
    onChange({
      ...config,
      audioUrls: currentUrls.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-4">
      {/* Selected audio files */}
      {(config.audioUrls || []).length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('widgets.music.config.audioFiles')} ({config.audioUrls?.length || 0})
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {(config.audioUrls || []).map((url, index) => {
              const fileName = decodeURIComponent(url.split('/').pop() || '');
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-500"
                >
                  <MusicIcon size={16} className="text-blue-500 flex-shrink-0" />
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
          {t('widgets.music.config.selectAudioFiles')}
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : availableFiles.length > 0 ? (
            <div className="divide-y dark:divide-neutral-700">
              {availableFiles.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => handleToggleFile(file)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors ${
                    isFileSelected(file) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isFileSelected(file)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300 dark:border-neutral-600'
                  }`}>
                    {isFileSelected(file) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <MusicIcon size={18} className="text-blue-500 flex-shrink-0" />
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
              <MusicIcon size={32} className="mb-2" />
              <p className="text-sm">{t('widgets.music.config.noAudioFiles')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Register widget
registerWidget({
  type: 'music',
  label: 'widgets.types.music',
  description: 'widgets.types.musicDesc',
  defaultConfig: {
    audioUrls: [],
  },
  Component: MusicWidget,
  ConfigForm: MusicWidgetConfigForm,
});

export default MusicWidget;
