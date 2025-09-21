import React, { useState, useRef, useMemo } from 'react';
import { Asset, KpiConfig } from './types';
import html2canvas from 'html2canvas';
import { generatePortfolioPdf } from './services/pdfService';
import { Scale, BarChart3, TrendingUp, TrendingDown, Percent, Edit, Save, X, GripVertical, PlusCircle, XCircle } from 'lucide-react';

import Header from './components/Header';
import PatrimonialEvolutionChart from './components/PatrimonialEvolutionChart';
import TickerTape from './components/TickerTape';
import MarketPulse from './components/MarketPulse';
import DashboardAllocationChart from './components/DashboardAllocationChart';
import AddAssetButton from './components/AddAssetButton';
import KpiCard from './components/KpiCard';

const ALL_KPIS: KpiConfig[] = [
    { id: 'patrimonioTotal', title: 'Patrimônio Total', icon: Scale, description: 'Valor total atual da sua carteira.' },
    { id: 'lucroPrejuizoTotal', title: 'Lucro/Prejuízo Total', icon: TrendingUp, description: 'Diferença entre o valor atual e o valor investido.' },
    { id: 'totalGanhos', title: 'Total Ganhos', icon: TrendingUp, description: 'Soma dos lucros de ativos com performance positiva.' },
    { id: 'totalPerdas', title: 'Total Perdas', icon: TrendingDown, description: 'Soma dos prejuízos de ativos com performance negativa.' },
    { id: 'lucroPrejuizoPercentual', title: 'Rentabilidade %', icon: Percent, description: 'Variação percentual total da carteira.' },
    { id: 'proventosAnuaisEstimados', title: 'Proventos Anuais (Est.)', icon: TrendingDown, description: 'Estimativa de dividendos anuais com base no DY.' },
    { id: 'totalInvestido', title: 'Total Investido', icon: BarChart3, description: 'Soma de todo o capital investido.' }
];

type WidgetId =
  | 'patrimonioTotal' | 'lucroPrejuizoTotal' | 'totalGanhos' | 'totalPerdas'
  | 'lucroPrejuizoPercentual' | 'proventosAnuaisEstimados' | 'totalInvestido'
  | 'patrimonialEvolution' | 'dashboardAllocation' | 'marketPulse';

interface WidgetConfig {
    id: WidgetId;
    colSpan: 3 | 4 | 6 | 8 | 12; // Using specific numbers for Tailwind CSS class generation
}

const ALL_POSSIBLE_WIDGETS: WidgetConfig[] = [
    { id: 'patrimonioTotal', colSpan: 3 }, { id: 'lucroPrejuizoTotal', colSpan: 3 },
    { id: 'lucroPrejuizoPercentual', colSpan: 3 }, { id: 'proventosAnuaisEstimados', colSpan: 3 },
    { id: 'totalGanhos', colSpan: 3 }, { id: 'totalPerdas', colSpan: 3 },
    { id: 'totalInvestido', colSpan: 3 },
    { id: 'patrimonialEvolution', colSpan: 12 }, { id: 'dashboardAllocation', colSpan: 8 },
    { id: 'marketPulse', colSpan: 4 },
];

const initialWidgets: WidgetConfig[] = [
    { id: 'patrimonioTotal', colSpan: 3 }, { id: 'lucroPrejuizoTotal', colSpan: 3 },
    { id: 'lucroPrejuizoPercentual', colSpan: 3 }, { id: 'proventosAnuaisEstimados', colSpan: 3 },
    { id: 'patrimonialEvolution', colSpan: 12 }, { id: 'dashboardAllocation', colSpan: 8 },
    { id: 'marketPulse', colSpan: 4 },
];

interface DashboardProps {
    portfolioData: Asset[];
    isDataLoaded: boolean;
    onStartAddAssetFlow: () => void;
    onAiAnalysis: () => void;
    onOptimizePortfolio: () => void;
    onLogout: () => void;
    onNavigate: (view: string) => void;
    derivedData: { [key: string]: number; };
    onSelectAsset: (ticker: string) => void;
}

const getColSpanClass = (span: number) => {
    const classMap: { [key: number]: string } = {
        3: 'md:col-span-3', 4: 'md:col-span-4', 6: 'md:col-span-6',
        8: 'md:col-span-8', 12: 'md:col-span-12',
    };
    return classMap[span] || 'md:col-span-12';
};

