import React from 'react';
import { OptimizationStrategy } from '../types';
import { X, Shield, BarChart2, TrendingUp } from 'lucide-react';

interface StrategySelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectStrategy: (strategy: OptimizationStrategy) => void;
}

const strategies = [
    { 
        name: 'Conservador', 
        icon: Shield,
        description: 'Foco em preservação de capital e renda, com baixa exposição a ativos de risco.',
        color: 'text-blue-500'
    },
    { 
        name: 'Balanceado', 
        icon: BarChart2,
        description: 'Combinação equilibrada entre crescimento e segurança, buscando retornos moderados.',
        color: 'text-purple-500'
    },
    { 
        name: 'Agressivo', 
        icon: TrendingUp,
        description: 'Foco em maximizar o crescimento do capital, com maior tolerância a risco e volatilidade.',
        color: 'text-red-500'
    }
];

const StrategyCard: React.FC<{ name: OptimizationStrategy, icon: React.ElementType, description: string, color: string, onSelect: () => void }> = ({ name, icon: Icon, description, color, onSelect }) => (
    <button
        onClick={onSelect}
        className="group w-full text-left bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-xl hover:border-sky-500/50 dark:hover:border-sky-500/50 transition-all duration-300 transform hover:-translate-y-1"
    >
        <Icon className={`h-10 w-10 mx-auto md:mx-0 ${color} mb-4 transition-transform group-hover:scale-110`} />
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{name}</h3>
        <p className="text-slate-500 dark:text-slate-400">{description}</p>
    </button>
);


const StrategySelectionModal: React.FC<StrategySelectionModalProps> = ({ isOpen, onClose, onSelectStrategy }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-slate-800 w-full max-w-4xl p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-fade-in-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Otimizar Carteira com IA</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Selecione o perfil de risco para a otimização.</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700">
                        <X className="h-5 w-5"/>
                    </button>
                </header>
                <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {strategies.map(strategy => (
                        <StrategyCard 
                            key={strategy.name}
                            name={strategy.name as OptimizationStrategy}
                            icon={strategy.icon}
                            description={strategy.description}
                            color={strategy.color}
                            onSelect={() => onSelectStrategy(strategy.name as OptimizationStrategy)}
                        />
                    ))}
                </main>
            </div>
        </div>
    );
};

export default StrategySelectionModal;