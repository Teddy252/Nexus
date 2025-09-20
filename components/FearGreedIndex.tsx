import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const COUNTRIES = {
    'Brasil': { flag: '🇧🇷', name: 'Brasil' },
    'EUA': { flag: '🇺🇸', name: 'EUA' },
    'Reino Unido': { flag: '🇬🇧', name: 'Reino Unido' },
    'Alemanha': { flag: '🇩🇪', name: 'Alemanha' },
    'Japão': { flag: '🇯🇵', name: 'Japão' },
};
type Country = keyof typeof COUNTRIES;

const FearGreedIndex: React.FC = () => {
    const [country, setCountry] = useState<Country>('Brasil');
    const [indexValue, setIndexValue] = useState(50);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndexValue(prev => {
                const change = Math.random() * 8 - 4; // Fluctuate between -4 and +4
                const newValue = prev + change;
                if (newValue > 100) return 100;
                if (newValue < 0) return 0;
                return newValue;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, [country]);

    const getSentiment = (value: number) => {
        if (value < 20) return { text: "Medo Extremo", color: "text-red-600" };
        if (value < 40) return { text: "Medo", color: "text-amber-600" };
        if (value < 60) return { text: "Neutro", color: "text-yellow-500" };
        if (value < 80) return { text: "Ganância", color: "text-lime-500" };
        return { text: "Ganância Extrema", color: "text-emerald-500" };
    };

    const sentiment = getSentiment(indexValue);
    
    const handleSelectCountry = (c: Country) => {
        setCountry(c);
        setIndexValue(50 + Math.random() * 20 - 10); // Reset with slight variation
        setIsOpen(false);
    }

    return (
        <div className="relative hidden lg:block">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg w-64">
                <div className="flex justify-between items-center mb-2 px-1">
                     <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Índice Medo & Ganância</p>
                     <button onClick={() => setIsOpen(p => !p)} className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400">
                        {COUNTRIES[country].flag} {COUNTRIES[country].name} <ChevronDown className="h-4 w-4 ml-1" />
                     </button>
                </div>
                <div className="w-full relative h-4 px-1" title={`Índice: ${Math.round(indexValue)}`}>
                    <div className="h-2 w-full bg-gradient-to-r from-red-600 via-yellow-500 to-emerald-500 rounded-full absolute top-1/2 -translate-y-1/2"></div>
                    <div 
                        className="absolute top-1/2 h-4 w-1 bg-slate-800 dark:bg-slate-100 rounded-full border-2 border-white dark:border-slate-800 shadow-md transition-all duration-500 ease-out"
                        style={{ left: `${indexValue}%`, transform: 'translateX(-50%)' }}
                    ></div>
                </div>
                <div className="flex justify-between items-center mt-1 text-xs text-slate-500 dark:text-slate-400 px-1">
                   <span>Medo</span>
                   <span className={`font-bold ${sentiment.color}`}>{sentiment.text}</span>
                   <span>Ganância</span>
                </div>
            </div>
             {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                    {Object.entries(COUNTRIES).map(([key, { flag, name }]) => (
                        <button 
                            key={key}
                            onClick={() => handleSelectCountry(key as Country)} 
                            className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                           {flag} {name}
                        </button>
                    ))}
                </div>
             )}
        </div>
    );
};

export default FearGreedIndex;