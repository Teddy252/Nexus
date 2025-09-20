import React from 'react';
import type { LucideProps } from 'lucide-react';

interface KpiCardProps {
    title: string;
    value: number | string;
    format: 'currency' | 'number';
    // FIX: Broaden the 'icon' prop type to ComponentType to align with KpiConfig 
    // and fix type incompatibility with lucide-react icons.
    icon: React.ComponentType<LucideProps>;
    isProfit?: boolean;
    isLoss?: boolean;
    description?: string;
}

const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const KpiCard: React.FC<KpiCardProps> = ({ title, value, format, icon: Icon, isProfit = false, isLoss = false, description }) => {
    const numericValue = typeof value === 'string' ? parseFloat(value.replace('%', '')) : value;

    let valueColor = 'text-slate-800 dark:text-slate-100';
    if (isProfit) {
        valueColor = numericValue >= 0 ? 'text-emerald-500' : 'text-red-500';
    } else if (isLoss) {
        valueColor = 'text-red-500';
    }

    const formattedValue = format === 'currency' ? formatCurrency(numericValue) : value.toString();
    const sign = isProfit && numericValue > 0 && format === 'currency' ? '+' : '';

    return (
        <div title={description} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 transition-all duration-300 hover:border-sky-500/50 dark:hover:border-sky-500/50 hover:-translate-y-1 cursor-help">
            <div className="flex items-center justify-between">
                 <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
                 <Icon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            </div>
            <p className={`text-2xl font-bold mt-2 ${valueColor}`}>
                {sign}{formattedValue}
            </p>
        </div>
    );
};

export default KpiCard;