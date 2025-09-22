import React, { useState, useMemo } from 'react';
import { Asset } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChevronsRight } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

interface DashboardAllocationChartProps {
    portfolioData: Asset[];
    onNavigate: (view: string) => void;
    showNavigationLink?: boolean;
}

const CHART_COLORS = ['#0f172a', '#1d4ed8', '#0ea5e9', '#06b6d4', '#14b8a6', '#34d399', '#64748b', '#94a3b8'];

const CustomTooltipContent: React.FC<any> = ({ active, payload }) => {
    const { formatCurrency } = useCurrency();
    if (active && payload && payload.length) {
        const data = payload[0];
        return (
            <div className="bg-white/90 dark:bg-slate-900/90 p-2 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg text-sm">
                <p className="font-bold" style={{ color: data.fill }}>{data.name}</p>
                <p className="text-slate-600 dark:text-slate-300">
                    {formatCurrency(data.value)}
                </p>
            </div>
        );
    }
    return null;
};


const DashboardAllocationChart: React.FC<DashboardAllocationChartProps> = ({ portfolioData, onNavigate, showNavigationLink = true }) => {
    const { formatCurrency, convertValue } = useCurrency();
    const [activeTab, setActiveTab] = useState<'categoria' | 'pais'>('categoria');
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    const { allocationData, totalValue } = useMemo(() => {
        const USD_BRL_RATE = 5.25;
        const dataMap = new Map<string, number>();
        let total = 0;
        portfolioData.forEach(asset => {
            const key = asset[activeTab];
            const currentRate = asset.moedaCotacao === 'USD' ? USD_BRL_RATE : 1;
            const valueInBRL = asset.cotacaoAtual * asset.quantidade * currentRate;
            dataMap.set(key, (dataMap.get(key) || 0) + valueInBRL);
            total += valueInBRL;
        });

        const sortedData = Array.from(dataMap.entries())
            .map(([name, value]) => ({ name, value: convertValue(value) }))
            .sort((a, b) => b.value - a.value);

        return { allocationData: sortedData, totalValue: convertValue(total) };

    }, [portfolioData, activeTab, convertValue]);

    const chartDataForBar = useMemo(() => {
        const singleEntry: { [key: string]: string | number } = { name: 'allocation' };
        allocationData.forEach(item => {
            singleEntry[item.name] = item.value;
        });
        return [singleEntry];
    }, [allocationData]);


    return (
        <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 p-6 rounded-2xl shadow-lg h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Análise de Composição</h2>
                 <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-900/50 p-1 rounded-md self-start">
                    <button
                        onClick={() => setActiveTab('categoria')}
                        className={`px-3 py-1 text-xs font-semibold rounded ${activeTab === 'categoria' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        Por Categoria
                    </button>
                    <button
                        onClick={() => setActiveTab('pais')}
                        className={`px-3 py-1 text-xs font-semibold rounded ${activeTab === 'pais' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        Por País
                    </button>
                </div>
            </div>

            <div className="w-full h-8 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataForBar} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <XAxis type="number" hide domain={[0, totalValue]} />
                        <YAxis type="category" dataKey="name" hide />
                        <Tooltip content={<CustomTooltipContent />} cursor={{ fill: 'transparent' }} />
                        {allocationData.map((item, index) => (
                            <Bar key={item.name} dataKey={item.name} stackId="a" fill={CHART_COLORS[index % CHART_COLORS.length]} name={item.name} radius={index === 0 ? [6, 0, 0, 6] : (index === allocationData.length - 1 ? [0, 6, 6, 0] : 0)}>
                                 {chartDataForBar[0] && <Cell
                                    onMouseEnter={() => setHoveredItem(item.name)}
                                    onMouseLeave={() => setHoveredItem(null)}
                                    className={`transition-opacity duration-200 ${hoveredItem && hoveredItem !== item.name ? 'opacity-50' : 'opacity-100'}`}
                                />}
                            </Bar>
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2">
                <div className="space-y-2">
                    {allocationData.map((item, index) => {
                        const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
                        const isHovered = hoveredItem === item.name;
                        return (
                             <div 
                                key={item.name} 
                                onMouseEnter={() => setHoveredItem(item.name)}
                                onMouseLeave={() => setHoveredItem(null)}
                                className={`flex items-center justify-between p-2.5 rounded-lg transition-all duration-200 ${isHovered ? 'bg-slate-200/70 dark:bg-slate-700/50' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                                    <span className="font-medium text-sm text-slate-700 dark:text-slate-200 truncate">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-4 text-right">
                                     <span className="font-bold text-sm text-slate-800 dark:text-slate-100 w-12">{percentage.toFixed(1)}%</span>
                                     <span className="font-medium text-sm text-slate-600 dark:text-slate-300 w-28 truncate">{formatCurrency(item.value)}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            
            {showNavigationLink && (
                <button onClick={() => onNavigate('analise')} className="mt-4 text-sm font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center justify-center gap-1 self-center">
                    Ver análise completa <ChevronsRight className="h-4 w-4" />
                </button>
            )}
        </div>
    );
};

export default DashboardAllocationChart;