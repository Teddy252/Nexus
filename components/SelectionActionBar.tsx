import React from 'react';
import { X, Copy, Trash2 } from 'lucide-react';

interface SelectionActionBarProps {
    count: number;
    onDuplicate: () => void;
    onDelete: () => void;
    onClear: () => void;
}

const SelectionActionBar: React.FC<SelectionActionBarProps> = ({ count, onDuplicate, onDelete, onClear }) => {
    return (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40">
            <div className="flex items-center gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl p-2 animate-fade-in-scale-up">
                <div className="flex items-center gap-2">
                    <button onClick={onClear} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Limpar seleção">
                        <X className="h-5 w-5 text-slate-500 dark:text-slate-400"/>
                    </button>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{count} selecionado{count > 1 ? 's' : ''}</span>
                </div>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                <div className="flex items-center gap-2">
                    <button onClick={onDuplicate} title="Duplicar" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <Copy className="h-5 w-5 text-slate-500 dark:text-slate-400"/>
                    </button>
                    <button onClick={onDelete} title="Excluir" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <Trash2 className="h-5 w-5 text-slate-500 dark:text-slate-400"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelectionActionBar;