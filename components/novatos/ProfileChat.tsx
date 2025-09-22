import React, { useState, useRef, useEffect } from 'react';
import { InvestorProfile } from '../../types';
import { getInvestorProfileAnalysis } from '../../services/geminiService';
import { Message } from '../../types';
import { Send, Loader2, Bot, User } from 'lucide-react';

interface ProfileChatProps {
    onProfileDetermined: (profile: InvestorProfile) => void;
}

const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
    const isUser = message.sender === 'user';
    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-slate-500 dark:text-slate-300" />
                </div>
            )}
            <div className={`max-w-sm md:max-w-md p-3 rounded-2xl ${isUser ? 'bg-sky-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-none'}`}>
                <p className="text-sm">{message.text}</p>
            </div>
             {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                </div>
            )}
        </div>
    );
};


const ProfileChat: React.FC<ProfileChatProps> = ({ onProfileDetermined }) => {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: 'Olá! Sou seu assistente financeiro e estou aqui para te ajudar a dar os primeiros passos no mundo dos investimentos. Pode ficar tranquilo(a), nosso papo é sem jargões e sem riscos. Vamos começar? Me diga, qual o seu principal sonho ou objetivo ao pensar em investir? (Ex: comprar um imóvel, aposentadoria, uma grande viagem...)' }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async () => {
        if (!userInput.trim() || isLoading) return;

        const newMessages: Message[] = [...messages, { sender: 'user', text: userInput }];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);

        try {
            const result = await getInvestorProfileAnalysis(newMessages);
            if (result.profile) {
                setMessages(prev => [...prev, { sender: 'ai', text: result.summary }]);
                setTimeout(() => onProfileDetermined(result.profile as InvestorProfile), 3000); 
            } else {
                setMessages(prev => [...prev, { sender: 'ai', text: result.summary }]);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { sender: 'ai', text: 'Desculpe, tive um problema para processar sua resposta. Vamos tentar de novo. Qual é o seu principal objetivo ao investir?' }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="max-w-2xl mx-auto bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col h-[75vh]">
            <header className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 text-center">Análise de Perfil</h2>
            </header>
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                {messages.map((msg, index) => <ChatMessage key={index} message={msg} />)}
                 {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                           <Bot className="w-5 h-5 text-slate-500 dark:text-slate-300" />
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none flex items-center justify-center h-10">
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
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="relative">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Digite sua resposta..."
                        disabled={isLoading}
                        className="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-lg py-3 pl-4 pr-12 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !userInput.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-sky-600 text-white rounded-full hover:bg-sky-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileChat;