import React, { useState, useEffect } from 'react';
import { DashboardWidget, DashboardWidgetId } from '../types';
import { X, Eye, EyeOff, GripVertical } from 'lucide-react';

interface DashboardSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentConfig: DashboardWidget[];
    onSave: (newConfig: DashboardWidget[]) => void;
}

const WIDGET_NAMES: { [key in DashboardWidgetId]: string } = {
    totalEquity: 'Patrimônio Total',
    patrimonialEvolution: 'Evolução Patrimonial',
    statsBar: 'Barra de Estatísticas',
    portfolio: 'Tabela de Ativos',
    allocation: 'Gráficos de Alocação',
    marketNews: 'Notícias do Mercado',
};

const colSpanOptions: { label: string; value: number }[] = [
    { label: '25%', value: 3 },
    { label: '33%', value: 4 },
    { label: '50%', value: 6 },
    { label: '66%', value: 8 },
    { label: '75%', value: 9 },
    { label: '100%', value: 12 },
];


const DashboardSettingsModal: React.FC<DashboardSettingsModalProps> = ({ isOpen, onClose, currentConfig, onSave }) => {
    const [config, setConfig] = useState<DashboardWidget[]>([]);
    const [draggedWidgetId, setDraggedWidgetId] = useState<DashboardWidgetId | null>(null);
    const [dragOverWidgetId, setDragOverWidgetId] = useState<DashboardWidgetId | null>(null);

    useEffect(() => {
        const sortedConfig = [...currentConfig].sort((a, b) => a.order - b.order);
        setConfig(sortedConfig);
    }, [currentConfig, isOpen]);

    const handleToggleVisibility = (id: DashboardWidget['id']) => {
        setConfig(prevConfig =>
            prevConfig.map(widget =>
                widget.id === id ? { ...widget, visible: !widget.visible } : widget
            )
        );
    };

     const handleColSpanChange = (id: DashboardWidgetId, colSpan: number) => {
        setConfig(prev =>
            prev.map(w =>
                w.id === id ? { ...w, colSpan: colSpan } : w
            )
        );
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: DashboardWidgetId) => {
        setDraggedWidgetId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetId: DashboardWidgetId) => {
        e.preventDefault();
        if (targetId !== dragOverWidgetId) {
            setDragOverWidgetId(targetId);
        }
    };
    
    const handleDragLeave = () => {
        setDragOverWidgetId(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: DashboardWidgetId) => {
        e.preventDefault();
        if (!draggedWidgetId || draggedWidgetId === targetId) {
            setDraggedWidgetId(null);
            return;
        }

        const draggedIndex = config.findIndex(w => w.id === draggedWidgetId);
        const targetIndex = config.findIndex(w => w.id === targetId);
        
        if (draggedIndex === -1 || targetIndex === -1) return;

        const newConfig = [...config];
        const [draggedItem] = newConfig.splice(draggedIndex, 1);
        newConfig.splice(targetIndex, 0, draggedItem);
        
        setConfig(newConfig);
        setDraggedWidgetId(null);
        setDragOverWidgetId(null);
    };
    
    const handleSave = () => {
        const finalConfig = config.map((widget, index) => ({
            ...widget,
            order: index,
        }));
        onSave(finalConfig);
    };

    if (!isOpen) return null;
    
    const editableWidgets = config.filter(w => w.id !== 'statsBar');

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-lg p-6 rounded-xl shadow-2xl">
                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Personalizar Painel</h2>
                     <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-full">
                        <X className="h-5 w-5" />
                    </button>
                </header>
                
                <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
                   Configure a visibilidade, o tamanho e a ordem dos widgets. Arraste-os para reordenar.
                </p>

                <div className="space-y-3">
                    {editableWidgets.map(widget => {
                        const isBeingDragged = draggedWidgetId === widget.id;
                        const isDragTarget = dragOverWidgetId === widget.id && !isBeingDragged;

                        return (
                            <div
                                key={widget.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, widget.id)}
                                onDragOver={(e) => handleDragOver(e, widget.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, widget.id)}
                                className={`flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg transition-all duration-200
                                    ${isBeingDragged ? 'opacity-30' : 'opacity-100'}
                                    ${isDragTarget ? 'outline outline-2 outline-offset-2 outline-sky-500 outline-dashed' : ''}
                                `}
                            >
                                <button className="cursor-move p-1 text-slate-500 dark:text-slate-400" title="Arraste para reordenar">
                                    <GripVertical className="h-5 w-5" />
                                </button>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 flex-grow">{WIDGET_NAMES[widget.id]}</span>
                                
                                <div title="Alterar tamanho do widget" className="flex items-center bg-white dark:bg-slate-700 p-0.5 rounded-md border border-slate-300 dark:border-slate-600">
                                    {colSpanOptions.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleColSpanChange(widget.id, option.value)}
                                            title={`Largura: ${option.label}`}
                                            className={`px-2 py-0.5 text-xs rounded-sm transition-colors ${widget.colSpan === option.value ? 'bg-sky-500 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300'}`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleToggleVisibility(widget.id)}
                                    title={widget.visible ? 'Ocultar widget' : 'Mostrar widget'}
                                    className="p-2 rounded-md transition-colors"
                                >
                                    {widget.visible ? <Eye className="h-5 w-5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100" /> : <EyeOff className="h-5 w-5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100" />}
                                </button>
                            </div>
                        )
                    })}
                </div>
                
                <div className="mt-8 flex justify-end space-x-4">
                    <button type="button" onClick={onClose} className="py-2 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg font-semibold text-slate-700 dark:text-slate-300 transition-colors">Cancelar</button>
                    <button type="button" onClick={handleSave} className="py-2 px-5 bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold text-white transition-colors">Salvar Layout</button>
                </div>
            </div>
        </div>
    );
};

export default DashboardSettingsModal;