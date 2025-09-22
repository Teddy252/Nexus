import React, { useState, useCallback, useMemo } from 'react';
import { Asset } from '../types.ts';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';

interface AllocationChartsProps {
    portfolioData: Asset[];
}

const CHART_COLORS = ['#0f172a', '#1d4ed8', '#0ea5e9', '#06b6d4', '#14b8a6', '#34d399', '#64748b', '#94a3b8'];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))' }}>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cornerRadius={4}
      />
    </g>
  );
};

const CustomLegend: React.FC<{ data: any[], onHover: (index: number) => void, onLeave: () => void, colors: string[], activeIndex: number | null, total: number }> = ({ data, onHover, onLeave, colors, activeIndex, total }) => (
    <div className="w-full space-y-2" onMouseLeave={onLeave}>
        {data.map((entry, index) => {
            const isActive = activeIndex === index;
            const percentage = total > 0 ? (entry.value / total) * 100 : 0;
            const itemClasses = `flex items-center justify-between p-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                isActive 
                ? 'bg-slate-100 dark:bg-slate-700/50' 
                : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`;

            return (
                 <div 
                    key={`legend-${index}`} 
                    className={itemClasses}
                    onMouseEnter={() => onHover(index)}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[index % colors.length] }} />
                        <span className="font-medium text-sm text-slate-700 dark:text-slate-200 truncate">{entry.name}</span>
                    </div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{`${percentage.toFixed(0)}%`}</span>
                </div>
            )
        })}
    </div>
);


const AllocationCharts: React.FC<AllocationChartsProps> = ({ portfolioData }) => {
    const AnyPie = Pie as any;
    const [activeTab, setActiveTab] = useState<'category' | 'country'>('category');
    const [activeIndex, setActiveIndex] = useState<number | null>(0);

    const onPieEnter = useCallback((_: any, index: number) => { setActiveIndex(index); }, []);
    const onPieLeave = useCallback(() => { setActiveIndex(null); }, []);
    
    const USD_BRL_RATE = 5.25;

    const totalValue = useMemo(() => portfolioData.reduce((sum, asset) => {
        const currentRate = asset.moedaCotacao === 'USD' ? USD_BRL_RATE : 1;
        return sum + (asset.cotacaoAtual * asset.quantidade * currentRate);
    }, 0), [portfolioData]);

    const dataByCategory = useMemo(() => portfolioData.reduce((acc, asset) => {
        const currentRate = asset.moedaCotacao === 'USD' ? USD_BRL_RATE : 1;
        const value = asset.cotacaoAtual * asset.quantidade * currentRate;
        const category = asset.categoria;
        const existing = acc.find(item => item.name === category);
        if (existing) {
            existing.value += value;
        } else {
            acc.push({ name: category, value });
        }
        return acc;
    }, [] as { name: string, value: number }[]).sort((a,b) => b.value - a.value), [portfolioData]);

    const dataByCountry = useMemo(() => portfolioData.reduce((acc, asset) => {
        const currentRate = asset.moedaCotacao === 'USD' ? USD_BRL_RATE : 1;
        const value = asset.cotacaoAtual * asset.quantidade * currentRate;
        const country = asset.pais;
        const existing = acc.find(item => item.name === country);
        if (existing) {
            existing.value += value;
        } else {
            acc.push({ name: country, value });
        }
        return acc;
    }, [] as { name: string, value: number }[]).sort((a,b) => b.value - a.value), [portfolioData]);

    const activeData = activeTab === 'category' ? dataByCategory : dataByCountry;

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg h-full flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Alocação da Carteira</h2>
            <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
                <button 
                    onClick={() => { setActiveTab('category'); setActiveIndex(0); }} 
                    className={`px-4 py-2 font-semibold text-sm transition-colors ${activeTab === 'category' ? 'border-b-2 border-sky-500 text-sky-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    Por Categoria
                </button>
                <button 
                    onClick={() => { setActiveTab('country'); setActiveIndex(0); }} 
                    className={`px-4 py-2 font-semibold text-sm transition-colors ${activeTab === 'country' ? 'border-b-2 border-sky-500 text-sky-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    Por País
                </button>
            </div>
            <div className="flex flex-col md:flex-row gap-6 flex-grow items-center">
                <div className="w-full md:w-2/5 max-h-[320px] overflow-y-auto pr-2">
                    <CustomLegend 
                        data={activeData} 
                        colors={CHART_COLORS} 
                        onHover={(i) => setActiveIndex(i)} 
                        onLeave={onPieLeave} 
                        activeIndex={activeIndex} 
                        total={totalValue}
                    />
                </div>
                <div className="w-full md:w-3/5 h-64 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <AnyPie 
                                activeIndex={activeIndex}
                                activeShape={renderActiveShape}
                                data={activeData} 
                                dataKey="value" 
                                nameKey="name" 
                                cx="50%" 
                                cy="50%" 
                                outerRadius="90%"
                                paddingAngle={2}
                                onMouseEnter={onPieEnter}
                                onMouseLeave={onPieLeave}
                            >
                                {activeData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} className="focus:outline-none" stroke="none"/>)}
                            </AnyPie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AllocationCharts;