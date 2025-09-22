import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    effectiveTheme: 'light' | 'dark';
}

export const ThemeContext = createContext<ThemeContextType>({
    theme: 'system',
    setTheme: () => console.warn('no theme provider'),
    effectiveTheme: 'light',
});

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
            return storedTheme as Theme;
        }
        return 'system';
    });
    const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

    const applyTheme = useCallback((themeToApply: Theme) => {
        const root = window.document.documentElement;
        
        let resolvedTheme: 'light' | 'dark';
        if (themeToApply === 'system') {
            resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } else {
            resolvedTheme = themeToApply;
        }

        root.classList.remove('light', 'dark');
        root.classList.add(resolvedTheme);
        setEffectiveTheme(resolvedTheme);
    }, []);

    // Effect for system theme changes
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleThemeChange = () => {
            applyTheme('system');
        };
        
        mediaQuery.addEventListener('change', handleThemeChange);
        return () => mediaQuery.removeEventListener('change', handleThemeChange);
    }, [theme, applyTheme]);

    // Effect to apply theme and save to localStorage
    useEffect(() => {
        applyTheme(theme);
        localStorage.setItem('theme', theme);
    }, [theme, applyTheme]);


    return (
        <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};