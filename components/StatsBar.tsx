import React from 'react';
import { KpiConfig } from '../types';
import KpiCard from './KpiCard';
import { Settings } from 'lucide-react';

interface StatsBarProps {
    derivedData: {
        [key: string]: number;
    };
    allKpis: KpiConfig[];
    visibleKpis: string[];
    onSettingsClick: () => void;
}

const StatsBar: React.FC<StatsBarProps> = ({ derivedData, allKpis, visibleKpis, onSettingsClick }) => {
    
    const getKpiValue = (id: string) => {
        const value = derivedData[id];
        if (id === 'lucroPrejuizoPercentual') return `${value.toFixed(2)}%`;
        return value;
    };
    
    const getKpiFormat = (id: string): 'currency' | 'number' => (id.includes('Percentual') ? 'number' : 'currency');
    const isProfit = (id: string) => id.includes('Ganhos') || id === 'lucroPrejuizoTotal';
    const isLoss = (id: string) => id.includes('Perdas');

    return (
        <div>
            <div className="text-right mb-4 px-2">
                <button
                    onClick={onSettingsClick}
                    className="p-2 text-slate-500 hover:text-sky-500 rounded-full transition-colors dark:text-slate-400 dark:hover:text-sky-400"
                    title="Personalizar KPIs"
                >
                    <Settings className="h-5 w-5" />
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 {allKpis
                    .filter(kpi => visibleKpis.includes(kpi.id))
                    .map(kpi => (
                        <KpiCard
                            key={kpi.id}
                            title={kpi.title}
                            value={getKpiValue(kpi.id)}
                            format={getKpiFormat(kpi.id)}
                            icon={kpi.icon}
                            isProfit={isProfit(kpi.id)}
                            isLoss={isLoss(kpi.id)}
                            description={kpi.description}
                        />
                    ))}
            </div>
        </div>
    );
};

export default StatsBar;