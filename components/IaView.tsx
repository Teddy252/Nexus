import React, { useState, useRef, useEffect } from 'react';
import { Asset, Message, AiAnalysis, AiOptimizationAnalysis } from '../types';
import { getAiChatResponse } from '../services/geminiService';
import { Send, Bot, User, Sparkles, TrendingUp, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { formatAndSanitizeAiText } from '../utils/sanitizer.ts';

interface AiAssistantViewProps {
    portfolioData: Asset[];
}

// --- Nested Chat Bubble Components ---

const AiAnalysisContent: React.FC<{ analysis: AiAnalysis }> = ({ analysis }) => {
    return (
        <div className="space-y-3 mt-2 text-left">
            <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                <h4 className="font-semibold text-sm flex items-center mb-1"><TrendingUp className="h-4 w-4 mr-2 text-emerald-500"/>Destaques Positivos</h4>
                <ul className="list-disc list-inside text-xs space-y-1">
                    {analysis.topPerformers.map(p => <li key={p.ticker}><strong>{p.ticker}:</strong> {p.reason}</li>)}
                </ul>
            </div>
             <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                <h4 className="font-semibold text-sm flex items-center mb-1"><AlertTriangle className="h-4 w-4 mr-2 text-amber-500"/>Pontos de Atenção</h4>
                <ul className="list-disc list-inside text-xs space-y-1">
                    {analysis.riskAnalysis.riskFactors.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
            </div>
        </div>
    );
};

const AiOptimizationContent: React.FC<{ optimization: AiOptimizationAnalysis }> = ({ optimization }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const suggestionsToShow = isExpanded ? optimization.suggestions : optimization.suggestions.slice(0, 2);

    return (
        <div className="space-y-2 mt-2 text-left">
            {suggestionsToShow.map((s, i) => (
                 <div key={i} className="text-xs p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                    <p><strong>{s.action === 'BUY' ? 'Comprar' : s.action === 'SELL' ? 'Vender' : 'Manter'}: {s.ticker}</strong> ({s.quantidade} unidades)</p>
                    <p className="italic">Justificativa: {s.justificativa}</p>
                 </div>
            ))}
            {optimization.suggestions.length > 2 && (
                 <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1 mt-2">
                    {isExpanded ? 'Mostrar menos' : `Mostrar mais ${optimization.suggestions.length - 2} sugestões`}
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
            )}
        </div>
    );
}

const AiChatBubble: React.FC<{ message: Message }> = ({ message }) => {
    const isUser = message.sender === 'user';
    
    const renderContent = () => {
        const formattedAndSanitizedHtml = formatAndSanitizeAiText(message.text);
        
        switch(message.type) {
            case 'analysis':
                return (
                    <>
                        <div dangerouslySetInnerHTML={{ __html: formattedAndSanitizedHtml }} />
                        <AiAnalysisContent analysis={message.data} />
                    </>
                );
            case 'optimization':
                 return (
                    <>
                        <div dangerouslySetInnerHTML={{ __html: formattedAndSanitizedHtml }} />
                        <AiOptimizationContent optimization={message.data} />
                    </>
                );
            case 'news':
            case 'text':
            default:
                return <div className="space-y-1" dangerouslySetInnerHTML={{ __html: formattedAndSanitizedHtml }} />;
        }
    }

    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''} animate-fade-in-item`}>
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-slate-500 dark:text-slate-300" />
                </div>
            )}
            <div className={`max-w-sm md:max-w-md p-3 rounded-2xl ${isUser ? 'bg-sky-600 text-white rounded-br-lg' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-lg'}`}>
                <div className="text-sm">
                    {renderContent()}
                </div>
            </div>
             {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                </div>
            )}
        </div>
    );
};

// --- Main View Component ---

const suggestionChips = [
    "Faça uma análise da minha carteira",
    "Otimize meu portfólio com perfil balanceado",
    "Quais os principais riscos da minha carteira?",
    "Me dê notícias sobre a PETR4"
];

const IaView: React.FC<AiAssistantViewProps> = ({ portfolioData }) => {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: 'Olá! Sou seu assistente de investimentos. Como posso te ajudar hoje?' }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.parentElement?.scrollTo({
            top: messagesEndRef.current.parentElement.scrollHeight,
            behavior: 'smooth'
        });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    const handleSendMessage = async (prompt?: string) => {
        const messageText = prompt || userInput;
        if (!messageText.trim() || isLoading) return;

        const userMessage: Message = { sender: 'user', text: messageText };
        const newMessages: Message[] = [...messages, userMessage];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);

        try {
            const aiResponse = await getAiChatResponse(newMessages, portfolioData);
            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { sender: 'ai', text: 'Desculpe, ocorreu um erro. Por favor, tente novamente.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-80px)]">
            <header className="text-center p-4">
                <Bot className="h-12 w-12 mx-auto text-sky-500" />
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">Assistente Nexus AI</h1>
                <p className="text-slate-500 dark:text-slate-400">Seu copiloto para decisões de investimento inteligentes.</p>
            </header>
            
            <div className="flex-grow p-4 space-y-4 overflow-y-auto" >
                {messages.map((msg, index) => <AiChatBubble key={index} message={msg} />)}
                {isLoading && (
                    <div className="flex items-start gap-3 animate-fade-in-item">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                           <Bot className="w-5 h-5 text-slate-500 dark:text-slate-300" />
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-lg flex items-center justify-center h-10">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot" style={{ animationDelay: '0s' }}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                 <div ref={messagesEndRef} />
            </div>

            <div className="p-4 pt-0">
                {messages.length <= 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-4 animate-fade-in">
                        {suggestionChips.map(chip => (
                             <button key={chip} onClick={() => handleSendMessage(chip)} className="flex items-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-medium py-1.5 px-3 rounded-full transition-colors">
                                <Sparkles className="h-4 w-4 text-sky-500" /> {chip}
                             </button>
                        ))}
                    </div>
                )}
                <div className="relative">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Pergunte algo à IA..."
                        disabled={isLoading}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg py-3 pl-4 pr-12 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                        onClick={() => handleSendMessage()}
                        disabled={isLoading || !userInput.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-sky-600 text-white rounded-full hover:bg-sky-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                        aria-label="Enviar mensagem"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IaView;