import React, { useState, useMemo, forwardRef } from 'react';
import { Asset, Provento, Notification } from '../types.ts';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { generateHistoricalData, generateBenchmarkData } from '../utils/chartUtils.ts';
import { useCurrency } from '../context/CurrencyContext.tsx';
import { Landmark, ShoppingCart, AlertTriangle, BarChart, LineChart } from 'lucide-react';

interface ChartEvent {
  date: string; // YYYY-MM-DD
  type: 'provento' | 'compra' | 'alerta';
  icon: React.ElementType;
  color: string;
  description: string;
}

interface PatrimonialEvolutionChartProps {
    portfolioData: Asset[];
    proventosData: Provento[];
    notifications: Notification[];
}

const EventIcon: React.FC<{ event: ChartEvent }> = ({ event }) => {
    const Icon = event.icon;
    const colorClasses: { [key: string]: string } = {
        emerald: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500',
        sky: 'bg-sky-100 dark:bg-sky-500/10 text-sky-500',
        amber: 'bg-amber-100 dark:bg-amber-500/10 text-amber-500',
    };
    return (
        <div className={`flex items-center gap-2 p-1 rounded-md ${colorClasses[event.color]}`}>
            <Icon className={`h-4 w-4`} />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{event.description}</span>
        </div>
    );
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    const { formatCurrency } = useCurrency();
    if (active && payload && payload.length) {
        const dataPoint = payload[0].payload;
        const events: ChartEvent[] = dataPoint.events || [];
        const date = new Date(label + 'T00:00:00');
        const formattedDate = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
        
        return (
            <div className="bg-white/90 dark:bg-slate-900/90 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-w-xs">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">{formattedDate}</p>
                <div className="flex items-center justify-between text-base mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Patrimônio:</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                        {formatCurrency(dataPoint.value)}
                    </span>
                </div>
                
                 {payload.filter((p: any) => p.dataKey !== 'value').map((p: any) => (
                    <div key={p.dataKey} className="flex items-center justify-between text-base mt-1">
                        <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center">
                           <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: p.stroke }} />
                           {p.name}:
                        </span>
                        <span className="font-bold" style={{ color: p.stroke }}>
                             {p.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                    </div>
                ))}
                
                {events.length > 0 && (
                     <div className="space-y-2 mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                        {events.map((event, index) => (
                           <EventIcon key={index} event={event} />
                        ))}
                    </div>
                )}
            </div>
        );
    }
    return null;
};

const formatYAxis = (tick: number) => {
    if (tick >= 1000000) return `R$${(tick / 1000000).toFixed(1)}M`;
    if (tick >= 1000) return `R$${Math.round(tick / 1000)}k`;
    return `R$${tick}`;
};


// Custom dot renderer for events
const renderEventDot = (props: any) => {
    const { cx, cy, payload } = props;
    const events: ChartEvent[] = payload.events || [];

    if (events.length > 0) {
        // Use the color of the most "important" event if there are multiple
        const dotColor = events[0].color === 'amber' ? '#f59e0b' : (events[0].color === 'emerald' ? '#10b981' : '#0ea5e9');
        return (
            <g>
                <circle cx={cx} cy={cy} r={8} fill={dotColor} fillOpacity={0.2} className="animate-pulse" />
                <circle cx={cx} cy={cy} r={5} stroke="white" strokeWidth={2} fill={dotColor} />
            </g>
        );
    }
    return null;
};

type Period = '1M' | '6M' | '1A' | 'Tudo';
type Benchmark = 'IBOV' | 'S&P 500' | 'CDI';

const benchmarkConfig: Record<Benchmark, { color: string; name: string }> = {
    'IBOV': { color: '#22c55e', name: 'IBOVESPA' },
    'S&P 500': { color: '#3b82f6', name: 'S&P 500' },
    'CDI': { color: '#a855f7', name: 'CDI' },
};


