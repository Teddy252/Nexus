import React from 'react';
import { useCurrency } from '../context/CurrencyContext';

const currencies = [
    { key: 'BRL', label: 'R$' },
    { key: 'USD', label: '$' },
    { key: 'EUR', label: '€' },
];

const CurrencySelector: React.FC = () => {
    const { selectedCurrency, setCurrency } = useCurrency();

    return (
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-lg">
            {currencies.map(({ key, label }) => (
                <button
                    key={key}
                    onClick={() => setCurrency(key as any)}
                    title={`Mudar para ${key}`}
                    className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${
                        selectedCurrency === key 
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100' 
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    }`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
};

export default CurrencySelector;
