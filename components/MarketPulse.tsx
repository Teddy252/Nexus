import React, { useState, useEffect } from 'react';

const COUNTRIES = {
    'Brasil': { flag: '🇧🇷', name: 'Brasil' },
    'EUA': { flag: '🇺🇸', name: 'EUA' },
    'Cripto': { flag: '🌐', name: 'Cripto' },
};
type Country = keyof typeof COUNTRIES;

const getSentimentInfo = (value: number) => {
    if (value <= 25) return { text: "Medo Extremo", color: "#ef4444", glow: "rgba(239, 68, 68, 0.2)" };
    if (value <= 45) return { text: "Medo", color: "#f97316", glow: "rgba(249, 115, 22, 0.2)"};
    if (value <= 55) return { text: "Neutro", color: "#eab308", glow: "rgba(234, 179, 8, 0.2)"};
    if (value <= 75) return { text: "Ganância", color: "#84cc16", glow: "rgba(132, 204, 22, 0.2)"};
    return { text: "Ganância Extrema", color: "#22c55e", glow: "rgba(34, 197, 94, 0.2)"};
};

const MarketPulse: React.FC = () => {
    const [country, setCountry] = useState<Country>('Brasil');
    const [indexValue, setIndexValue] = useState(58);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndexValue(prev => {
                const change = Math.random() * 4 - 2;
                const newValue = prev + change;
                return Math.max(0, Math.min(100, newValue));
            });
        }, 2500);
        return () => clearInterval(interval);
    }, [country]);
    
    const handleSelectCountry = (c: Country) => {
        setCountry(c);
        // Simulate different market sentiments for different countries
        const baseValues = { 'Brasil': 58, 'EUA': 72, 'Cripto': 85 };
        setIndexValue(baseValues[c] + Math.random() * 10 - 5);
    };

    const sentiment = getSentimentInfo(indexValue);
    const indicatorPosition = `${Math.max(1, Math.min(99, indexValue))}%`;

    return (
        <div className="relative bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 p-6 rounded-2xl shadow-lg h-full flex flex-col items-center justify-center overflow-hidden">
             <div className="absolute inset-0 opacity-50 dark:opacity-40" style={{ background: `radial-gradient(circle at center, ${sentiment.glow} 0%, transparent 60%)` }}></div>
             <div className="relative z-10 w-full flex flex-col items-center">
                <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-900/50 p-1 rounded-full self-center mb-6">
                    {Object.entries(COUNTRIES).map(([key, { name, flag }]) => (
                         <button 
                            key={key}
                            onClick={() => handleSelectCountry(key as Country)}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${country === key ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                        >
                           <span>{flag}</span> {name}
                        </button>
                    ))}
                </div>

                <div 
                    className="relative w-40 h-40 rounded-full flex items-center justify-center transition-colors duration-500 animate-pulse-glow"
                    style={{ 
                        backgroundColor: sentiment.color,
                        '--pulse-color-start': `${sentiment.color}33`,
                        '--pulse-color-end': `${sentiment.color}00`,
                    } as React.CSSProperties}
                >
                     <div className="absolute w-full h-full bg-black/10 dark:bg-white/10 rounded-full scale-75"></div>
                    <div className="text-center">
                        <p className="text-5xl font-extrabold text-white tracking-tighter" style={{ textShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                            {Math.round(indexValue)}
                        </p>
                    </div>
                </div>

                <p className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-100">{sentiment.text}</p>
                
                <div className="w-full max-w-md mt-6">
                    <div className="relative h-2.5 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full">
                        <div 
                            className="absolute -top-1 w-1 h-4.5 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-500 dark:border-slate-300 shadow-md transition-all duration-500"
                            style={{ left: indicatorPosition, transform: 'translateX(-50%)' }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        <span>Medo Extremo</span>
                        <span>Neutro</span>
                        <span>Ganância Extrema</span>
                    </div>
                </div>
             </div>
        </div>
    );
};

export default MarketPulse;