const PatrimonialEvolutionChart = forwardRef<HTMLDivElement, PatrimonialEvolutionChartProps>(
    ({ portfolioData, proventosData, notifications }, ref) => {
        const [period, setPeriod] = useState<Period>('1A');
        const [activeBenchmarks, setActiveBenchmarks] = useState<Set<Benchmark>>(new Set());
        
        const assetMap = useMemo(() => new Map(portfolioData.map(asset => [asset.id, asset.ticker])), [portfolioData]);
        
        const eventMap = useMemo(() => {
            const map = new Map<string, ChartEvent[]>();
            const addEvent = (dateStr: string, event: Omit<ChartEvent, 'date'>) => {
                if (!dateStr) return;
                const date = dateStr.split('T')[0];
                if (!map.has(date)) map.set(date, []);
                map.get(date)!.push({ ...event, date });
            };

            proventosData.forEach(p => {
                const ticker = assetMap.get(p.assetId) || 'Ativo';
                addEvent(p.date, { type: 'provento', icon: Landmark, color: 'emerald', description: `Dividendo de ${ticker}` });
            });
            notifications.forEach(n => {
                if (n.type === 'price_alert') {
                    const ticker = n.assetId ? (assetMap.get(n.assetId) || 'Ativo') : 'Ativo';
                     addEvent(n.createdAt, { type: 'alerta', icon: AlertTriangle, color: 'amber', description: `Alerta de preço para ${ticker}` });
                }
            });
             portfolioData.forEach(a => {
                if(a.created_at) {
                     addEvent(a.created_at, { type: 'compra', icon: ShoppingCart, color: 'sky', description: `Compra de ${a.ticker}` });
                }
            });

            return map;
        }, [proventosData, notifications, portfolioData, assetMap]);
        
        const baseChartData = useMemo(() => {
            type PeriodKey = '1M' | '6M' | '1A' | 'Tudo';
            type MappedPeriod = '1M' | '6M' | '1Y' | 'ALL';
            const periodMap: Record<PeriodKey, MappedPeriod> = { '1M': '1M', '6M': '6M', '1A': '1Y', 'Tudo': 'ALL' };
            
            const historicalData = generateHistoricalData(portfolioData, periodMap[period]);
            return historicalData.map(dataPoint => ({
                ...dataPoint,
                events: eventMap.get(dataPoint.date) || [],
            }));
        }, [portfolioData, period, eventMap]);
        
        const chartData = useMemo(() => {
            if (activeBenchmarks.size === 0 || baseChartData.length === 0) {
                return baseChartData;
            }

            const dataWithBenchmarks = baseChartData.map(point => ({ ...point }));

            activeBenchmarks.forEach(benchmark => {
                const dataKey = `${benchmark.replace(/[^a-zA-Z0-9]/g, '')}Value`;
                const benchmarkData = generateBenchmarkData(benchmark, baseChartData);

                dataWithBenchmarks.forEach((point, index) => {
                    point[dataKey] = benchmarkData[index].value;
                });
            });

            return dataWithBenchmarks;
        }, [baseChartData, activeBenchmarks]);

        const formatXAxis = (dateStr: string) => {
            if (!dateStr) return '';
            try {
                const date = new Date(dateStr + 'T00:00:00');
                switch(period) {
                    case '1M':
                        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
                    case '6M':
                    case '1A':
                        return date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
                    case 'Tudo':
                         return `'${date.getFullYear().toString().slice(-2)}`;
                    default:
                        return date.toLocaleDateString('pt-BR');
                }
            } catch(e) { return dateStr; }
        };

        const handleBenchmarkClick = (selectedBenchmark: Benchmark) => {
            setActiveBenchmarks(prev => {
                const newSet = new Set(prev);
                if (newSet.has(selectedBenchmark)) {
                    newSet.delete(selectedBenchmark);
                } else {
                    newSet.add(selectedBenchmark);
                }
                return newSet;
            });
        };
        
        const periodButtons: { key: Period, label: string }[] = [{ key: '1M', label: '1M' }, { key: '6M', label: '6M' }, { key: '1A', label: '1A' }, { key: 'Tudo', label: 'Tudo' }];
        const benchmarkButtons: { key: Benchmark, label: string }[] = [{ key: 'IBOV', label: 'IBOV' }, { key: 'S&P 500', label: 'S&P 500' }, { key: 'CDI', label: 'CDI' }];
        
        const mainColor = "#0284c7"; // sky-600
        
        if (chartData.length === 0) {
            return (
                <div ref={ref} className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 h-full flex flex-col">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 sm:mb-0">Evolução Patrimonial</h2>
                    <div className="flex-grow flex items-center justify-center text-center text-slate-500 dark:text-slate-400">
                        <div>
                            <BarChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="font-semibold">Sem dados históricos</p>
                            <p className="text-sm">Adicione ativos à sua carteira para ver a evolução do seu patrimônio.</p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div ref={ref} className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 h-full flex flex-col">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-sky-100 dark:bg-sky-900/50 rounded-lg">
                           <LineChart className="h-6 w-6 text-sky-600 dark:text-sky-400"/>
                        </div>
                        <div>
                           <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Evolução Patrimonial</h2>
                           <p className="text-sm text-slate-500 dark:text-slate-400">Acompanhe o crescimento da sua carteira.</p>
                        </div>
                    </div>
                     <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                         <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                            {benchmarkButtons.map(b => (
                                <button
                                    key={b.key}
                                    onClick={() => handleBenchmarkClick(b.key)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                                        activeBenchmarks.has(b.key)
                                            ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-600/50'
                                    }`}
                                >
                                    {b.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                            {periodButtons.map(p => (
                                <button key={p.key} onClick={() => setPeriod(p.key)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${ period === p.key ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-600/50' }`}>{p.label}</button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-grow min-h-[400px] sm:min-h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 15, right: 30, left: 5, bottom: 10 }}>
                            <defs>
                                <linearGradient id="colorCarteira" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={mainColor} stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor={mainColor} stopOpacity={0}/>
                                </linearGradient>
                                {benchmarkButtons.map(b => {
                                    const color = benchmarkConfig[b.key].color;
                                    const id = `color-${b.key.replace(/[^a-zA-Z0-9]/g, '')}`;
                                    return (
                                        <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={color} stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor={color} stopOpacity={0}/>
                                        </linearGradient>
                                    );
                                })}
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.1)" />
                            <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fill: '#94a3b8', fontSize: 12 }} interval="preserveStartEnd" dy={10} />
                            <YAxis tickFormatter={formatYAxis} tick={{ fill: '#94a3b8', fontSize: 12 }} domain={['dataMin - 1000', 'dataMax + 1000']} allowDataOverflow={true} width={70} />
                            <Tooltip content={<CustomTooltip />} />
                            
                            <Area type="monotone" dataKey="value" name="Patrimônio" stroke={mainColor} strokeWidth={2.5} fillOpacity={1} fill="url(#colorCarteira)" dot={renderEventDot} activeDot={{ r: 8, strokeWidth: 2, stroke: mainColor }}/>
                             
                            {benchmarkButtons.map(b => activeBenchmarks.has(b.key) && (
                                <Area
                                    key={b.key}
                                    type="monotone"
                                    dataKey={`${b.key.replace(/[^a-zA-Z0-9]/g, '')}Value`}
                                    name={benchmarkConfig[b.key].name}
                                    stroke={benchmarkConfig[b.key].color}
                                    strokeWidth={1.5}
                                    fillOpacity={1}
                                    fill={`url(#color-${b.key.replace(/[^a-zA-Z0-9]/g, '')})`}
                                    activeDot={{ r: 6 }}
                                    dot={false}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }
);

export default PatrimonialEvolutionChart;