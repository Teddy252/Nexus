import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    effectiveTheme: 'light' | 'dark';
}

export const ThemeContext = createContext<ThemeContextType>({
    theme: 'system',
    setTheme: () => console.warn('ThemeProvider not found'),
    effectiveTheme: 'light',
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        try {
            const storedTheme = window.localStorage.getItem('theme') as Theme | null;
            return storedTheme || 'system';
        } catch (error) {
            return 'system';
        }
    });

    const getSystemTheme = useCallback((): 'light' | 'dark' => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }, []);

    const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => {
        if (theme === 'system') {
            // Check if window is defined for SSR safety, although this is a client-side app.
            return typeof window !== 'undefined' ? getSystemTheme() : 'light';
        }
        return theme;
    });

    useEffect(() => {
        const root = window.document.documentElement;
        
        const newEffectiveTheme = theme === 'system' ? getSystemTheme() : theme;
        setEffectiveTheme(newEffectiveTheme);

        root.classList.remove('light', 'dark');
        root.classList.add(newEffectiveTheme);

        try {
            localStorage.setItem('theme', theme);
        } catch (error) {
            console.error("Failed to save theme to localStorage", error);
        }
    }, [theme, getSystemTheme]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = () => {
            if (theme === 'system') {
                const newEffectiveTheme = getSystemTheme();
                setEffectiveTheme(newEffectiveTheme);
                const root = window.document.documentElement;
                root.classList.remove('light', 'dark');
                root.classList.add(newEffectiveTheme);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme, getSystemTheme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    const value = {
        theme,
        setTheme,
        effectiveTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};