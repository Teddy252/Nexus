import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Asset, NewsItem, KpiConfig, DashboardWidget, DashboardWidgetId } from './types';
import html2canvas from 'html2canvas';
import { generatePortfolioPdf } from './services/pdfService';

import Header from './components/Header';
import StatsBar from './components/StatsBar';
import PortfolioTable from './components/PortfolioTable';
import ImportModal from './components/ImportModal';
import PatrimonialEvolutionChart from './components/PatrimonialEvolutionChart';
import AllocationCharts from './components/AllocationCharts';
import KpiSettingsModal from './components/KpiSettingsModal';
import DashboardSettingsModal from './components/DashboardSettingsModal';
import TotalEquity from './components/TotalEquity';
import { Scale, BarChart3, TrendingUp, TrendingDown, Percent, Cog } from 'lucide-react';

interface DashboardProps {
    portfolioData: Asset[];
    isDataLoaded: boolean;
    onEditAsset: (asset: Asset) => void;
    onDeleteAsset: (id: number) => void;
    onDuplicateAsset: (id: number) => void;
    onToggleAlert: (id: number) => void;
    onAddAsset: () => void;
    onAiAnalysis: () => void;
    onOptimizePortfolio: () => void;
    onImportPortfolio: (assets: Asset[]) => void;
    onLogout: () => void;
    onNavigate: (view: string) => void;
    onReorderAssets: (draggedId: number, targetId: number) => void;
}


const WIDGET_COMPONENTS: { [key in DashboardWidgetId]: React.FC<any> } = {
  totalEquity: TotalEquity,
  patrimonialEvolution: PatrimonialEvolutionChart,
  statsBar: StatsBar,
  portfolio: PortfolioTable,
  allocation: AllocationCharts,
  marketNews: () => null, // Placeholder as it's removed
};

const DEFAULT_WIDGET_CONFIG: DashboardWidget[] = [
    { id: 'totalEquity', visible: true, colSpan: 6, order: 0 },
    { id: 'allocation', visible: true, colSpan: 6, order: 1 },
    { id: 'portfolio', visible: true, colSpan: 12, order: 2 },
    { id: 'patrimonialEvolution', visible: true, colSpan: 12, order: 3 },
    { id: 'marketNews', visible: false, colSpan: 12, order: 4 }, // Hidden by default now
];

const ALL_KPIS: KpiConfig[] = [
    { id: 'patrimonioTotal', title: 'Patrimônio Total', icon: Scale, description: 'Valor total atual da sua carteira.' },
    { id: 'lucroPrejuizoTotal', title: 'Lucro/Prejuízo Total', icon: TrendingUp, description: 'Diferença entre o valor atual e o valor investido.' },
    { id: 'totalGanhos', title: 'Total Ganhos', icon: TrendingUp, description: 'Soma dos lucros de ativos com performance positiva.' },
    { id: 'totalPerdas', title: 'Total Perdas', icon: TrendingDown, description: 'Soma dos prejuízos de ativos com performance negativa.' },
    { id: 'lucroPrejuizoPercentual', title: 'Rentabilidade %', icon: Percent, description: 'Variação percentual total da carteira.' },
    { id: 'proventosAnuaisEstimados', title: 'Proventos Anuais (Est.)', icon: TrendingDown, description: 'Estimativa de dividendos anuais com base no DY.' },
    { id: 'totalInvestido', title: 'Total Investido', icon: BarChart3, description: 'Soma de todo o capital investido.' }
];


