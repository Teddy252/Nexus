import React, { useState, useMemo } from 'react';
import { Asset, ChartDataPoint } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Line, Brush } from 'recharts';
import { generateHistoricalData, generateBenchmarkData } from '../utils/chartUtils';
import { useCurrency } from '../context/CurrencyContext';

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
                        <span style={{ color: p.color }}>■ {p.name}:</span>
                        <span className="font-bold ml-4" style={{ color: p.color }}>
                            {formatCurrency(p.value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

type Period = '1M' | '6M' | '1Y' | 'ALL';
const BENCHMARKS = ['IBOVESPA', 'S&P 500', 'CDI'];
const BENCHMARK_COLORS: { [key: string]: string } = {
    'IBOVESPA': '#F97316', // orange-500
    'S&P 500': '#10B981', // emerald-500
    'CDI': '#8B5CF6', // violet-500
};


const PatrimonialEvolutionChart: React.ForwardRefRenderFunction<HTMLDivElement, PatrimonialEvolutionChartProps> = ({ portfolioData }, ref) => {
    const [period, setPeriod] = useState<Period>('1Y');
    const [activeBenchmarks, setActiveBenchmarks] = useState<string[]>([]);
    const { selectedCurrency, convertValue } = useCurrency();

    const chartDataWithBenchmarks = useMemo(() => {
        const baseData = generateHistoricalData(portfolioData, period);
        
        const convertData = (data: ChartDataPoint[]) => data.map(d => ({...d, value: convertValue(d.value) }));
        
        let finalData = convertData(baseData).map(d => ({ ...d, 'Carteira': d.value }));

        activeBenchmarks.forEach(benchmark => {
            const benchmarkData = generateBenchmarkData(benchmark as any, baseData);
            const convertedBenchmark = convertData(benchmarkData);
            convertedBenchmark.forEach((bPoint, index) => {
                if(finalData[index]) {
                    finalData[index][benchmark] = bPoint.value;
                }
            });
        });
        return finalData;
    }, [portfolioData, period, activeBenchmarks, convertValue]);

    const handleToggleBenchmark = (benchmark: string) => {
        setActiveBenchmarks(prev => 
            prev.includes(benchmark) ? prev.filter(b => b !== benchmark) : [...prev, benchmark]
        );
    };


    const timeRanges: { label: string, period: Period }[] = [
        { label: '1M', period: '1M' },
        { label: '6M', period: '6M' },
        { label: '1A', period: '1Y' },
        { label: 'Tudo', period: 'ALL' },
    ];
    
    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg h-full" ref={ref}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div>
                     <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Evolução Patrimonial</h2>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-md">
                    {timeRanges.map(range => (
                        <button
                            key={range.label}
                            onClick={() => setPeriod(range.period)}
                            className={`px-3 py-1 text-xs font-semibold rounded ${
                                period === range.period ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'
                            }`}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="h-80 -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartDataWithBenchmarks} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <defs>
                            <linearGradient id="colorCarteira" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.1)" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(dateStr) => {
                                const date = new Date(dateStr + 'T00:00:00');
                                if (period === '1M') {
                                    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                                }
                                return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
                            }}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94A3B8', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94A3B8', fontSize: 12 }}
                            tickFormatter={(val) => {
                                const symbols = { BRL: 'R$', USD: '$', EUR: '€' };
                                return `${symbols[selectedCurrency]}${(val / 1000).toFixed(0)}k`;
                            }}
                            dx={-10}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="top" align="left" height={40} iconType="circle" />
                        <Area type="monotone" dataKey="Carteira" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorCarteira)" name="Carteira" />
                         {BENCHMARKS.map(benchmark => (
                            activeBenchmarks.includes(benchmark) && (
                                <Line 
                                    key={benchmark}
                                    type="monotone" 
                                    dataKey={benchmark} 
                                    stroke={BENCHMARK_COLORS[benchmark]} 
                                    strokeWidth={2} 
                                    dot={false}
                                    name={benchmark}
                                />
                            )
                        ))}
                        <Brush dataKey="date" height={30} stroke="#0284c7" fill="rgba(128, 128, 128, 0.1)" tickFormatter={(dateStr) => {
                                const date = new Date(dateStr + 'T00:00:00');
                                return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
                            }}>
                            <AreaChart data={chartDataWithBenchmarks}>
                                <Area dataKey="Carteira" fill="#0284c7" stroke="#0284c7" fillOpacity={0.5} />
                            </AreaChart>
                        </Brush>
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4">
                {BENCHMARKS.map(b => (
                    <button 
                        key={b}
                        onClick={() => handleToggleBenchmark(b)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border-2 transition-colors ${
                            activeBenchmarks.includes(b) 
                            ? 'text-white' 
                            : 'bg-transparent text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:border-slate-500 dark:hover:border-slate-400'
                        }`}
                        style={{
                            backgroundColor: activeBenchmarks.includes(b) ? BENCHMARK_COLORS[b] : 'transparent',
                            borderColor: activeBenchmarks.includes(b) ? BENCHMARK_COLORS[b] : undefined,
                        }}
                    >
                        {b}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default React.forwardRef(PatrimonialEvolutionChart);