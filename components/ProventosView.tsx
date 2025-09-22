import React, { useState, useMemo, useEffect } from 'react';
import { Asset, Provento } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Landmark, Calendar, TrendingUp, PiggyBank } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const KpiCard: React.FC<{ icon: React.ElementType; title: string; value: string; color: string }> = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full bg-${color}-500/10`}>
                <Icon className={`h-6 w-6 text-${color}-500`} />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
            </div>
        </div>
    </div>
);

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    const { formatCurrency } = useCurrency();
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 dark:bg-slate-900/90 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
                <p className="font-bold text-slate-800 dark:text-slate-100 mb-2">{label}</p>
                 <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">Total Recebido:</span>
                    <span className="font-semibold ml-4 text-slate-800 dark:text-slate-100">
                        {formatCurrency(payload[0].value)}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

interface ProventosViewProps {
    portfolioData: Asset[];
    proventosData: Provento[];
}

const ProventosView: React.FC<ProventosViewProps> = ({ portfolioData, proventosData }) => {
    const [year, setYear] = useState(new Date().getFullYear());
    const { formatCurrency, convertValue } = useCurrency();
    const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);

    const yearsWithProventos = useMemo(() => {
        const years = new Set(proventosData.map(p => new Date(p.date).getUTCFullYear()));
        if (!years.has(new Date().getFullYear())) {
             years.add(new Date().getFullYear());
        }
        return Array.from(years).sort((a, b) => b - a);
    }, [proventosData]);

    const assetMap = useMemo(() => new Map(portfolioData.map(asset => [asset.id, asset])), [portfolioData]);

    const monthlyData = useMemo(() => {
        const proventosInYear = proventosData.filter(p => new Date(p.date).getUTCFullYear() === year);
        const months = Array.from({ length: 12 }, (_, i) => {
            const monthName = new Date(year, i).toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
            return {
                name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                total: 0,
                breakdown: new Map<string, { value: number, asset: Asset | undefined }>(),
            };
        });

        proventosInYear.forEach(provento => {
            const monthIndex = new Date(provento.date).getUTCMonth();
            const asset = assetMap.get(provento.assetId);
            if (asset) {
                const convertedValue = convertValue(provento.value);
                months[monthIndex].total += convertedValue;
                const existing = months[monthIndex].breakdown.get(asset.ticker);
                if (existing) {
                    existing.value += convertedValue;
                } else {
                    months[monthIndex].breakdown.set(asset.ticker, { value: convertedValue, asset });
                }
            }
        });
        
        // Convert map to a sorted array for rendering
        return months.map(m => ({
            ...m,
            breakdown: Array.from(m.breakdown.values()).sort((a, b) => b.value - a.value)
        }));
    }, [year, proventosData, assetMap, convertValue]);

    useEffect(() => {
        const lastMonthWithProventos = monthlyData.map(m => m.total > 0).lastIndexOf(true);
        setSelectedMonthIndex(lastMonthWithProventos !== -1 ? lastMonthWithProventos : null);
    }, [year, monthlyData]);

    const kpiData = useMemo(() => {
        const totalRecebido = monthlyData.reduce((sum, m) => sum + m.total, 0);
        
        const totalInvestidoDividendPayers = [...new Set(proventosData.filter(p => new Date(p.date).getUTCFullYear() === year).map(p => p.assetId))]
            .reduce((total, assetId) => {
                const asset = assetMap.get(assetId);
                return total + (asset ? asset.precoCompra * asset.quantidade : 0);
            }, 0);

        const yoc = totalInvestidoDividendPayers > 0 ? (totalRecebido / convertValue(totalInvestidoDividendPayers)) * 100 : 0;
        
        const monthlyTotals = monthlyData.map(m => m.total);
        const maxMonthValue = Math.max(...monthlyTotals);
        const mesMaiorRenda = maxMonthValue > 0 ? monthlyData[monthlyTotals.indexOf(maxMonthValue)].name : 'N/A';

        return { totalRecebido, yoc, mesMaiorRenda };
    }, [monthlyData, assetMap, proventosData, year, convertValue]);
    
    const selectedMonthData = selectedMonthIndex !== null ? monthlyData[selectedMonthIndex] : null;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-2">Meus Proventos</h1>
                <p className="text-base md:text-lg text-slate-500 dark:text-slate-400">Acompanhe a renda passiva gerada pela sua carteira de investimentos.</p>
            </header>
            
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Resumo Anual</h2>
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    <select value={year} onChange={e => setYear(parseInt(e.target.value, 10))} className="bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-lg py-2 pl-3 pr-8 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500">
                        {yearsWithProventos.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard icon={PiggyBank} title="Total Recebido no Ano" value={formatCurrency(kpiData.totalRecebido)} color="emerald" />
                <KpiCard icon={TrendingUp} title="Yield on Cost Médio" value={`${kpiData.yoc.toFixed(2)}%`} color="sky" />
                <KpiCard icon={Landmark} title="Mês de Maior Renda" value={kpiData.mesMaiorRenda} color="purple" />
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Recebimentos Mensais</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData} onClick={(e) => {
                            const index = e?.activeTooltipIndex;
                            if (index == null) {
                                setSelectedMonthIndex(null);
                            } else {
                                const numIndex = Number(index);
                                setSelectedMonthIndex(isNaN(numIndex) ? null : numIndex);
                            }
                        }} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.1)" />
                            <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                            <YAxis tickFormatter={(val) => formatCurrency(val)} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }} />
                            <Bar dataKey="total" name="Total Recebido">
                                {monthlyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === selectedMonthIndex ? '#0ea5e9' : '#94a3b8'} className="transition-colors duration-300 cursor-pointer" />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {selectedMonthData && (
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 animate-fade-in-down">
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">Detalhes de {selectedMonthData.name} de {year}</h4>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">Total: <span className="font-semibold">{formatCurrency(selectedMonthData.total)}</span></p>

                        {selectedMonthData.breakdown.length > 0 ? (
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                {selectedMonthData.breakdown.map(({ value, asset }, index) => {
                                    const percentage = (value / selectedMonthData.total) * 100;
                                    return (
                                        <div key={asset?.ticker || index} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                            <div className="flex items-center justify-between text-sm mb-1">
                                                <span className="font-bold text-slate-700 dark:text-slate-200">{asset?.ticker}</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(value)}</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5">
                                                <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-center py-8 text-slate-500 dark:text-slate-400">Nenhum provento recebido neste mês.</p>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Histórico de Pagamentos de {year}</h3>
                <div className="max-h-96 overflow-y-auto">
                    {proventosData.filter(p => new Date(p.date).getUTCFullYear() === year).length > 0 ? (
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-700/80 backdrop-blur-sm">
                                <tr className="border-b border-slate-200 dark:border-slate-600">
                                    <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Data</th>
                                    <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Ativo</th>
                                    <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Tipo</th>
                                    <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300 text-right">Valor Bruto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {proventosData.filter(p => new Date(p.date).getUTCFullYear() === year).map(provento => {
                                    const asset = assetMap.get(provento.assetId);
                                    return (
                                        <tr key={provento.id}>
                                            <td className="p-3 text-sm text-slate-600 dark:text-slate-400">{new Date(provento.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                                            <td className="p-3 font-medium text-slate-800 dark:text-slate-100">{asset?.ticker || 'N/A'}</td>
                                            <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{provento.type}</td>
                                            <td className="p-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(convertValue(provento.value))}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                         <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                            <Landmark className="h-12 w-12 mx-auto mb-2" />
                            <p className="font-semibold">Nenhum provento registrado para {year}.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProventosView;