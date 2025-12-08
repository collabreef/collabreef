import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, AlertTriangle } from 'lucide-react';
import { IframeWidgetConfig } from '@/types/widget';
import Widget from '@/components/widgets/Widget';
import { registerWidget, WidgetProps, WidgetConfigFormProps } from '../widgetRegistry';

interface IframeWidgetProps extends WidgetProps {
  config: IframeWidgetConfig;
}

const IframeWidget: FC<IframeWidgetProps> = ({ config }) => {
  const { t } = useTranslation();

  if (!config.url) {
    return (
      <Widget withPadding={false}>
        <div className="h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 text-sm">
          <Globe size={48} className="mb-4" />
          <p>{t('widgets.iframe.noUrl')}</p>
        </div>
      </Widget>
    );
  }

  // Build sandbox attribute from array if provided
  const sandboxAttr = config.sandbox && config.sandbox.length > 0
    ? config.sandbox.join(' ')
    : undefined;

  // Build allow attribute from array if provided
  const allowAttr = config.allow && config.allow.length > 0
    ? config.allow.join('; ')
    : undefined;

  // Default allow fullscreen to true
  const allowFullscreen = config.allowFullscreen !== false;

  return (
    <Widget withPadding={false}>
      <div className="relative w-full h-full bg-white dark:bg-neutral-900">
        <iframe
          src={config.url}
          title={config.title || 'Iframe Widget'}
          className="w-full h-full border-0"
          sandbox={sandboxAttr}
          allow={allowAttr}
          allowFullScreen={allowFullscreen}
          loading="lazy"
        />
      </div>
    </Widget>
  );
};

// Complete list of iframe sandbox attributes
const SANDBOX_OPTIONS = [
  'allow-downloads',
  'allow-forms',
  'allow-modals',
  'allow-orientation-lock',
  'allow-pointer-lock',
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-presentation',
  'allow-same-origin',
  'allow-scripts',
  'allow-storage-access-by-user-activation',
  'allow-top-navigation',
  'allow-top-navigation-by-user-activation',
  'allow-top-navigation-to-custom-protocols',
] as const;

// Complete list of permission policy / allow attribute features
const PERMISSION_OPTIONS = [
  'accelerometer',
  'ambient-light-sensor',
  'autoplay',
  'battery',
  'camera',
  'display-capture',
  'document-domain',
  'encrypted-media',
  'fullscreen',
  'geolocation',
  'gyroscope',
  'magnetometer',
  'microphone',
  'midi',
  'payment',
  'picture-in-picture',
  'publickey-credentials-get',
  'screen-wake-lock',
  'usb',
  'web-share',
  'xr-spatial-tracking',
] as const;

// Configuration Form Component
export const IframeWidgetConfigForm: FC<WidgetConfigFormProps<IframeWidgetConfig>> = ({
  config,
  onChange,
}) => {
  const { t } = useTranslation();
  const [showSandbox, setShowSandbox] = useState(false);
  const [showAllow, setShowAllow] = useState(false);

  // Handler for toggling sandbox options
  const handleSandboxToggle = (option: string) => {
    const currentSandbox = config.sandbox || [];
    const newSandbox = currentSandbox.includes(option)
      ? currentSandbox.filter(item => item !== option)
      : [...currentSandbox, option];
    onChange({ ...config, sandbox: newSandbox });
  };

  // Handler for toggling permission options
  const handlePermissionToggle = (option: string) => {
    const currentAllow = config.allow || [];
    const newAllow = currentAllow.includes(option)
      ? currentAllow.filter(item => item !== option)
      : [...currentAllow, option];
    onChange({ ...config, allow: newAllow });
  };

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('widgets.iframe.config.url')} <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          value={config.url || ''}
          onChange={(e) => onChange({ ...config, url: e.target.value })}
          placeholder="https://example.com"
          className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t('widgets.iframe.config.urlHint')}
        </p>
      </div>

      {/* Title Input */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('widgets.iframe.config.title')}
        </label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          placeholder={t('widgets.iframe.config.titlePlaceholder')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Allow Fullscreen */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="allowFullscreen"
          checked={config.allowFullscreen !== false}
          onChange={(e) => onChange({ ...config, allowFullscreen: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="allowFullscreen" className="text-sm">
          {t('widgets.iframe.config.allowFullscreen')}
        </label>
      </div>

      {/* Sandbox Accordion */}
      <div className="border border-gray-300 dark:border-neutral-600 rounded-lg">
        <button
          type="button"
          onClick={() => setShowSandbox(!showSandbox)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors rounded-lg"
        >
          <span className="text-sm font-medium">sandbox</span>
          <span className="text-gray-500 dark:text-gray-400">
            {showSandbox ? '−' : '+'}
          </span>
        </button>
        {showSandbox && (
          <div className="px-4 pb-4 border-t border-gray-300 dark:border-neutral-600">
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2 mt-3">
              {SANDBOX_OPTIONS.map((option) => (
                <div key={option} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`sandbox-${option}`}
                    checked={config.sandbox?.includes(option) || false}
                    onChange={() => handleSandboxToggle(option)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor={`sandbox-${option}`} className="text-sm font-mono cursor-pointer">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Allow Accordion */}
      <div className="border border-gray-300 dark:border-neutral-600 rounded-lg">
        <button
          type="button"
          onClick={() => setShowAllow(!showAllow)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors rounded-lg"
        >
          <span className="text-sm font-medium">allow</span>
          <span className="text-gray-500 dark:text-gray-400">
            {showAllow ? '−' : '+'}
          </span>
        </button>
        {showAllow && (
          <div className="px-4 pb-4 border-t border-gray-300 dark:border-neutral-600">
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2 mt-3">
              {PERMISSION_OPTIONS.map((option) => (
                <div key={option} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`permission-${option}`}
                    checked={config.allow?.includes(option) || false}
                    onChange={() => handlePermissionToggle(option)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor={`permission-${option}`} className="text-sm font-mono cursor-pointer">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          {t('widgets.iframe.config.securityNotice')}
        </p>
      </div>
    </div>
  );
};

// Register widget
registerWidget({
  type: 'iframe',
  label: 'widgets.types.iframe',
  description: 'widgets.types.iframeDesc',
  defaultConfig: {
    url: '',
    allowFullscreen: true,
  },
  Component: IframeWidget,
  ConfigForm: IframeWidgetConfigForm,
});

export default IframeWidget;
