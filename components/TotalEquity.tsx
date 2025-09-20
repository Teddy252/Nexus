import React from 'react';
import { Scale } from 'lucide-react';

interface TotalEquityProps {
    value: number;
}

const formatCurrency = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TotalEquity: React.FC<TotalEquityProps> = ({ value }) => {
    return (
        <div className="bg-gradient-to-br from-sky-500 to-sky-600 dark:from-sky-600 dark:to-sky-700 p-6 rounded-2xl shadow-xl shadow-sky-500/20 text-white h-full flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                       <Scale className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-bold">Patrimônio Total</h2>
                </div>
            </div>
            <div>
                <p className="text-5xl font-extrabold tracking-tight text-right">
                    {formatCurrency(value)}
                </p>
            </div>
        </div>
    );
};

export default TotalEquity;
