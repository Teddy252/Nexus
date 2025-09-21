import React from 'react';
import type { LucideProps } from 'lucide-react';
import { GripVertical, XCircle } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

interface KpiCardProps {
    title: string;
    value: number | string;
    format: 'currency' | 'number';
    icon: React.ComponentType<LucideProps>;
    isProfit?: boolean;
    isLoss?: boolean;
    description?: string;
    isEditMode?: boolean;
    onHide?: () => void;
    isFeatured?: boolean;
}

const KpiCard: React.FC<KpiCardProps & React.HTMLAttributes<HTMLDivElement>> = ({ 
    title, 
    value, 
    format, 
    icon: Icon, 
    isProfit = false, 
    isLoss = false, 
    description, 
    isEditMode = false,
    onHide,
    isFeatured = false,
    ...rest 
}) => {
    const { formatCurrency, convertValue } = useCurrency();
    const numericValue = typeof value === 'string' ? parseFloat(value.replace('%', '')) : value;

    let valueColor;
    if (isFeatured) {
        valueColor = 'text-white';
    } else if (isProfit) {
        valueColor = numericValue >= 0 ? 'text-emerald-500' : 'text-red-500';
    } else if (isLoss) {
        valueColor = 'text-red-500';
    } else {
        valueColor = 'text-slate-800 dark:text-slate-100';
    }

    const formattedValue = format === 'currency' ? formatCurrency(convertValue(numericValue)) : value.toString();
    const sign = isProfit && numericValue > 0 && format === 'currency' ? '+' : '';
    
    const cardClasses = [
        "relative",
        isFeatured
            ? "bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-lg"
            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
        "rounded-xl p-4 transition-all duration-300",
        isEditMode
            ? "cursor-grab"
            : "hover:-translate-y-1 cursor-help",
        !isFeatured && !isEditMode && "hover:border-sky-500/50 dark:hover:border-sky-500/50"
    ].join(" ");


    return (
        <div title={description} className={cardClasses} {...rest}>
            {isEditMode && (
                <>
                    <div className="absolute inset-0 bg-slate-900/10 dark:bg-slate-900/30 rounded-xl z-10"></div>
                     <div className="absolute top-2 left-2 text-slate-500 dark:text-slate-400 z-20" aria-hidden="true">
                        <GripVertical className="h-5 w-5" />
                    </div>
                     <button 
                        onClick={onHide}
                        title={`Ocultar ${title}`}
                        className="absolute top-2 right-2 p-0.5 bg-slate-200/50 dark:bg-slate-700/50 rounded-full text-slate-500 dark:text-slate-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 z-20 transition-colors"
                    >
                        <XCircle className="h-5 w-5" />
                    </button>
                </>
            )}
            <div className="flex items-center justify-between">
                 <h3 className={`text-sm font-medium ${isFeatured ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'}`}>{title}</h3>
                 <Icon className={`h-5 w-5 ${isFeatured ? 'text-sky-200' : 'text-slate-400 dark:text-slate-500'}`} />
            </div>
            <p className={`text-2xl font-bold mt-2 ${valueColor}`}>
                {sign}{formattedValue}
            </p>
        </div>
    );
};

export default KpiCard;