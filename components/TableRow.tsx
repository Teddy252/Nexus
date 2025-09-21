import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Asset } from '../types';
import { AreaChart, Area, ResponsiveContainer, Tooltip, ReferenceLine, Dot } from 'recharts';
import { Pencil, Trash2, ExternalLink, Bell, BellOff, MoreHorizontal, GripVertical, Copy } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

interface TableRowProps {
    asset: Asset;
    onEdit: (asset: Asset) => void;
    onDelete: (id: number) => void;
    onDuplicate: (id: number) => void;
    onToggleAlert: (id: number) => void;
    isSelected: boolean;
    onToggleSelection: (id: number) => void;
    isBeingDragged: boolean;
    isDragOver: boolean;
    onDragStart: (id: number) => void;
    onDragEnter: (id: number) => void;
    onDragEnd: () => void;
    onDrop: (id: number) => void;
    scrollToTicker: string | null;
    onScrollComplete: () => void;
    viewMode: 'detailed' | 'simple';
}

const getTradingViewUrl = (asset: Asset): string | null => {
    const { ticker, pais, categoria } = asset;
    const formattedTicker = ticker.replace(/\s/g, '');

    if (categoria === 'Tesouro Direto') return null;

    if (categoria === 'Cripto') {
        return `https://www.tradingview.com/chart/?symbol=BINANCE:${formattedTicker}BRL`;
    }
    
    if (pais === 'Brasil') {
        return `https://www.tradingview.com/chart/?symbol=B3:${formattedTicker}`;
    }
    
    if (pais === 'EUA') {
        return `https://www.tradingview.com/chart/?symbol=NASDAQ:${formattedTicker}`;
    }

    if (pais === 'Global' && categoria !== 'Cripto') return null;

    return `https://www.tradingview.com/chart/?symbol=${formattedTicker}`;
};

const TrendTooltip: React.FC<any> = ({ active, payload, label }) => {
    const { formatCurrency, convertValue } = useCurrency();
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 dark:bg-slate-900/90 p-2 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg text-xs z-30">
                <p className="font-semibold text-slate-600 dark:text-slate-300">{label}</p>
                <p className="text-slate-800 dark:text-slate-100 font-bold">
                    {formatCurrency(convertValue(payload[0].payload.price))}
                </p>
            </div>
        );
    }
    return null;
};


