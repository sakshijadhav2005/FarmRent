import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';

// Language configuration
export const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' }
];

// Resources
const resources = {
    en: { translation: en },
    hi: { translation: hi },
    mr: { translation: mr }
};

// Initialize i18n
i18n
    .use(LanguageDetector) // Detect user language
    .use(initReactI18next) // Pass to react-i18next
    .init({
        resources,
        fallbackLng: 'en', // Default language
        defaultNS: 'translation',

        // Language detection options
        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            lookupLocalStorage: 'farmrent-language',
            caches: ['localStorage']
        },

        interpolation: {
            escapeValue: false // React already escapes values
        },

        react: {
            useSuspense: false // Disable suspense for SSR compatibility
        }
    });

// Helper function to change language
export const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('farmrent-language', langCode);
    document.documentElement.lang = langCode;

    // Set direction for RTL languages (not needed for hi/mr)
    document.documentElement.dir = 'ltr';
};

// Get current language
export const getCurrentLanguage = () => {
    return languages.find(l => l.code === i18n.language) || languages[0];
};

export default i18n;
