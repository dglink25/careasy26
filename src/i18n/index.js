// src/i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './locales/fr.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector)       // détecte la langue du navigateur automatiquement
  .use(initReactI18next)       // connecte i18next à React
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: 'fr',         // Français par défaut
    supportedLngs: ['fr', 'en'],
    
    detection: {
      // Ordre de détection : localStorage → navigateur
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'careasy-lang',
      cacheUserLanguage: true,
    },

    interpolation: {
      escapeValue: false,      // React gère déjà l'échappement XSS
    },
  });

export default i18n;