import React from 'react';
import { AiAnalysis } from '../types';
import { X, TrendingUp, TrendingDown, Package, Globe, AlertTriangle, Lightbulb, Bot, Sparkles, Activity, MinusCircle } from 'lucide-react';

interface AiInsightsModalProps {
    isOpen: boolean;
    onClose: () => void;
    analysis: AiAnalysis | null;
    isLoading: boolean;
    error: string | null;
}

const riskLevelColors: { [key: string]: string } = {
    'Baixo': 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
    'Moderado': 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-500/10 dark:text-yellow-300 dark:border-yellow-500/30',
    'Alto': 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
    'Muito Alto': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30',
};

const InfoCard: React.FC<{ icon: React.ElementType; title: string; children: React.ReactNode; colorClass?: string }> = ({ icon: Icon, title, children, colorClass = 'text-purple-500 dark:text-purple-400' }) => (
    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <h3 className={`font-semibold ${colorClass} mb-3 flex items-center text-lg`}>
            <Icon className="mr-3 h-6 w-6" /> {title}
        </h3>
        {children}
    </div>
);

const getSentimentStyle = (sentimentText: string = '') => {
    const text = sentimentText.toLowerCase();
    if (text.includes('otimista')) {
        return {
            label: 'Otimista',
            Icon: TrendingUp,
            colorClass: 'text-emerald-500 dark:text-emerald-400',
            bgClass: 'bg-emerald-100 dark:bg-emerald-500/10',
            borderClass: 'border-emerald-500/30',
        };
    }
    if (text.includes('pessimista')) {
        return {
            label: 'Pessimista',
            Icon: TrendingDown,
            colorClass: 'text-red-500 dark:text-red-400',
            bgClass: 'bg-red-100 dark:bg-red-500/10',
            borderClass: 'border-red-500/30',
        };
    }
    return {
        label: 'Neutro',
        Icon: MinusCircle,
        colorClass: 'text-slate-500 dark:text-slate-400',
        bgClass: 'bg-slate-100 dark:bg-slate-500/10',
        borderClass: 'border-slate-500/30',
    };
};


const AiInsightsModal: React.FC<AiInsightsModalProps> = ({ isOpen, onClose, analysis, isLoading, error }) => {
    if (!isOpen) return null;

    const renderLoading = () => (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-300">Analisando seu portfólio...</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A IA está processando os dados para gerar insights.</p>
        </div>
    );

    const renderError = () => (
        <div className="flex flex-col items-center justify-center h-full bg-red-50 dark:bg-red-500/10 p-6 rounded-lg">
            <AlertTriangle className="h-12 w-12 text-red-400" />
            <p className="mt-4 text-red-500 font-semibold">Ocorreu um Erro</p>
            <p className="mt-1 text-sm text-red-600 dark:text-red-300 text-center">{error}</p>
        </div>
    );
    
    const renderContent = () => {
        const sentimentStyle = getSentimentStyle(analysis?.marketSentiment);
        return (
            <div className="space-y-6">
                <InfoCard icon={Bot} title="Resumo do Analista IA">
                    <p className="text-slate-600 dark:text-slate-300 italic text-base">{analysis?.summary}</p>
                </InfoCard>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoCard icon={TrendingUp} title="Melhores Desempenhos" colorClass="text-emerald-500 dark:text-emerald-400">
                         <div className="space-y-3">
                            {analysis?.topPerformers.map(p => (
                                <div key={p.ticker} className="p-3 bg-white dark:bg-slate-700/50 rounded-lg">
                                    <p className="font-bold text-slate-800 dark:text-slate-100">{p.ticker}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{p.reason}</p>
                                </div>
                            ))}
                        </div>
                    </InfoCard>
                    <InfoCard icon={TrendingDown} title="Piores Desempenhos" colorClass="text-red-500 dark:text-red-400">
                        <div className="space-y-3">
                            {analysis?.worstPerformers.map(p => (
                                <div key={p.ticker} className="p-3 bg-white dark:bg-slate-700/50 rounded-lg">
                                    <p className="font-bold text-slate-800 dark:text-slate-100">{p.ticker}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{p.reason}</p>
                                </div>
                            ))}
                        </div>
                    </InfoCard>
                </div>

                <InfoCard icon={Package} title="Análise de Diversificação" colorClass="text-sky-500 dark:text-sky-400">
                     <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center mb-1"><Package className="mr-2 h-4 w-4"/>Por Categoria</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{analysis?.diversification.byCategory}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center mb-1"><Globe className="mr-2 h-4 w-4"/>Por País</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{analysis?.diversification.byCountry}</p>
                        </div>
                    </div>
                </InfoCard>
                
                {analysis?.riskAnalysis && (
                    <InfoCard icon={AlertTriangle} title="Análise de Risco" colorClass="text-amber-500 dark:text-amber-400">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-slate-700 dark:text-slate-300">Nível de Risco Geral:</span>
                                <span className={`px-3 py-1 text-sm font-bold rounded-full border ${riskLevelColors[analysis.riskAnalysis.overallRiskLevel]}`}>
                                    {analysis.riskAnalysis.overallRiskLevel}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{analysis.riskAnalysis.riskSummary}"</p>
                            <div>
                                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2 text-sm">Principais Fatores de Risco:</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                    {analysis.riskAnalysis.riskFactors.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                            </div>
                        </div>
                    </InfoCard>
                )}

                {analysis?.marketSentiment && (
                    <InfoCard icon={Activity} title="Sentimento do Mercado" colorClass="text-blue-500 dark:text-blue-400">
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-bold rounded-full border ${sentimentStyle.bgClass} ${sentimentStyle.colorClass} ${sentimentStyle.borderClass}`}>
                                <sentimentStyle.Icon className="h-4 w-4" />
                                {sentimentStyle.label}
                            </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{analysis.marketSentiment}"</p>
                    </InfoCard>
                )}

                <InfoCard icon={Lightbulb} title="Sugestões Práticas" colorClass="text-yellow-500 dark:text-yellow-400">
                    <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        {analysis?.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                </InfoCard>

                <InfoCard icon={Sparkles} title="Sugestão Futurista" colorClass="text-fuchsia-500 dark:text-fuchsia-400">
                    <p className="text-slate-600 dark:text-slate-300 text-base">{analysis?.futuristicSuggestion}</p>
                </InfoCard>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col">
                <header className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Análise de Portfólio com IA</h2>
                    <button onClick={onClose} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 rounded-full">
                        <X className="h-6 w-6" />
                    </button>
                </header>
                <main className="p-6 overflow-y-auto max-h-[80vh]">
                   {isLoading ? renderLoading() : error ? renderError() : renderContent()}
                </main>
            </div>
        </div>
    );
};

export default AiInsightsModal;