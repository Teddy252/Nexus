import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle: React.FC = () => {
    // FIX: Destructure setTheme instead of the non-existent toggleTheme.
    const { theme, setTheme } = useContext(ThemeContext);

    // FIX: Implement the toggle logic locally.
    const toggleTheme = () => {
        // Simple toggle between light and dark. Ignores 'system' for simplicity.
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2.5 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg hover:text-sky-500 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-700 transition-colors"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
    );
};

export default ThemeToggle;