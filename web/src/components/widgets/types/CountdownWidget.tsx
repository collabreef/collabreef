import { FC, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';
import { CountdownWidgetConfig } from '@/types/widget';
import Widget from '@/components/widgets/Widget';
import { registerWidget, WidgetProps, WidgetConfigFormProps } from '../widgetRegistry';

interface CountdownWidgetProps extends WidgetProps {
  config: CountdownWidgetConfig;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

const CountdownWidget: FC<CountdownWidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      if (!config.targetDate) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: false,
        };
      }

      const now = new Date().getTime();
      const target = new Date(config.targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        };
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return {
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
      };
    };

    // Update immediately
    setTimeRemaining(calculateTimeRemaining());

    // Update every second
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [config.targetDate]);

  if (!config.targetDate) {
    return (
      <Widget>
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
          {t('widgets.countdown.noTargetDate')}
        </div>
      </Widget>
    );
  }

  return (
    <Widget>
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        {/* Title */}
        {config.title && (
          <div className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center">
            {config.title}
          </div>
        )}

        {/* Countdown Display */}
        {timeRemaining.isExpired ? (
          <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">
            {t('widgets.countdown.expired')}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {/* Days */}
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {timeRemaining.days}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('widgets.countdown.days')}
              </div>
            </div>

            {/* Hours */}
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {String(timeRemaining.hours).padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('widgets.countdown.hours')}
              </div>
            </div>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {String(timeRemaining.minutes).padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('widgets.countdown.minutes')}
              </div>
            </div>

            {/* Seconds */}
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {String(timeRemaining.seconds).padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('widgets.countdown.seconds')}
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {config.description && (
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {config.description}
          </div>
        )}

        {/* Target Date */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Calendar size={14} />
          <span>{new Date(config.targetDate).toLocaleString()}</span>
        </div>
      </div>
    </Widget>
  );
};

// Configuration Form Component
export const CountdownWidgetConfigForm: FC<WidgetConfigFormProps<CountdownWidgetConfig>> = ({
  config,
  onChange,
}) => {
  const { t } = useTranslation();

  // Format date to YYYY-MM-DDTHH:mm for datetime-local input
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Format as YYYY-MM-DDTHH:mm for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('widgets.countdown.config.targetDate')} *
        </label>
        <input
          type="datetime-local"
          value={formatDateForInput(config.targetDate)}
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value).toISOString() : '';
            onChange({ ...config, targetDate: date });
          }}
          className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t('widgets.countdown.config.title')}
        </label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          placeholder={t('widgets.countdown.config.titlePlaceholder')}
          className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t('widgets.countdown.config.description')}
        </label>
        <textarea
          value={config.description || ''}
          onChange={(e) => onChange({ ...config, description: e.target.value })}
          placeholder={t('widgets.countdown.config.descriptionPlaceholder')}
          className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800 min-h-[80px]"
          rows={3}
        />
      </div>
    </div>
  );
};

// Register widget
registerWidget({
  type: 'countdown',
  label: 'widgets.types.countdown',
  description: 'widgets.types.countdownDesc',
  defaultConfig: {
    targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default to 7 days from now
    title: '',
    description: '',
  },
  Component: CountdownWidget,
  ConfigForm: CountdownWidgetConfigForm,
});

export default CountdownWidget;
