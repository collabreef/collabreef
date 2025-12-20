import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { resources } from './locales/resources';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh-TW', 'zh-CN', 'es', 'fr', 'ar', 'pt-BR', 'de', 'ja', 'ko', 'ru', 'it'],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n; 