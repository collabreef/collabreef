import en from '@/locales/en';
import zhTW from '@/locales/zh-TW';
import editorEn from '@/locales/en/editor';
import editorZhTW from '@/locales/zh-TW/editor';

export const resources = {
  en: {
    translation: en,
    editor: editorEn,
  },
  'zh-TW': {
    translation: zhTW,
    editor: editorZhTW,
  },
} as const;

export type I18nNamespace = keyof typeof resources['en'];
