import React, { useState } from 'react';
import ProfileChat from './novatos/ProfileChat';
import ModelPortfolio from './novatos/ModelPortfolio';
import PortfolioSimulation from './novatos/PortfolioSimulation';
import { Asset, InvestorProfile } from '../types';
import { Rocket, User, Briefcase, BarChart, Check } from 'lucide-react';

type OnboardingStep = 'welcome' | 'chat' | 'portfolio' | 'simulation';

const OnboardingStepper: React.FC<{ currentStepKey: OnboardingStep }> = ({ currentStepKey }) => {
    const steps = [
        { key: 'chat', label: 'Perfil', icon: User },
        { key: 'portfolio', label: 'Carteira Modelo', icon: Briefcase },
        { key: 'simulation', label: 'Simulação', icon: BarChart },
    ];

    const currentStepIndex = steps.findIndex(s => s.key === currentStepKey);

    return (
        <div className="flex items-center justify-center w-full max-w-2xl mx-auto mb-12">
            {steps.map((step, index) => {
                const isCompleted = currentStepIndex > index;
                const isActive = currentStepIndex === index;
                const Icon = step.icon;

                return (
                    <React.Fragment key={step.key}>
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-4 ${
                                isCompleted ? 'bg-sky-600 border-sky-600 text-white' : 
                                isActive ? 'bg-white dark:bg-slate-800 border-sky-500 text-sky-500' : 
                                'bg-slate-200 dark:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-500'
                            }`}>
                                {isCompleted ? <Check size={24} /> : <Icon size={24} />}
                            </div>
                            <p className={`mt-2 text-sm font-semibold transition-colors ${isActive || isCompleted ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>{step.label}</p>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`flex-1 h-1.5 mx-2 transition-colors duration-500 ${isCompleted ? 'bg-sky-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};


const NovatosView: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
    const [step, setStep] = useState<OnboardingStep>('welcome');
    const [profile, setProfile] = useState<InvestorProfile>(null);
    const [simulatedPortfolio, setSimulatedPortfolio] = useState<Asset[]>([]);

    const handleProfileDetermined = (determinedProfile: InvestorProfile) => {
        setProfile(determinedProfile);
        setStep('portfolio');
    };

    const handleCreateSimulation = (portfolio: Asset[]) => {
        setSimulatedPortfolio(portfolio);
        setStep('simulation');
    };
    
    const handleGraduate = () => {
        setStep('welcome');
        setProfile(null);
        setSimulatedPortfolio([]);
        onNavigate('carteira');
    };

    const renderWelcome = () => (
        <div className="text-center max-w-3xl mx-auto p-4">
            <Rocket className="h-20 w-20 mx-auto text-sky-500 mb-6 animate-bounce" />
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-4">Bem-vindo(a) à sua Jornada de Investidor!</h1>
            <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 mb-8">
                Vamos descobrir juntos o seu caminho no mundo dos investimentos, sem riscos e com a ajuda da nossa IA.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-10">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <User className="h-8 w-8 text-sky-500 mb-3" />
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">1. Descubra seu Perfil</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Converse com nossa IA para entender seu perfil de investidor.</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <Briefcase className="h-8 w-8 text-sky-500 mb-3" />
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">2. Receba uma Carteira</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Receba uma carteira modelo, personalizada para seus objetivos.</p>
                </div>
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <BarChart className="h-8 w-8 text-sky-500 mb-3" />
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">3. Simule sem Riscos</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Veja como sua carteira se comportaria no mercado real.</p>
                </div>
            </div>
            <button
                onClick={() => setStep('chat')}
                className="bg-sky-600 text-white font-semibold py-3 px-8 rounded-lg text-lg hover:bg-sky-500 transition-transform transform hover:scale-105 shadow-lg hover:shadow-sky-500/30"
            >
                Começar Jornada
            </button>
        </div>
    );

    const renderStep = () => {
        switch (step) {
            case 'chat':
                return <ProfileChat onProfileDetermined={handleProfileDetermined} />;
            case 'portfolio':
                return <ModelPortfolio profile={profile} onCreateSimulation={handleCreateSimulation} />;
            case 'simulation':
                return <PortfolioSimulation portfolio={simulatedPortfolio} onGraduate={handleGraduate} />;
            case 'welcome':
            default:
                return renderWelcome();
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
             {step !== 'welcome' && <OnboardingStepper currentStepKey={step} />}
             <div key={step} className="animate-fade-in">
                {renderStep()}
             </div>
        </div>
    );
};

export default NovatosView;