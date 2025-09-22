import React, { useState, useMemo, forwardRef, useEffect } from 'react';
import { Asset } from '../types.ts';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, Brush, BarChart } from 'recharts';
import { generateHistoricalData, generateBenchmarkData } from '../utils/chartUtils.ts';
import { useCurrency } from '../context/CurrencyContext.tsx';

interface PatrimonialEvolutionChartProps {
    portfolioData: Asset[];
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    const { formatCurrency } = useCurrency();
    if (active && payload && payload.length) {
        const date = new Date(label + 'T00:00:00');
        const formattedDate = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
        return (
            <div className="bg-white/90 dark:bg-slate-900/90 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">{formattedDate}</p>
                {payload.map((p: any) => (
                    <div key={p.name} className="flex items-center justify-between text-sm">
                        <span className="flex items-center" style={{ color: p.stroke || p.fill }}>
                            <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: p.stroke || p.fill }}></span>
                            {p.name}:
                        </span>
                        <span className="font-bold ml-4" style={{ color: p.stroke || p.fill }}>
                            {formatCurrency(p.value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const formatYAxis = (tick: number) => {
    if (tick >= 1000000) {
        return `R$${(tick / 1000000).toFixed(1)}M`;
    }
    if (tick >= 1000) {
        return `R$${Math.round(tick / 1000)}k`;
    }
    return `R$${tick}`;
};

const formatXAxis = (dateStr: string) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr + 'T00:00:00');
        const month = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
        const year = date.getFullYear().toString().slice(-2);
        return `${month}. de ${year}`;
    } catch(e) {
        return dateStr;
    }
};

const PatrimonialEvolutionChart = forwardRef<HTMLDivElement, PatrimonialEvolutionChartProps>(
    ({ portfolioData }, ref) => {
        const [period, setPeriod] = useState<'1M' | '6M' | '1A' | 'Tudo'>('1A');
        const [benchmarks, setBenchmarks] = useState<string[]>([]);
        
        type PeriodKey = '1M' | '6M' | '1A' | 'Tudo';
        type MappedPeriod = '1M' | '6M' | '1Y' | 'ALL';

        const periodMap: Record<PeriodKey, MappedPeriod> = {
            '1M': '1M',
            '6M': '6M',
            '1A': '1Y',
            'Tudo': 'ALL',
        };
        
        const historicalData = useMemo(() => generateHistoricalData(portfolioData, periodMap[period]), [portfolioData, period]);

        const chartData = useMemo(() => {
            const ibovData = benchmarks.includes('IBOVESPA') ? generateBenchmarkData('IBOVESPA', historicalData) : [];
            const sp500Data = benchmarks.includes('S&P 500') ? generateBenchmarkData('S&P 500', historicalData) : [];
            const cdiData = benchmarks.includes('CDI') ? generateBenchmarkData('CDI', historicalData) : [];

            return historicalData.map((dataPoint, index) => ({
                ...dataPoint,
                'Carteira': dataPoint.value,
                'IBOVESPA': ibovData[index]?.value,
                'S&P 500': sp500Data[index]?.value,
                'CDI': cdiData[index]?.value,
            }));
        }, [historicalData, benchmarks]);

        const handleToggleBenchmark = (benchmark: string) => {
            setBenchmarks(prev => prev.includes(benchmark) ? prev.filter(b => b !== benchmark) : [...prev, benchmark]);
        };
        
        const periodButtons: { key: PeriodKey, label: string }[] = [{ key: '1M', label: '1M' }, { key: '6M', label: '6M' }, { key: '1A', label: '1A' }, { key: 'Tudo', label: 'Tudo' }];
        const benchmarkButtons = ['IBOVESPA', 'S&P 500', 'CDI'];

        const mainColor = "#0284c7"; // sky-600
        
        const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

        useEffect(() => {
            const handleResize = () => {
                setIsMobile(window.innerWidth < 768);
            };
            window.addEventListener('resize', handleResize);
            return () => {
                window.removeEventListener('resize', handleResize);
            };
        }, []);

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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 sm:mb-0">Evolução Patrimonial</h2>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg self-start sm:self-center">
                        {periodButtons.map(p => (
                            <button key={p.key} onClick={() => setPeriod(p.key)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${ period === p.key ? 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-600/50' }`}>{p.label}</button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: mainColor }} />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Carteira</span>
                </div>

                <div className="flex-grow min-h-[400px] sm:min-h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 5, bottom: 10 }}>
                            <defs>
                                <linearGradient id="colorCarteira" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={mainColor} stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor={mainColor} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.1)" />
                            <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fill: '#94a3b8', fontSize: 12 }} interval="preserveStartEnd" dy={10} />
                            <YAxis tickFormatter={formatYAxis} tick={{ fill: '#94a3b8', fontSize: 12 }} domain={['dataMin - 10000', 'dataMax + 10000']} allowDataOverflow={true} width={70} />
                            <Tooltip content={<CustomTooltip />} />
                            
                            <Area type="monotone" dataKey="Carteira" stroke={mainColor} strokeWidth={2} fillOpacity={1} fill="url(#colorCarteira)" />
                            {benchmarks.includes('IBOVESPA') && <Line type="monotone" dataKey="IBOVESPA" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Ibovespa" />}
                            {benchmarks.includes('S&P 500') && <Line type="monotone" dataKey="S&P 500" stroke="#ef4444" strokeWidth={2} dot={false} name="S&P 500"/>}
                            {benchmarks.includes('CDI') && <Line type="monotone" dataKey="CDI" stroke="#f97316" strokeWidth={2} dot={false} name="CDI"/>}
                            
                            {!isMobile && <Brush dataKey="date" height={30} stroke={mainColor} tickFormatter={formatXAxis} fill="rgba(241, 245, 249, 0.5)" className="dark:fill-slate-700" />}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                 <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                     {benchmarkButtons.map(b => (
                        <button key={b} onClick={() => handleToggleBenchmark(b)} className={`px-4 py-1.5 text-sm font-medium rounded-full border transition-colors ${ benchmarks.includes(b) ? 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200' : 'bg-transparent border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50' }`}>{b}</button>
                    ))}
                </div>
            </div>
        );
    }
);

export default PatrimonialEvolutionChart;