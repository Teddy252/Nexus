import React, { useState, useMemo, useEffect } from 'react';
import { KpiConfig } from '../types';
import KpiCard from './KpiCard';
import { Settings, Check, GripVertical, PlusCircle, Eye } from 'lucide-react';

interface StatsBarProps {
    derivedData: {
        [key: string]: number;
    };
    allKpis: KpiConfig[];
    visibleKpis: string[];
    onSaveKpis: (newVisibleKpis: string[]) => void;
}

const StatsBar: React.FC<StatsBarProps> = ({ derivedData, allKpis, visibleKpis, onSaveKpis }) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [localVisibleKpis, setLocalVisibleKpis] = useState(visibleKpis);
    const [draggedId, setDraggedId] = useState<string | null>(null);

    useEffect(() => {
        setLocalVisibleKpis(visibleKpis);
    }, [visibleKpis]);

    const hiddenKpis = useMemo(() => {
        return allKpis.filter(kpi => !localVisibleKpis.includes(kpi.id));
    }, [allKpis, localVisibleKpis]);
    
    const handleSave = () => {
        onSaveKpis(localVisibleKpis);
        setIsEditMode(false);
    };

    const handleCancel = () => {
        setLocalVisibleKpis(visibleKpis); // Revert changes
        setIsEditMode(false);
    };

    const handleHideKpi = (idToHide: string) => {
        setLocalVisibleKpis(prev => prev.filter(id => id !== idToHide));
    };

    const handleShowKpi = (idToShow: string) => {
        setLocalVisibleKpis(prev => [...prev, idToShow]);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
        e.preventDefault();
        if (draggedId === null || draggedId === targetId) return;

        const newOrder = [...localVisibleKpis];
        const draggedIndex = newOrder.indexOf(draggedId);
        const targetIndex = newOrder.indexOf(targetId);

        const [removed] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, removed);
        
        setLocalVisibleKpis(newOrder);
        setDraggedId(null);
    };
    
    const getKpiById = (id: string) => allKpis.find(k => k.id === id);
    const getKpiValue = (id: string) => {
        const value = derivedData[id];
        return id === 'lucroPrejuizoPercentual' ? `${value.toFixed(2)}%` : value;
    };
    const getKpiFormat = (id: string): 'currency' | 'number' => (id.includes('Percentual') ? 'number' : 'currency');

    return (
        <div className="relative">
             <div className="absolute -top-9 right-0 z-10">
                {isEditMode ? (
                    <div className="flex items-center gap-2">
                         <button
                            onClick={handleCancel}
                            className="py-1 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md font-semibold text-slate-700 dark:text-slate-200 text-sm transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-1.5 py-1 px-3 bg-sky-600 hover:bg-sky-500 rounded-md font-semibold text-white text-sm transition-colors"
                        >
                            <Check className="h-4 w-4" />
                            Concluir
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsEditMode(true)}
                        className="p-2 text-slate-500 hover:text-sky-500 rounded-full transition-colors dark:text-slate-400 dark:hover:text-sky-400"
                        title="Personalizar KPIs"
                    >
                        <Settings className="h-5 w-5" />
                    </button>
                )}
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:mx-0 sm:px-0 sm:pb-0">
                 {localVisibleKpis.map(kpiId => {
                     const kpi = getKpiById(kpiId);
                     if (!kpi) return null;
                     
                     return (
                        <div
                            key={kpi.id}
                            draggable={isEditMode}
                            onDragStart={(e) => handleDragStart(e, kpi.id)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, kpi.id)}
                            className={`flex-shrink-0 w-64 sm:w-auto ${draggedId === kpi.id ? 'opacity-30' : ''}`}
                        >
                            <KpiCard
                                title={kpi.title}
                                value={getKpiValue(kpi.id)}
                                format={getKpiFormat(kpi.id)}
                                icon={kpi.icon}
                                isProfit={kpi.id.includes('Ganhos') || kpi.id === 'lucroPrejuizoTotal'}
                                isLoss={kpi.id.includes('Perdas')}
                                description={kpi.description}
                                isEditMode={isEditMode}
                                onHide={() => handleHideKpi(kpi.id)}
                                isFeatured={kpi.id === 'patrimonioTotal'}
                            />
                        </div>
                     );
                 })}
            </div>
            
             {isEditMode && (
                <div className="mt-6 pt-6 border-t border-dashed border-slate-300 dark:border-slate-600">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">Indicadores Disponíveis</h3>
                    <div className="flex flex-wrap gap-2">
                        {hiddenKpis.map(kpi => (
                            <button
                                key={kpi.id}
                                onClick={() => handleShowKpi(kpi.id)}
                                title={`Adicionar ${kpi.title}`}
                                className="flex items-center gap-2 py-1.5 px-3 bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors animate-fade-in-item"
                            >
                                <PlusCircle className="h-4 w-4 text-emerald-500" />
                                {kpi.title}
                            </button>
                        ))}
                         {hiddenKpis.length === 0 && (
                            <p className="text-sm text-slate-500 dark:text-slate-400">Todos os indicadores já estão visíveis.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatsBar;