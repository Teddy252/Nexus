import React, { useMemo, useState } from 'react';
import { Asset } from '../types';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Play, Pause } from 'lucide-react';

interface TickerTapeProps {
    assets: Asset[];
}

const TickerItem: React.FC<{ asset: Asset; index: number }> = ({ asset, index }) => {
    const dailyChange = asset.cotacaoBase > 0 ? ((asset.cotacaoAtual - asset.cotacaoBase) / asset.cotacaoBase) * 100 : 0;
    
    const isPositive = dailyChange >= 0;
    const changeColor = isPositive ? 'text-emerald-500' : 'text-red-500';

    const firstPrice7d = asset.historicoPreco?.[0] || asset.cotacaoBase;
    const lastPrice7d = asset.historicoPreco?.[asset.historicoPreco.length - 1] || asset.cotacaoAtual;
    const trendIsUp = lastPrice7d >= firstPrice7d;
    const trendColor = trendIsUp ? '#22C55E' : '#EF4444';

    const formatCurrency = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const chartData = useMemo(() => {
        return asset.historicoPreco.map((price, index) => ({
            day: index,
            price: price,
        }));
    }, [asset.historicoPreco]);

    return (
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-1.5 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
            <div className="h-5 w-10">
                 {chartData.length > 1 && (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`ticker-grad-${asset.id}-${index}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={trendColor} stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor={trendColor} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area 
                                type="monotone" 
                                dataKey="price" 
                                stroke={trendColor} 
                                strokeWidth={1.2} 
                                fill={`url(#ticker-grad-${asset.id}-${index})`}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                 )}
            </div>
            <div className="w-20">
                <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{asset.ticker}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate" title={asset.nome}>{asset.nome}</p>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:border-slate-700"></div>
            <div className="flex flex-col items-start w-24">
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                    {formatCurrency(asset.cotacaoAtual)}
                </p>
                 <div className={`flex items-center gap-1 font-semibold text-xs ${changeColor}`}>
                    <span>{isPositive ? '▲' : '▼'}</span>
                    <span>{dailyChange.toFixed(2)}%</span>
                </div>
            </div>
        </div>
    );
};


const TickerTape: React.FC<TickerTapeProps> = ({ assets }) => {
    const [isPaused, setIsPaused] = useState(false);
    const [isHoverPaused, setIsHoverPaused] = useState(false);

    if (!assets || assets.length === 0) {
        return null;
    }

    const duplicatedAssets = [...assets, ...assets];
    // Increased speed by reducing the multiplier
    const animationDuration = assets.length * 1.2;

    return (
        <div className="w-full bg-white dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 overflow-hidden relative group">
            <div className="absolute top-0 left-0 bottom-0 z-20 flex items-center pr-12 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-slate-800 dark:via-slate-800/80 dark:to-transparent">
                <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="ml-2 p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={isPaused ? "Retomar rolagem" : "Pausar rolagem"}
                >
                    {isPaused || isHoverPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </button>
            </div>

            <div 
                className="flex"
                onMouseEnter={() => setIsHoverPaused(true)}
                onMouseLeave={() => setIsHoverPaused(false)}
                style={{ 
                    animation: `ticker-scroll ${animationDuration}s linear infinite`,
                    animationPlayState: (isPaused || isHoverPaused) ? 'paused' : 'running'
                }}
            >
                {duplicatedAssets.map((asset, index) => (
                    <TickerItem key={`${asset.id}-${index}`} asset={asset} index={index} />
                ))}
            </div>
            
            <div className="absolute top-0 right-0 bottom-0 z-10 w-24 bg-gradient-to-l from-white to-transparent dark:from-slate-800 dark:to-transparent pointer-events-none"></div>
        </div>
    );
};

export default TickerTape;