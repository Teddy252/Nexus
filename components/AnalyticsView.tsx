import React, { useState, useMemo } from 'react';
import { Asset, KpiConfig } from '../types';
import StatsBar from './StatsBar';
import AllocationCharts from './AllocationCharts';
import GlobalAllocationMap from './GlobalAllocationMap';
import { Scale, BarChart3, TrendingUp, TrendingDown, Percent } from 'lucide-react';

interface AnalyticsViewProps {
    portfolioData: Asset[];
}

const ALL_KPIS: KpiConfig[] = [
    { id: 'patrimonioTotal', title: 'Patrimônio Total', icon: Scale, description: 'Valor total atual da sua carteira.' },
    { id: 'lucroPrejuizoTotal', title: 'Lucro/Prejuízo Total', icon: TrendingUp, description: 'Diferença entre o valor atual e o valor investido.' },
    { id: 'totalGanhos', title: 'Total Ganhos', icon: TrendingUp, description: 'Soma dos lucros de ativos com performance positiva.' },
    { id: 'totalPerdas', title: 'Total Perdas', icon: TrendingDown, description: 'Soma dos prejuízos de ativos com performance negativa.' },
    { id: 'lucroPrejuizoPercentual', title: 'Rentabilidade %', icon: Percent, description: 'Variação percentual total da carteira.' },
    { id: 'proventosAnuaisEstimados', title: 'Proventos Anuais (Est.)', icon: TrendingDown, description: 'Estimativa de dividendos anuais com base no DY.' },
    { id: 'totalInvestido', title: 'Total Investido', icon: BarChart3, description: 'Soma de todo o capital investido.' }
];

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ portfolioData }) => {
    const [visibleKpis, setVisibleKpis] = useState<string[]>(['patrimonioTotal', 'totalGanhos', 'totalPerdas', 'lucroPrejuizoPercentual']);

    const derivedData = useMemo(() => {
        const USD_BRL_RATE = 5.25;
        let patrimonioTotal = 0;
        let totalInvestido = 0;
        let totalGanhos = 0;
        let totalPerdas = 0;
        let proventosAnuaisEstimados = 0;
    
        portfolioData.forEach(asset => {
            const purchaseRate = asset.moedaCompra === 'USD' || asset.moedaCompra === 'USDT' ? USD_BRL_RATE : 1;
            const currentRate = asset.moedaCotacao === 'USD' ? USD_BRL_RATE : 1;
            
            const valorAtualEmBRL = asset.cotacaoAtual * asset.quantidade * currentRate;
            const custoTotalEmBRL = asset.precoCompra * asset.quantidade * purchaseRate;
            const lucroPrejuizoEmBRL = valorAtualEmBRL - custoTotalEmBRL;
    
            patrimonioTotal += valorAtualEmBRL;
            totalInvestido += custoTotalEmBRL;
            proventosAnuaisEstimados += valorAtualEmBRL * (asset.dividendYield || 0);
    
            if (lucroPrejuizoEmBRL > 0) {
                totalGanhos += lucroPrejuizoEmBRL;
            } else {
                totalPerdas += lucroPrejuizoEmBRL;
            }
        });
    
        const lucroPrejuizoTotal = patrimonioTotal - totalInvestido;
        const lucroPrejuizoPercentual = totalInvestido > 0 ? (lucroPrejuizoTotal / totalInvestido) * 100 : 0;
    
        return {
            patrimonioTotal,
            totalInvestido,
            lucroPrejuizoTotal,
            lucroPrejuizoPercentual,
            proventosAnuaisEstimados,
            totalGanhos,
            totalPerdas
        };
    }, [portfolioData]);

    const handleSaveKpis = (newVisibleKpis: string[]) => {
        setVisibleKpis(newVisibleKpis);
    };

    return (
        <div className="space-y-8">
            <header className="mb-6 md:mb-8">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-2">Análise da Carteira</h1>
                <p className="text-base md:text-lg text-slate-500 dark:text-slate-400">Mergulhe nos detalhes e métricas de desempenho do seu portfólio.</p>
            </header>
            
            <div className="mt-8">
               <StatsBar 
                    derivedData={derivedData}
                    allKpis={ALL_KPIS}
                    visibleKpis={visibleKpis}
                    onSaveKpis={handleSaveKpis}
                />
            </div>

            <GlobalAllocationMap portfolioData={portfolioData} />
            
            <AllocationCharts portfolioData={portfolioData} />

        </div>
    );
};

export default AnalyticsView;