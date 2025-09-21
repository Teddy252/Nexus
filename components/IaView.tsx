import React, { useState } from 'react';
import { BrainCircuit, Wand2, Bot, ImageIcon, Loader2, AlertTriangle } from 'lucide-react';
import { generateAppIcon } from '../services/geminiService';

interface IaViewProps {
    onAiAnalysis: () => void;
    onOptimizePortfolio: () => void;
}

const IaView: React.FC<IaViewProps> = ({ onAiAnalysis, onOptimizePortfolio }) => {
    const [iconPrompt, setIconPrompt] = useState(
        "Um ícone moderno e abstrato para um aplicativo de finanças e tecnologia chamado Nexus, representando o conceito de ascensão. Use cores como azul, verde e um toque de dourado."
    );
    const [generatedIcon, setGeneratedIcon] = useState<string | null>(null);
    const [isGeneratingIcon, setIsGeneratingIcon] = useState(false);
    const [iconError, setIconError] = useState<string | null>(null);

    const handleGenerateIcon = async () => {
        setIsGeneratingIcon(true);
        setIconError(null);
        setGeneratedIcon(null);
        try {
            const imageUrl = await generateAppIcon(iconPrompt);
            setGeneratedIcon(imageUrl);
        } catch (error: any) {
            setIconError(error.message || "Falha ao gerar o ícone.");
        } finally {
            setIsGeneratingIcon(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto text-center">
            <header className="mb-8 md:mb-12">
                <Bot className="h-20 w-20 mx-auto text-sky-500 mb-4" />
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-2">Central de Inteligência Artificial</h1>
                <p className="text-base md:text-lg text-slate-500 dark:text-slate-400">Utilize o poder da IA para obter insights profundos e otimizar sua estratégia de investimentos.</p>
            </header>

            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <button 
                        onClick={onAiAnalysis}
                        className="group bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-sky-500/10 hover:border-sky-500/50 transition-all duration-300 transform hover:-translate-y-2"
                    >
                        <BrainCircuit className="h-12 w-12 mx-auto text-purple-500 mb-4 transition-transform group-hover:scale-110" />
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Análise Completa</h2>
                        <p className="text-slate-500 dark:text-slate-400">Receba um diagnóstico detalhado da sua carteira, incluindo pontos fortes, fracos, análise de risco e sugestões de melhoria.</p>
                    </button>
                    <button 
                        onClick={onOptimizePortfolio}
                        className="group bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-sky-500/10 hover:border-sky-500/50 transition-all duration-300 transform hover:-translate-y-2"
                    >
                        <Wand2 className="h-12 w-12 mx-auto text-sky-500 mb-4 transition-transform group-hover:scale-110" />
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Otimização Inteligente</h2>
                        <p className="text-slate-500 dark:text-slate-400">Obtenha um plano de ação acionável para rebalancear sua carteira, com sugestões de compra e venda para atingir seus objetivos.</p>
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg text-left">
                     <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
                        <ImageIcon className="h-6 w-6 mr-3 text-fuchsia-500" />
                        Gerador de Ícone para o App
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">
                        Use a IA para criar um ícone para o aplicativo com base na sua descrição.
                    </p>
                    
                    <textarea
                        value={iconPrompt}
                        onChange={(e) => setIconPrompt(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md p-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="Descreva o ícone que você deseja..."
                    />

                    <button
                        onClick={handleGenerateIcon}
                        disabled={isGeneratingIcon}
                        className="mt-4 w-full md:w-auto flex items-center justify-center gap-2 py-2.5 px-6 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-lg font-semibold text-white transition-colors disabled:opacity-60"
                    >
                        {isGeneratingIcon ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Gerando...
                            </>
                        ) : (
                            "Gerar Ícone"
                        )}
                    </button>

                    {iconError && (
                        <div className="mt-4 flex items-center gap-3 p-3 bg-red-500/10 rounded-lg text-red-600 dark:text-red-400">
                             <AlertTriangle className="h-5 w-5" />
                            <p className="text-sm">{iconError}</p>
                        </div>
                    )}

                    {generatedIcon && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Ícone Gerado:</h3>
                            <img src={generatedIcon} alt="Ícone gerado pela IA" className="w-48 h-48 rounded-2xl shadow-md mx-auto md:mx-0" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IaView;