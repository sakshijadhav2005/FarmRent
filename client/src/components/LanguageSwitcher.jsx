import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { languages, changeLanguage, getCurrentLanguage } from '../i18n';

/**
 * Language Switcher Component
 * Dropdown for selecting app language
 */
const LanguageSwitcher = ({ variant = 'dropdown' }) => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const currentLang = getCurrentLanguage();

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageChange = (langCode) => {
        changeLanguage(langCode);
        setIsOpen(false);
    };

    // Inline buttons variant
    if (variant === 'inline') {
        return (
            <div className="flex items-center gap-2">
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${i18n.language === lang.code
                                ? 'bg-brand-primary text-white'
                                : 'bg-white/5 text-brand-text-muted hover:bg-white/10 hover:text-brand-text-light'
                            }`}
                    >
                        {lang.flag} {lang.nativeName}
                    </button>
                ))}
            </div>
        );
    }

    // Default dropdown variant
    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
                <Globe className="w-4 h-4 text-brand-text-muted" />
                <span className="text-sm text-brand-text-light">{currentLang.flag} {currentLang.nativeName}</span>
                <ChevronDown className={`w-4 h-4 text-brand-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-brand-background/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50">
                    <div className="py-1">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang.code)}
                                className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${i18n.language === lang.code
                                        ? 'bg-brand-primary/10 text-brand-primary-light'
                                        : 'text-brand-text hover:bg-white/5 hover:text-brand-text-light'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="text-lg">{lang.flag}</span>
                                    <span className="text-sm font-medium">{lang.nativeName}</span>
                                </span>
                                {i18n.language === lang.code && (
                                    <Check className="w-4 h-4 text-brand-primary" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;