const Dashboard: React.FC<DashboardProps> = ({
    portfolioData,
    isDataLoaded,
    onEditAsset,
    onDeleteAsset,
    onDuplicateAsset,
    onToggleAlert,
    onAddAsset,
    onAiAnalysis,
    onOptimizePortfolio,
    onImportPortfolio,
    onLogout,
    onNavigate,
    onReorderAssets
}) => {
    const evolutionChartRef = useRef<HTMLDivElement>(null);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isKpiSettingsOpen, setIsKpiSettingsOpen] = useState(false);
    const [visibleKpis, setVisibleKpis] = useState<string[]>(['patrimonioTotal', 'totalGanhos', 'totalPerdas', 'lucroPrejuizoPercentual']);
    const [widgetConfig, setWidgetConfig] = useState<DashboardWidget[]>(() => {
        try {
            const savedConfig = localStorage.getItem('dashboardWidgetConfig');
            if (savedConfig) {
                const parsed = JSON.parse(savedConfig);
                // Basic validation
                if (Array.isArray(parsed) && parsed.every(item => 'id' in item && 'visible' in item && 'order' in item && 'colSpan' in item)) {
                    // Filter out marketNews if it exists from an old config
                    return parsed.filter((w: DashboardWidget) => w.id !== 'marketNews');
                }
            }
        } catch (error) {
            console.error("Error reading widget config from localStorage, using default.", error);
        }
        return DEFAULT_WIDGET_CONFIG.filter(w => w.id !== 'marketNews');
    });
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [scrollToTicker, setScrollToTicker] = useState<string | null>(null);


    useEffect(() => {
        try {
            localStorage.setItem('dashboardWidgetConfig', JSON.stringify(widgetConfig));
        } catch (error) {
            console.error("Error saving widget config to localStorage.", error);
        }
    }, [widgetConfig]);

    const derivedData = useMemo(() => {
        let patrimonioTotal = 0;
        let totalInvestido = 0;
        let totalGanhos = 0;
        let totalPerdas = 0;
        let proventosAnuaisEstimados = 0;
    
        portfolioData.forEach(asset => {
            const valorAtual = asset.cotacaoAtual * asset.quantidade;
            const custoTotal = asset.precoCompra * asset.quantidade;
            const lucroPrejuizo = valorAtual - custoTotal;
    
            patrimonioTotal += valorAtual;
            totalInvestido += custoTotal;
            proventosAnuaisEstimados += valorAtual * asset.dividendYield;
    
            if (lucroPrejuizo > 0) {
                totalGanhos += lucroPrejuizo;
            } else {
                totalPerdas += lucroPrejuizo;
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
    
    const handleExportPdf = async () => {
        if (!evolutionChartRef.current) return;
        setIsExportingPdf(true);
        try {
            const canvas = await html2canvas(evolutionChartRef.current, { backgroundColor: null });
            const chartImageDataUrl = canvas.toDataURL('image/png');
            await generatePortfolioPdf(portfolioData, derivedData, chartImageDataUrl);
        } catch (error) {
            console.error("Failed to export PDF:", error);
        } finally {
             setIsExportingPdf(false);
        }
    };
    
    const handleSaveKpis = (newVisibleKpis: string[]) => {
        setVisibleKpis(newVisibleKpis);
        setIsKpiSettingsOpen(false);
    };
    
    const handleImportAssets = (importedAssets: Asset[]) => {
        onImportPortfolio(importedAssets);
        setIsImportModalOpen(false);
    };

    const handleSaveWidgetConfig = (newConfig: DashboardWidget[]) => {
        setWidgetConfig(newConfig);
        setIsSettingsModalOpen(false);
    };

    const handleSelectAsset = (ticker: string) => {
        setScrollToTicker(ticker);
    };


    const sortedWidgets = useMemo(() => {
        return [...widgetConfig].sort((a, b) => a.order - b.order);
    }, [widgetConfig]);
    
    const getWidgetProps = (id: DashboardWidgetId) => {
        switch (id) {
            case 'totalEquity': return { value: derivedData.patrimonioTotal };
            case 'patrimonialEvolution': return { portfolioData, ref: evolutionChartRef };
            case 'statsBar': return { derivedData, allKpis: ALL_KPIS, visibleKpis, onSettingsClick: () => setIsKpiSettingsOpen(true) };
            case 'portfolio': return { assets: portfolioData, onEditAsset, onDeleteAsset, onDuplicateAsset, onToggleAlert, onReorderAssets, scrollToTicker, onScrollComplete: () => setScrollToTicker(null) };
            case 'allocation': return { portfolioData };
            case 'marketNews': return {}; // No props needed for a null component
            default: return {};
        }
    };

    if (!isDataLoaded) {
        return (
             <div className="animate-pulse">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-10"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="lg:col-span-1 h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
            </div>
        )
    }

    return (
        <div>
            <Header 
                portfolioData={portfolioData}
                onAddAsset={onAddAsset}
                onAiAnalysis={onAiAnalysis}
                onExportPdf={handleExportPdf}
                isExportingPdf={isExportingPdf}
                onOptimizePortfolio={onOptimizePortfolio}
                onImportPortfolio={() => setIsImportModalOpen(true)}
                onLogout={onLogout}
                onNavigate={onNavigate}
                onSelectAsset={handleSelectAsset}
            />
            <div className="mt-8">
               <StatsBar 
                    derivedData={derivedData}
                    allKpis={ALL_KPIS}
                    visibleKpis={visibleKpis}
                    onSettingsClick={() => setIsKpiSettingsOpen(true)}
                />
            </div>

            <div className="mt-8 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Meu Painel</h2>
                <button
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
                    title="Personalizar painel"
                >
                    <Cog className="h-4 w-4" />
                    Personalizar
                </button>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
                 {sortedWidgets.map(widget => {
                    if (!widget.visible) return null;
                    const Component = WIDGET_COMPONENTS[widget.id];
                    const props = getWidgetProps(widget.id);
                    const colSpanVariants: { [key: number]: string } = {
                        1: 'lg:col-span-1', 2: 'lg:col-span-2', 3: 'lg:col-span-3',
                        4: 'lg:col-span-4', 5: 'lg:col-span-5', 6: 'lg:col-span-6',
                        7: 'lg:col-span-7', 8: 'lg:col-span-8', 9: 'lg:col-span-9',
                        10: 'lg:col-span-10', 11: 'lg:col-span-11', 12: 'lg:col-span-12',
                    };
                    const colSpanClass = colSpanVariants[widget.colSpan] || 'lg:col-span-12';


                    return (
                        <div
                            key={widget.id}
                            className={`${colSpanClass} transition-all duration-300 ease-in-out`}
                        >
                           <Component {...props} />
                        </div>
                    );
                 })}
            </div>

             <KpiSettingsModal
                isOpen={isKpiSettingsOpen}
                onClose={() => setIsKpiSettingsOpen(false)}
                allKpis={ALL_KPIS}
                visibleKpis={visibleKpis}
                onSave={handleSaveKpis}
            />
             <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportAssets}
            />
            <DashboardSettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                currentConfig={widgetConfig}
                onSave={handleSaveWidgetConfig}
            />
        </div>
    );
};

export default Dashboard;