const Dashboard: React.FC<DashboardProps> = ({
    portfolioData, isDataLoaded, onStartAddAssetFlow, onAiAnalysis,
    onOptimizePortfolio, onLogout, onNavigate, derivedData, onSelectAsset
}) => {
    const evolutionChartRef = useRef<HTMLDivElement>(null);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isEditLayoutMode, setIsEditLayoutMode] = useState(false);
    const [widgets, setWidgets] = useState<WidgetConfig[]>(initialWidgets);
    const [originalWidgets, setOriginalWidgets] = useState<WidgetConfig[]>(initialWidgets);
    const [draggedWidgetId, setDraggedWidgetId] = useState<WidgetId | null>(null);

    const hiddenWidgets = useMemo(() =>
        ALL_POSSIBLE_WIDGETS.filter(w => !widgets.some(vis => vis.id === w.id)),
        [widgets]
    );

    const handleEnterEditMode = () => {
        setOriginalWidgets(widgets);
        setIsEditLayoutMode(true);
    };

    const handleCancelEditMode = () => {
        setWidgets(originalWidgets);
        setIsEditLayoutMode(false);
    };

    const handleSaveLayout = () => setIsEditLayoutMode(false);
    
    const handleHideWidget = (id: WidgetId) => setWidgets(prev => prev.filter(w => w.id !== id));
    const handleShowWidget = (id: WidgetId) => {
        const widgetToAdd = ALL_POSSIBLE_WIDGETS.find(w => w.id === id);
        if (widgetToAdd) setWidgets(prev => [...prev, widgetToAdd]);
    };

    const handleDragStart = (id: WidgetId) => setDraggedWidgetId(id);
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleDragEnd = () => setDraggedWidgetId(null);

    const handleDrop = (targetId: WidgetId) => {
        if (!draggedWidgetId || draggedWidgetId === targetId) return;

        const updatedWidgets = [...widgets];
        const draggedIndex = updatedWidgets.findIndex(w => w.id === draggedWidgetId);
        const targetIndex = updatedWidgets.findIndex(w => w.id === targetId);
        
        const [draggedItem] = updatedWidgets.splice(draggedIndex, 1);
        updatedWidgets.splice(targetIndex, 0, draggedItem);
        
        setWidgets(updatedWidgets);
        setDraggedWidgetId(null);
    };

    const handleExportPdf = async () => {
        if (!evolutionChartRef.current) return;
        setIsExportingPdf(true);
        try {
            const canvas = await html2canvas(evolutionChartRef.current, { backgroundColor: null, useCORS: true });
            const chartImageDataUrl = canvas.toDataURL('image/png');
            await generatePortfolioPdf(portfolioData, {
                patrimonioTotal: derivedData.patrimonioTotal,
                lucroPrejuizoTotal: derivedData.lucroPrejuizoTotal,
                totalInvestido: derivedData.totalInvestido,
                proventosAnuaisEstimados: derivedData.proventosAnuaisEstimados,
            }, chartImageDataUrl);
        } catch (error) {
            console.error("Failed to export PDF:", error);
        } finally {
             setIsExportingPdf(false);
        }
    };

    const renderWidgetComponent = (id: WidgetId) => {
        const isKpi = ALL_KPIS.some(kpi => kpi.id === id);
        if (isKpi) {
            const kpi = ALL_KPIS.find(k => k.id === id)!;
            const value = id === 'lucroPrejuizoPercentual' ? `${derivedData[id].toFixed(2)}%` : derivedData[id];
            const format = id.includes('Percentual') ? 'number' : 'currency';
            
            return (
                <KpiCard
                    title={kpi.title} value={value} format={format} icon={kpi.icon}
                    isProfit={kpi.id.includes('Ganhos') || kpi.id === 'lucroPrejuizoTotal'}
                    isLoss={kpi.id.includes('Perdas')} description={kpi.description}
                    isFeatured={kpi.id === 'patrimonioTotal'}
                    isEditMode={isEditLayoutMode} onHide={() => handleHideWidget(id)}
                />
            );
        }
        switch (id) {
            case 'patrimonialEvolution': return <PatrimonialEvolutionChart portfolioData={portfolioData} ref={evolutionChartRef} />;
            case 'dashboardAllocation': return <DashboardAllocationChart portfolioData={portfolioData} onNavigate={onNavigate} />;
            case 'marketPulse': return <MarketPulse />;
            default: return null;
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
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div className="flex items-center gap-4">
                    <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 dark:text-slate-100">Visão Geral</h1>
                    {!isEditLayoutMode && (
                        <button onClick={handleEnterEditMode} className="hidden md:flex items-center gap-1.5 p-2 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-full font-semibold text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Personalizar Layout">
                           <Edit className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <Header 
                    portfolioData={portfolioData} onStartAddAssetFlow={onStartAddAssetFlow} onAiAnalysis={onAiAnalysis}
                    onExportPdf={handleExportPdf} isExportingPdf={isExportingPdf} onOptimizePortfolio={onOptimizePortfolio}
                    onLogout={onLogout} onNavigate={onNavigate} onSelectAsset={onSelectAsset}
                />
            </div>
            <div className="hidden md:block"><TickerTape assets={portfolioData} /></div>

            <div className="space-y-6">
                {isEditLayoutMode && (
                    <div className="flex justify-end items-center gap-2 p-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-900/30 rounded-lg animate-fade-in-down">
                         <p className="text-sm font-semibold text-sky-800 dark:text-sky-200 mr-auto">Arraste os widgets para reordenar.</p>
                         <button onClick={handleCancelEditMode} className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md font-semibold text-slate-700 dark:text-slate-200 text-sm transition-colors">
                            <X className="h-4 w-4" /> Cancelar
                        </button>
                         <button onClick={handleSaveLayout} className="flex items-center gap-1.5 py-1.5 px-3 bg-sky-600 hover:bg-sky-500 rounded-md font-semibold text-white text-sm transition-colors">
                            <Save className="h-4 w-4" /> Salvar Layout
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {widgets.map(widget => {
                        const colSpanClass = getColSpanClass(widget.colSpan);
                        const isBeingDragged = draggedWidgetId === widget.id;
                        const isKpi = ALL_KPIS.some(kpi => kpi.id === widget.id);

                        return (
                            <div
                                key={widget.id}
                                className={`relative transition-all duration-300 ${colSpanClass} ${isBeingDragged ? 'opacity-30' : ''}`}
                                draggable={isEditLayoutMode}
                                onDragStart={() => handleDragStart(widget.id)}
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(widget.id)}
                                onDragEnd={handleDragEnd}
                            >
                                {isEditLayoutMode && !isKpi && (
                                    <>
                                        <div className="absolute inset-0 border-2 border-dashed border-slate-400 dark:border-slate-600 rounded-lg pointer-events-none z-10" />
                                        <div className="absolute top-4 left-4 z-20 cursor-grab text-slate-500 dark:text-slate-400" aria-label="Arrastar para reordenar">
                                            <GripVertical className="h-6 w-6" />
                                        </div>
                                        <button onClick={() => handleHideWidget(widget.id)} title={`Ocultar ${widget.id}`} className="absolute top-2 right-2 p-1 bg-slate-200/50 dark:bg-slate-700/50 rounded-full text-slate-500 dark:text-slate-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 z-20 transition-colors">
                                            <XCircle className="h-5 w-5" />
                                        </button>
                                    </>
                                )}
                                {renderWidgetComponent(widget.id)}
                            </div>
                        );
                    })}
                </div>
                 {isEditLayoutMode && hiddenWidgets.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-dashed border-slate-300 dark:border-slate-600">
                        <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">Widgets Ocultos</h3>
                        <div className="flex flex-wrap gap-2">
                            {hiddenWidgets.map(widget => {
                                const kpiInfo = ALL_KPIS.find(k => k.id === widget.id);
                                const widgetName = kpiInfo ? kpiInfo.title : widget.id.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                return (
                                <button
                                    key={widget.id}
                                    onClick={() => handleShowWidget(widget.id)}
                                    title={`Adicionar ${widgetName}`}
                                    className="flex items-center gap-2 py-1.5 px-3 bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors animate-fade-in-item"
                                >
                                    <PlusCircle className="h-4 w-4 text-emerald-500" />
                                    {widgetName}
                                </button>
                            )})}
                        </div>
                    </div>
                )}
            </div>
             <AddAssetButton onClick={onStartAddAssetFlow} />
        </div>
    );
};

export default Dashboard;
