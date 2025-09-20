import React from 'react';
import { PlusCircle, BrainCircuit, Download, Loader2, Wand2, UploadCloud } from 'lucide-react';

interface QuickActionsProps {
    onAddAsset: () => void;
    onAiAnalysis: () => void;
    onExportPdf: () => void;
    isExportingPdf: boolean;
    onOptimizePortfolio: () => void;
    onImportPortfolio: () => void;
}

const ActionButton: React.FC<{ onClick?: () => void; title: string; icon?: React.ElementType; disabled?: boolean; children?: React.ReactNode }> = ({ onClick, title, icon: Icon, disabled, children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-sky-500 dark:text-slate-400 dark:hover:text-sky-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
        {children || (Icon && <Icon className="h-5 w-5" />)}
    </button>
);


const QuickActions: React.FC<QuickActionsProps> = ({ onAddAsset, onAiAnalysis, onExportPdf, isExportingPdf, onOptimizePortfolio, onImportPortfolio }) => {
    return (
        <div className="flex items-center space-x-2">
            <ActionButton
                onClick={onImportPortfolio}
                title="Importar Carteira (.csv, .xlsx)"
                icon={UploadCloud}
            />
            <ActionButton
                onClick={onAddAsset}
                title="Adicionar Ativo"
                icon={PlusCircle}
            />
            <ActionButton
                onClick={onAiAnalysis}
                title="Análise com IA"
                icon={BrainCircuit}
            />
            <ActionButton
                onClick={onOptimizePortfolio}
                title="Otimizar com IA"
                icon={Wand2}
            />
            <ActionButton
                onClick={onExportPdf}
                disabled={isExportingPdf}
                title={isExportingPdf ? 'Exportando...' : 'Exportar PDF'}
            >
                {isExportingPdf ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            </ActionButton>
        </div>
    );
};

export default QuickActions;