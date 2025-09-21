import React from 'react';
import { useCurrency } from '../context/CurrencyContext';

interface TotalEquityProps {
    patrimonioTotal: number;
}

const TotalEquity: React.FC<TotalEquityProps> = ({ patrimonioTotal }) => {
    const { formatCurrency, convertValue } = useCurrency();

    return (
        <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-6 rounded-2xl shadow-lg h-full flex flex-col justify-center text-white">
            <h2 className="text-lg font-semibold text-sky-100">Patrimônio Total</h2>
            <p className="text-4xl md:text-5xl font-extrabold tracking-tight mt-2 break-words">
                {formatCurrency(convertValue(patrimonioTotal))}
            </p>
        </div>
    );
};

export default TotalEquity;