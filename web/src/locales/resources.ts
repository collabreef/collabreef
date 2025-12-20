import en from '@/locales/en';
import zhTW from '@/locales/zh-TW';

export const resources = {
  en: {
    translation: en,
  },
  'zh-TW': {
    translation: zhTW,
  },
} as const;

export type I18nNamespace = keyof typeof resources['en'];
