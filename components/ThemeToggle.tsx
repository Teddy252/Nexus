import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext.tsx';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle: React.FC = () => {
    const { setTheme, effectiveTheme } = useContext(ThemeContext);

    const toggleTheme = () => {
        setTheme(effectiveTheme === 'light' ? 'dark' : 'light');
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2.5 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg hover:text-sky-500 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-700 transition-colors"
            title={`Mudar para modo ${effectiveTheme === 'light' ? 'escuro' : 'claro'}`}
        >
            {effectiveTheme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
    );
};

export default ThemeToggle;