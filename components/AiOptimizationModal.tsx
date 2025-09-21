import React from 'react';
import { AiOptimizationAnalysis, PortfolioSuggestion } from '../types';
import { X, AlertTriangle, ArrowUpCircle, ArrowDownCircle, Circle, Bot, Lightbulb } from 'lucide-react';

interface AiOptimizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    analysis: AiOptimizationAnalysis | null;
    isLoading: boolean;
    error: string | null;
    onApply: (suggestions: PortfolioSuggestion[]) => void;
}

const SuggestionIcon: React.FC<{ action: PortfolioSuggestion['action'] }> = ({ action }) => {
    switch (action) {
        case 'BUY': return <ArrowUpCircle className="h-6 w-6 text-emerald-500" />;
        case 'SELL': return <ArrowDownCircle className="h-6 w-6 text-red-500" />;
        case 'KEEP': return <Circle className="h-6 w-6 text-slate-500" />;
        default: return null;
    }
};

const AiOptimizationModal: React.FC<AiOptimizationModalProps> = ({ isOpen, onClose, analysis, isLoading, error, onApply }) => {
    if (!isOpen) return null;

    const renderLoading = () => (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-400"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-300">Otimizando seu portfólio...</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A IA está elaborando um plano de ação para você.</p>
        </div>
    );

    const renderError = () => (
        <div className="flex flex-col items-center justify-center h-full bg-red-900/20 p-6 rounded-lg">
            <AlertTriangle className="h-12 w-12 text-red-400" />
            <p className="mt-4 text-red-400 font-semibold">Ocorreu um Erro</p>
            <p className="mt-1 text-sm text-red-500 dark:text-red-300 text-center">{error}</p>
        </div>
    );

    const renderContent = () => (
        <>
            <div className="mb-6 p-4 bg-gradient-to-r from-sky-500/10 to-purple-500/10 rounded-lg border border-sky-500/20">
                <h3 className="font-semibold text-sky-500 dark:text-sky-400 mb-2 flex items-center"><Bot className="mr-2 h-5 w-5"/>Resumo da Estratégia</h3>
                <p className="text-slate-600 dark:text-slate-300 italic">{analysis?.strategySummary}</p>
            </div>
            
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-yellow-400"/>Plano de Ação Sugerido</h3>

            <div className="space-y-4">
                {analysis?.suggestions.map((s, i) => (
                    <div key={i} className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg flex gap-4">
                        <div className="flex-shrink-0 pt-1">
                            <SuggestionIcon action={s.action} />
                        </div>
                        <div className="flex-grow">
                            <div className="flex items-center justify-between">
                                <p className="font-bold text-slate-800 dark:text-slate-100">
                                    <span className="text-sm font-semibold uppercase">{s.action === 'BUY' ? 'Comprar' : s.action === 'SELL' ? 'Vender' : 'Manter'}</span> {s.ticker}
                                </p>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{s.quantidade.toLocaleString('pt-BR')} unidades</p>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{s.nome} &bull; {s.pais}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{s.justificativa}"</p>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col">
                <header className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Otimização de Portfólio com IA</h2>
                    <button onClick={onClose} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 rounded-full">
                        <X className="h-6 w-6" />
                    </button>
                </header>
                <main className="p-6 overflow-y-auto max-h-[70vh]">
                   {isLoading ? renderLoading() : error ? renderError() : renderContent()}
                </main>
                 {!isLoading && !error && analysis && (
                    <footer className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-xl">
                        <button type="button" onClick={onClose} className="py-2 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg font-semibold text-slate-700 dark:text-slate-300 transition-colors">
                            Cancelar
                        </button>
                        <button 
                            type="button" 
                            onClick={() => onApply(analysis.suggestions)}
                            className="py-2 px-5 bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold text-white transition-colors"
                        >
                            Aplicar Otimização
                        </button>
                    </footer>
                )}
            </div>
        </div>
    );
};

export default AiOptimizationModal;