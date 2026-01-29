import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './en.json';
import fr from './fr.json';
import es from './es.json';
import ar from './ar.json';
import zh from './zh.json';
import pt from './pt.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es },
      ar: { translation: ar },
      zh: { translation: zh },
      pt: { translation: pt },
    },
    fallbackLng: 'en',
    debug: false,

    interpolation: {
      escapeValue: false,
    },
  });

const RTL_LANGS = ['ar'];

function setHtmlLangDir(lang) {
  if (typeof window !== 'undefined' && document && document.documentElement) {
    try {
      const normalized = (lang || '').split('-')[0];
      document.documentElement.lang = lang || 'en';
      document.documentElement.dir = RTL_LANGS.includes(normalized)
        ? 'rtl'
        : 'ltr';
    } catch (e) {
      // ignore
    }
  }
}

setHtmlLangDir(i18n.language || i18n.options?.fallbackLng || 'en');
i18n.on && i18n.on('languageChanged', lng => setHtmlLangDir(lng));

export default i18n;
