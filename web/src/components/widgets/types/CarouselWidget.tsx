import { FC, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, X, FolderOpen } from 'lucide-react';
import { CarouselWidgetConfig } from '@/types/widget';
import { FileInfo, listFiles } from '@/api/file';
import useCurrentWorkspaceId from '@/hooks/use-currentworkspace-id';
import Widget from '@/components/widgets/Widget';
import { registerWidget, WidgetProps, WidgetConfigFormProps } from '../widgetRegistry';
import FilePickerDialog from '@/components/editor/extensions/imagenode/FilePickerDialog';

interface CarouselWidgetProps extends WidgetProps {
  config: CarouselWidgetConfig;
}

const CarouselWidget: FC<CarouselWidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const imageUrls = config.imageUrls || [];
  const autoPlay = config.autoPlay ?? false;
  const interval = (config.interval || 3) * 1000; // Convert to milliseconds

  useEffect(() => {
    if (!autoPlay || imageUrls.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % imageUrls.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, imageUrls.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % imageUrls.length);
  };

  if (imageUrls.length === 0) {
    return (
      <Widget withPadding={false}>
        <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 text-sm">
          {t('widgets.carousel.noImages')}
        </div>
      </Widget>
    );
  }

  return (
    <Widget withPadding={false}>
      <div className="relative w-full h-full overflow-hidden bg-gray-100 dark:bg-neutral-900">
        {/* Image Display */}
        <div className="w-full h-full flex items-center justify-center">
          <img
            src={imageUrls[currentIndex]}
            alt={`Slide ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Navigation Buttons - Top Right */}
        {imageUrls.length > 1 && (
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            <button
              onClick={handlePrevious}
              className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all"
              aria-label={t('widgets.carousel.previous')}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all"
              aria-label={t('widgets.carousel.next')}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Indicators - Bottom Center */}
        {imageUrls.length > 1 && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
            {imageUrls.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-white w-6'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </Widget>
  );
};

// Configuration Form Component
export const CarouselWidgetConfigForm: FC<WidgetConfigFormProps<CarouselWidgetConfig>> = ({
  config,
  onChange,
}) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const [filePickerOpen, setFilePickerOpen] = useState(false);

  const handleSelectFile = (file: FileInfo) => {
    const fileUrl = `/api/v1/workspaces/${workspaceId}/files/${file.name}`;
    const currentUrls = config.imageUrls || [];
    onChange({
      ...config,
      imageUrls: [...currentUrls, fileUrl]
    });
  };

  const handleRemoveUrl = (index: number) => {
    const currentUrls = config.imageUrls || [];
    onChange({
      ...config,
      imageUrls: currentUrls.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-4">
      {/* Image URLs */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('widgets.carousel.config.imageUrls')}
        </label>
        <div className="mb-2">
          <button
            type="button"
            onClick={() => setFilePickerOpen(true)}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
          >
            <FolderOpen size={18} />
            {t('widgets.carousel.config.selectFromFiles')}
          </button>
        </div>

        {/* Display added URLs */}
        {(config.imageUrls || []).length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(config.imageUrls || []).map((url, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-neutral-800 rounded-lg"
              >
                {/* Preview */}
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-16 h-16 object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect fill="%23ddd" width="64" height="64"/%3E%3C/svg%3E';
                  }}
                />

                {/* URL */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {url}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('widgets.carousel.config.imageNumber', { number: index + 1 })}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveUrl(index)}
                  className="flex-shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto Play */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="autoPlay"
          checked={config.autoPlay ?? false}
          onChange={(e) => onChange({ ...config, autoPlay: e.target.checked })}
        />
        <label htmlFor="autoPlay" className="text-sm">
          {t('widgets.carousel.config.autoPlay')}
        </label>
      </div>

      {/* Interval */}
      {config.autoPlay && (
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('widgets.carousel.config.interval')}
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={config.interval || 3}
            onChange={(e) => onChange({ ...config, interval: parseInt(e.target.value) || 3 })}
            className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('widgets.carousel.config.intervalHint')}
          </p>
        </div>
      )}

      {/* File Picker Dialog */}
      <FilePickerDialog
        open={filePickerOpen}
        onOpenChange={setFilePickerOpen}
        workspaceId={workspaceId}
        listFiles={listFiles}
        onSelect={handleSelectFile}
      />
    </div>
  );
};

// Register widget
registerWidget({
  type: 'carousel',
  label: 'widgets.types.carousel',
  description: 'widgets.types.carouselDesc',
  defaultConfig: {
    imageUrls: [],
    autoPlay: false,
    interval: 3,
  },
  Component: CarouselWidget,
  ConfigForm: CarouselWidgetConfigForm,
});

export default CarouselWidget;
