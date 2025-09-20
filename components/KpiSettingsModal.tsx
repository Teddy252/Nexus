import React, { useState, useEffect } from 'react';
import { KpiConfig } from '../types';
import { X } from 'lucide-react';

interface KpiSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    allKpis: KpiConfig[];
    visibleKpis: string[];
    onSave: (newVisibleKpis: string[]) => void;
}

const KpiSettingsModal: React.FC<KpiSettingsModalProps> = ({ isOpen, onClose, allKpis, visibleKpis, onSave }) => {
    const [selectedKpis, setSelectedKpis] = useState<Set<string>>(new Set(visibleKpis));

    useEffect(() => {
        setSelectedKpis(new Set(visibleKpis));
    }, [visibleKpis, isOpen]);

    const handleToggleKpi = (kpiId: string) => {
        setSelectedKpis(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(kpiId)) {
                newSelection.delete(kpiId);
            } else {
                newSelection.add(kpiId);
            }
            return newSelection;
        });
    };

    const handleSave = () => {
        onSave(Array.from(selectedKpis));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 rounded-xl shadow-2xl">
                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Personalizar Indicadores</h2>
                     <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-full">
                        <X className="h-5 w-5" />
                    </button>
                </header>
                
                <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
                    Selecione os indicadores (KPIs) que você deseja exibir na sua barra de estatísticas.
                </p>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {allKpis.map(kpi => {
                        const Icon = kpi.icon;
                        const isChecked = selectedKpis.has(kpi.id);
                        return (
                            <label
                                key={kpi.id}
                                htmlFor={`kpi-${kpi.id}`}
                                className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                                    isChecked 
                                    ? 'bg-sky-50 dark:bg-sky-500/10 border border-sky-500/50' 
                                    : 'bg-slate-100 dark:bg-slate-700/50 border border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    id={`kpi-${kpi.id}`}
                                    checked={isChecked}
                                    onChange={() => handleToggleKpi(kpi.id)}
                                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-sky-600 focus:ring-sky-500 bg-transparent dark:bg-slate-600"
                                />
                                <Icon className="h-5 w-5 mx-3 text-slate-500 dark:text-slate-400" />
                                <div className="flex-grow">
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{kpi.title}</span>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{kpi.description}</p>
                                </div>
                            </label>
                        )
                    })}
                </div>
                
                <div className="mt-8 flex justify-end space-x-4">
                    <button type="button" onClick={onClose} className="py-2 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg font-semibold text-slate-700 dark:text-slate-300 transition-colors">Cancelar</button>
                    <button type="button" onClick={handleSave} className="py-2 px-5 bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold text-white transition-colors">Salvar</button>
                </div>
            </div>
        </div>
    );
};

export default KpiSettingsModal;