const TableRow: React.FC<TableRowProps> = ({ 
    asset, 
    onEdit, 
    onDelete, 
    onDuplicate, 
    onToggleAlert, 
    isSelected,
    onToggleSelection,
    isBeingDragged, 
    isDragOver, 
    onDragStart, 
    onDragEnter, 
    onDragEnd, 
    onDrop, 
    scrollToTicker, 
    onScrollComplete,
    viewMode
}) => {
    const { formatCurrency, convertValue } = useCurrency();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const rowRef = useRef<HTMLTableRowElement>(null);

    const valorMercado = asset.quantidade * asset.cotacaoAtual;
    const custoTotal = asset.quantidade * asset.precoCompra;
    const lucroPrejuizo = valorMercado - custoTotal;

    const lpColor = lucroPrejuizo >= 0 ? 'text-emerald-500' : 'text-red-500';
    const lpSign = lucroPrejuizo >= 0 ? '+' : '';

    const firstPrice = asset.historicoPreco[0] || 0;
    const lastPrice = asset.historicoPreco[asset.historicoPreco.length - 1] || 0;
    const percentageChange = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
    
    const trendUp = percentageChange >= 0;
    const trendColor = trendUp ? '#22C55E' : '#EF4444';
    
    const { chartData, minPrice, maxPrice } = useMemo(() => {
        const today = new Date();
        const data = asset.historicoPreco.map((price, index) => {
            const date = new Date(today);
            date.setDate(today.getDate() - (asset.historicoPreco.length - 1 - index));
            return {
                date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                price: price,
            };
        });

        if (!asset.historicoPreco || asset.historicoPreco.length === 0) {
            return { chartData: data, minPrice: 0, maxPrice: 0 };
        }
        const min = Math.min(...asset.historicoPreco);
        const max = Math.max(...asset.historicoPreco);

        return { chartData: data, minPrice: min, maxPrice: max };
    }, [asset.historicoPreco]);

    const CustomizedDot: React.FC<any> = (props) => {
      const { cx, cy, payload } = props;
      const dotColor = trendUp ? '#22C55E' : '#EF4444';

      if (payload.price === maxPrice) {
        return <Dot cx={cx} cy={cy} r={3} fill="#22C55E" stroke="#fff" strokeWidth={1} />;
      }
      if (payload.price === minPrice) {
        return <Dot cx={cx} cy={cy} r={3} fill="#EF4444" stroke="#fff" strokeWidth={1} />;
      }
    
      return null;
    };


    const tradingViewUrl = getTradingViewUrl(asset);

    const isAlertTriggered = asset.alertActive && (
        (asset.alertPriceSuperior && asset.cotacaoAtual >= asset.alertPriceSuperior) ||
        (asset.alertPriceInferior && asset.cotacaoAtual <= asset.alertPriceInferior)
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (scrollToTicker && asset.ticker === scrollToTicker) {
            rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            rowRef.current?.classList.add('highlight-row');

            const timer = setTimeout(() => {
                rowRef.current?.classList.remove('highlight-row');
                onScrollComplete(); // Clear the trigger state in parent
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [scrollToTicker, asset.ticker, onScrollComplete]);
    
    const rowClasses = [
        "border-b border-slate-100 dark:border-slate-800 transition-colors duration-200 group",
        isBeingDragged
            ? 'opacity-50 bg-slate-200 dark:bg-slate-700'
            : isSelected 
                ? 'bg-sky-50 dark:bg-sky-900/40' 
                : (isAlertTriggered 
                    ? "bg-yellow-100 dark:bg-yellow-900/20" 
                    : "hover:bg-slate-100 dark:hover:bg-slate-700/40"),
        isDragOver ? 'drag-over-indicator' : ''
    ].filter(Boolean).join(" ");

    return (
        <tr 
            ref={rowRef}
            className={rowClasses}
            draggable="true"
            onDragStart={() => onDragStart(asset.id)}
            onDragEnter={() => onDragEnter(asset.id)}
            onDragEnd={onDragEnd}
            onDrop={() => onDrop(asset.id)}
            onDragOver={(e) => e.preventDefault()}
        >
            <td className="p-2 md:p-4">
                 <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelection(asset.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Selecionar ${asset.ticker}`}
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-sky-600 focus:ring-sky-500 bg-white dark:bg-slate-700 checked:bg-sky-600 dark:checked:bg-sky-500 transition-colors"
                    />
                    <div className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-move" title="Arrastar para reordenar">
                        <GripVertical className="h-5 w-5" />
                    </div>
                </div>
            </td>
            <td className="p-2 md:p-4">
                <div className="font-bold text-base text-slate-800 dark:text-slate-100">{asset.ticker}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{asset.nome} &bull; {asset.pais}</div>
            </td>
            {viewMode === 'simple' && (
                <td className="p-2 md:p-4 text-right font-medium text-slate-700 dark:text-slate-200">
                    {asset.quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 6 })}
                </td>
            )}
            <td className="p-2 md:p-4 text-center">
                <div className="flex items-center justify-center text-sm">
                    <span className="font-semibold text-base text-slate-800 dark:text-slate-100">{formatCurrency(convertValue(asset.cotacaoAtual))}</span>
                </div>
            </td>
            <td className="p-2 md:p-4 text-right font-medium text-slate-700 dark:text-slate-200">
                {formatCurrency(convertValue(valorMercado))}
            </td>
            {viewMode === 'detailed' && (
                <>
                    <td className={`p-2 md:p-4 text-right font-semibold text-base ${lpColor}`}>
                        {lpSign}{formatCurrency(convertValue(lucroPrejuizo))}
                    </td>
                    <td className="p-2 md:p-4">
                        <div className="flex items-center justify-end gap-3">
                            <div className="h-10 w-24">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id={`colorTrend-${asset.id}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={trendColor} stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor={trendColor} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'rgba(128, 128, 128, 0.5)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                                        <ReferenceLine y={firstPrice} stroke="#94a3b8" strokeDasharray="3 3" strokeWidth={1.5} />
                                        <Area 
                                            type="monotone" 
                                            dataKey="price" 
                                            stroke={trendColor} 
                                            strokeWidth={2} 
                                            fill={`url(#colorTrend-${asset.id})`} 
                                            name="Preço"
                                            dot={<CustomizedDot />}
                                            activeDot={{ r: 4, stroke: trendColor, strokeWidth: 1, fill: '#fff' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className={`font-semibold text-sm w-16 text-right ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
                                {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(2)}%
                            </div>
                        </div>
                    </td>
                </>
            )}
            <td className="p-2 md:p-4 text-center">
                <div className="relative flex items-center justify-center" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} title="Mais ações" className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <MoreHorizontal className="h-5 w-5" />
                    </button>
                     {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden animate-fade-in-down">
                            <button onClick={() => { onEdit(asset); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <Pencil size={16} /> Editar
                            </button>
                            <button onClick={() => { onDuplicate(asset.id); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <Copy size={16} /> Duplicar
                            </button>
                            <button onClick={() => { onToggleAlert(asset.id); setIsMenuOpen(false); }} title={asset.alertActive ? "Desativar alerta" : "Ativar alerta"} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                {asset.alertActive ? <BellOff size={16} className={`${isAlertTriggered ? 'text-amber-500' : 'text-yellow-500'}`} /> : <Bell size={16} />}
                                {asset.alertActive ? "Desativar Alerta" : "Ativar Alerta"}
                            </button>
                            {tradingViewUrl && (
                                <a href={tradingViewUrl} target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                    <ExternalLink size={16} /> Ver no TradingView
                                </a>
                            )}
                            <div className="my-1 h-px bg-slate-100 dark:bg-slate-700" />
                            <button onClick={() => { onDelete(asset.id); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                <Trash2 size={16} /> Excluir
                            </button>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default TableRow;