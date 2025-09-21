import React, { createContext, useState, ReactNode, useContext } from 'react';

type Locale = 'pt-BR' | 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE' | 'it-IT' | 'ja-JP' | 'ko-KR' | 'zh-CN';

interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
}

export const LanguageContext = createContext<LanguageContextType>(null!);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [locale, setLocaleState] = useState<Locale>(() => {
        try {
            const stored = localStorage.getItem('appLocale');
            if (stored && ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-CN'].includes(stored)) {
                return stored as Locale;
            }
            return 'pt-BR';
        } catch (error) {
            console.error("Could not access localStorage. Defaulting to pt-BR.", error);
            return 'pt-BR';
        }
    });

    const setLocale = (newLocale: Locale) => {
        try {
            localStorage.setItem('appLocale', newLocale);
        } catch (error) {
            console.error("Could not save locale to localStorage.", error);
        }
        setLocaleState(newLocale);
    };

    const value = {
        locale,
        setLocale,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
