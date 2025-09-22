import React, { useMemo, useRef } from 'react';
import { Asset } from '../../types';
import KpiCard from '../KpiCard';
import PatrimonialEvolutionChart from '../PatrimonialEvolutionChart';
import DashboardAllocationChart from '../DashboardAllocationChart';
import { Scale, TrendingUp, Percent, TrendingDown } from 'lucide-react';
import { AlertTriangle, CheckCircle, Briefcase, Landmark, Hexagon, BarChart, TrendingUp as TrendingUpIcon } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

interface PortfolioSimulationProps {
    portfolio: Asset[];
    onGraduate: () => void;
}

const SimulatedAssetList: React.FC<{ portfolio: Asset[], totalValue: number }> = ({ portfolio, totalValue }) => {
    const { formatCurrency, convertValue } = useCurrency();

    const getIconForCategory = (category: string) => {
        switch(category) {
            case 'Renda Fixa': return Landmark;
            case 'Fundos Imobiliários': return Briefcase;
            case 'Ações Brasil':
            case 'Ações EUA': return TrendingUpIcon;
            case 'Criptomoedas': return Hexagon;
            default: return BarChart;
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">Composição da Carteira Simulada</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {portfolio.map(asset => {
                    const Icon = getIconForCategory(asset.categoria);
                    const value = asset.cotacaoAtual * asset.quantidade;
                    const allocation = totalValue > 0 ? (value / totalValue) * 100 : 0;

                    return (
                        <div key={asset.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center gap-4">
                            <div className="p-3 bg-slate-200 dark:bg-slate-600 rounded-full">
                                <Icon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                            </div>
                            <div className="flex-grow">
                                <p className="font-bold text-slate-800 dark:text-slate-100">{asset.ticker}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{asset.nome}</p>
                            </div>
                            <div className="text-right flex-shrink-0 w-28">
                                <p className="font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(convertValue(value))}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{allocation.toFixed(1)}%</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const PortfolioSimulation: React.FC<PortfolioSimulationProps> = ({ portfolio, onGraduate }) => {
    const evolutionChartRef = useRef<HTMLDivElement>(null);

     const derivedData = useMemo(() => {
        let patrimonioTotal = 0;
        let totalInvestido = 0;
        portfolio.forEach(asset => {
            patrimonioTotal += asset.cotacaoAtual * asset.quantidade;
            totalInvestido += asset.precoCompra * asset.quantidade;
        });
        const lucroPrejuizoTotal = patrimonioTotal - totalInvestido;
        const lucroPrejuizoPercentual = totalInvestido > 0 ? (lucroPrejuizoTotal / totalInvestido) * 100 : 0;
        return { patrimonioTotal, totalInvestido, lucroPrejuizoTotal, lucroPrejuizoPercentual };
    }, [portfolio]);

    return (
        <div className="space-y-6">
            <div className="bg-amber-100 dark:bg-amber-900/30 border-l-4 border-amber-500 text-amber-800 dark:text-amber-200 p-4 rounded-r-lg" role="alert">
                <div className="flex">
                    <div className="py-1"><AlertTriangle className="h-6 w-6 text-amber-500 mr-4 flex-shrink-0" /></div>
                    <div>
                        <p className="font-bold">Você está em um Ambiente de Simulação!</p>
                        <p className="text-sm">Os valores e a rentabilidade abaixo são baseados em dados reais de mercado, mas seu dinheiro não está investido de verdade. Use este espaço para aprender sem riscos.</p>
                    </div>
                </div>
            </div>

            <header>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Meu Primeiro Portfólio (Simulado)</h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <KpiCard
                    title="Patrimônio Simulado" value={derivedData.patrimonioTotal} format="currency" icon={Scale}
                    isFeatured={true}
                />
                <KpiCard
                    title="Lucro/Prejuízo" value={derivedData.lucroPrejuizoTotal} format="currency" icon={TrendingUp}
                    isProfit
                />
                 <KpiCard
                    title="Rentabilidade" value={`${derivedData.lucroPrejuizoPercentual.toFixed(2)}%`} format="number" icon={Percent}
                    isProfit
                />
                 <KpiCard
                    title="Total Investido" value={derivedData.totalInvestido} format="currency" icon={TrendingDown}
                    isLoss={false}
                />
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {/* FIX: Pass empty arrays for proventosData and notifications as this is a simulation context. */}
                    <PatrimonialEvolutionChart portfolioData={portfolio} proventosData={[]} notifications={[]} ref={evolutionChartRef} />
                </div>
                <div className="lg:col-span-1">
                     <DashboardAllocationChart portfolioData={portfolio} onNavigate={() => {}} showNavigationLink={false} />
                </div>
            </div>
            
            <SimulatedAssetList portfolio={portfolio} totalValue={derivedData.patrimonioTotal} />

            <div className="text-center pt-8 space-y-6">
                <div className="max-w-3xl mx-auto bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-500/30 p-6 rounded-2xl">
                    <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
                    <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">Parabéns! Você completou sua jornada inicial.</h2>
                    <p className="text-slate-600 dark:text-slate-300 mt-2">Você descobriu seu perfil, criou uma carteira modelo e viu como ela se comportaria. Agora você está pronto para explorar a plataforma e começar a investir de verdade quando se sentir confortável.</p>
                </div>
                <button
                    onClick={onGraduate}
                    className="flex items-center justify-center gap-3 mx-auto bg-emerald-600 text-white font-semibold py-3 px-8 rounded-lg text-lg hover:bg-emerald-500 transition-transform transform hover:scale-105 shadow-lg hover:shadow-emerald-500/30"
                >
                    Concluir e ir para minha carteira
                </button>
            </div>
        </div>
    );
};

export default PortfolioSimulation;