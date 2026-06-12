import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptCommon from './locales/pt/common.json';
import ptApi from './locales/pt/api_codes.json';
import enCommon from './locales/en/common.json';
import enApi from './locales/en/api_codes.json';
import esCommon from './locales/es/common.json';
import esApi from './locales/es/api_codes.json';

i18n.use(LanguageDetector) // Detects browser language automatically
    .use(initReactI18next)
    .init({
        resources: {
            pt: { common: ptCommon, api: ptApi },
            en: { common: enCommon, api: enApi },
            es: { common: esCommon, api: esApi }
        },
        ns: ['common', 'api'],
        defaultNS: 'common',
        fallbackLng: 'pt',
        interpolation: { escapeValue: false }
    });

export default i18n;