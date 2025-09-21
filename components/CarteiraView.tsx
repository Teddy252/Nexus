import React, { useMemo } from 'react';
import { Asset } from '../types';
import PortfolioTable from './PortfolioTable';
import { WalletCards, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import AddAssetButton from './AddAssetButton';

interface CarteiraViewProps {
    portfolioData: Asset[];
    onEditAsset: (asset: Asset) => void;
    onDeleteAsset: (id: number) => void;
    onDuplicateAsset: (id: number) => void;
    onToggleAlert: (id: number) => void;
    onReorderAssets: (draggedId: number, targetId: number) => void;
    selectedAssetIds: Set<number>;
    onToggleAssetSelection: (id: number) => void;
    onToggleAllAssets: (assetIds: number[], areAllCurrentlySelected: boolean) => void;
    scrollToTicker: string | null;
    onScrollComplete: () => void;
    onStartAddAssetFlow: () => void;
}

const InfoCard: React.FC<{ icon: React.ElementType; title: string; value: string; subtitle?: string; color: string }> = ({ icon: Icon, title, value, subtitle, color }) => {
    const colorClasses = {
        sky: 'bg-sky-500/10 text-sky-500',
        emerald: 'bg-emerald-500/10 text-emerald-500',
        red: 'bg-red-500/10 text-red-500',
        purple: 'bg-purple-500/10 text-purple-500',
    };
    const selectedColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.sky;

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 transition-all hover:border-sky-500/50 dark:hover:border-sky-500/50 hover:shadow-md">
            <div className={`p-3 rounded-full ${selectedColor}`}>
                <Icon className="h-6 w-6" />
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{value}</p>
                {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
        </div>
    );
};


const CarteiraView: React.FC<CarteiraViewProps> = (props) => {
    const { formatCurrency, convertValue } = useCurrency();

    const portfolioStats = useMemo(() => {
        const data = props.portfolioData;
        if (data.length === 0) {
            return {
                totalAssets: 0,
                bestPerformer: { ticker: 'N/A', performance: 0 },
                worstPerformer: { ticker: 'N/A', performance: 0 },
                largestPosition: { ticker: 'N/A', value: 0 },
            };
        }

        const assetsWithPerf = data.map(a => ({
            ...a,
            performance: a.precoCompra > 0 ? ((a.cotacaoAtual - a.precoCompra) / a.precoCompra) * 100 : 0,
            marketValue: a.cotacaoAtual * a.quantidade,
        }));

        const best = assetsWithPerf.reduce((max, a) => a.performance > max.performance ? a : max, assetsWithPerf[0]);
        const worst = assetsWithPerf.reduce((min, a) => a.performance < min.performance ? a : min, assetsWithPerf[0]);
        const largest = assetsWithPerf.reduce((max, a) => a.marketValue > max.marketValue ? a : max, assetsWithPerf[0]);

        return {
            totalAssets: data.length,
            bestPerformer: { ticker: best.ticker, performance: best.performance },
            worstPerformer: { ticker: worst.ticker, performance: worst.performance },
            largestPosition: { ticker: largest.ticker, value: largest.marketValue },
        };

    }, [props.portfolioData]);


    return (
        <div className="space-y-8">
             <header className="mb-6 md:mb-8">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-2">Minha Carteira</h1>
                <p className="text-base md:text-lg text-slate-500 dark:text-slate-400">Analise e gerencie todos os seus ativos em um só lugar.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <InfoCard icon={WalletCards} title="Total de Ativos" value={`${portfolioStats.totalAssets} ativos`} color="sky" />
                 <InfoCard icon={TrendingUp} title="Melhor Ativo" value={portfolioStats.bestPerformer.ticker} subtitle={`${portfolioStats.bestPerformer.performance.toFixed(1)}%`} color="emerald" />
                 <InfoCard icon={TrendingDown} title="Pior Ativo" value={portfolioStats.worstPerformer.ticker} subtitle={`${portfolioStats.worstPerformer.performance.toFixed(1)}%`} color="red" />
                 <InfoCard icon={PiggyBank} title="Maior Posição" value={portfolioStats.largestPosition.ticker} subtitle={formatCurrency(convertValue(portfolioStats.largestPosition.value))} color="purple" />
            </div>
            
            <PortfolioTable
                assets={props.portfolioData}
                onEditAsset={props.onEditAsset}
                onDeleteAsset={props.onDeleteAsset}
                onDuplicateAsset={props.onDuplicateAsset}
                onToggleAlert={props.onToggleAlert}
                onReorderAssets={props.onReorderAssets}
                scrollToTicker={props.scrollToTicker}
                onScrollComplete={props.onScrollComplete}
                selectedAssetIds={props.selectedAssetIds}
                onToggleAssetSelection={props.onToggleAssetSelection}
                onToggleAllAssets={props.onToggleAllAssets}
            />

            <AddAssetButton onClick={props.onStartAddAssetFlow} />
        </div>
    );
};

export default CarteiraView;