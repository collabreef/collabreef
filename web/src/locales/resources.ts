import en from '@/locales/en';
import zhTW from '@/locales/zh-TW';
import zhCN from '@/locales/zh-CN';
import es from '@/locales/es';
import fr from '@/locales/fr';
import ar from '@/locales/ar';
import ptBR from '@/locales/pt-BR';
import de from '@/locales/de';
import ja from '@/locales/ja';
import ko from '@/locales/ko';
import ru from '@/locales/ru';
import it from '@/locales/it';

export const resources = {
  en: {
    translation: en,
  },
  'zh-TW': {
    translation: zhTW,
  },
  'zh-CN': {
    translation: zhCN,
  },
  es: {
    translation: es,
  },
  fr: {
    translation: fr,
  },
  ar: {
    translation: ar,
  },
  'pt-BR': {
    translation: ptBR,
  },
  de: {
    translation: de,
  },
  ja: {
    translation: ja,
  },
  ko: {
    translation: ko,
  },
  ru: {
    translation: ru,
  },
  it: {
    translation: it,
  },
} as const;

export type I18nNamespace = keyof typeof resources['en'];
