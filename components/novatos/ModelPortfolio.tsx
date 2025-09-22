import React from 'react';
import { InvestorProfile, Asset } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { ShieldCheck, Scale, TrendingUp, HelpCircle, Briefcase, Landmark, Hexagon, Download } from 'lucide-react';
import { generateModelPortfolioPdf } from '../../services/pdfService';
import { generateModelPortfolioXlsx, generateModelPortfolioCsv } from '../../services/exportService';

interface ModelPortfolioProps {
    profile: InvestorProfile;
    onCreateSimulation: (portfolio: Asset[]) => void;
}

const CHART_COLORS = ['#0f172a', '#1d4ed8', '#0ea5e9', '#06b6d4', '#14b8a6'];

const profileConfig = {
    Conservador: {
        title: 'Perfil Conservador',
        description: 'Seu foco é em segurança e preservação de capital. A carteira prioriza ativos de baixa volatilidade.',
        icon: ShieldCheck,
        allocation: [
            { name: 'Renda Fixa', value: 70, description: "O alicerce da sua carteira. É o tipo de investimento mais seguro do Brasil, ideal para proteger seu dinheiro e ter rendimentos previsíveis.", example: 'Tesouro Selic', icon: Landmark },
            { name: 'Fundos Imobiliários', value: 20, description: "Permite que você receba 'aluguéis' mensais de grandes imóveis, como shoppings e prédios comerciais, sem precisar comprá-los.", example: 'IFIX (Índice)', icon: Briefcase },
            { name: 'Ações Brasil', value: 10, description: "Uma pequena parte para buscar maiores retornos, investindo em grandes empresas brasileiras. Pense nisso como se tornar sócio de negócios consolidados.", example: 'BOVA11', icon: TrendingUp },
        ]
    },
    Moderado: {
        title: 'Perfil Moderado',
        description: 'Você busca um equilíbrio entre segurança e crescimento, com uma boa diversificação para otimizar os retornos.',
        icon: Scale,
        allocation: [
            { name: 'Renda Fixa', value: 40, description: "Uma base sólida para sua carteira, garantindo segurança e liquidez para seus objetivos de médio prazo.", example: 'Tesouro Selic', icon: Landmark },
            { name: 'Fundos Imobiliários', value: 25, description: "Uma excelente forma de gerar renda passiva mensal e investir no setor imobiliário de forma diversificada.", example: 'IFIX (Índice)', icon: Briefcase },
            { name: 'Ações Brasil', value: 25, description: "O motor de crescimento da sua carteira, investindo nas maiores e mais importantes empresas do país.", example: 'BOVA11', icon: TrendingUp },
            { name: 'Ações EUA', value: 10, description: "Exposição às maiores empresas de tecnologia e inovação do mundo, dolarizando parte do seu patrimônio.", example: 'IVVB11', icon: TrendingUp },
        ]
    },
    Agressivo: {
        title: 'Perfil Agressivo',
        description: 'Seu objetivo é maximizar o potencial de crescimento, aceitando uma maior volatilidade para buscar retornos mais altos.',
        icon: TrendingUp,
        allocation: [
            { name: 'Ações Brasil', value: 30, description: "A maior parte da sua carteira, focada em empresas com alto potencial de crescimento no mercado nacional.", example: 'BOVA11', icon: TrendingUp },
            { name: 'Ações EUA', value: 20, description: "Investimento direto nas gigantes da tecnologia e em setores inovadores, buscando retornos expressivos em dólar.", example: 'IVVB11', icon: TrendingUp },
            { name: 'Fundos Imobiliários', value: 20, description: "Para gerar fluxo de caixa e diversificar, investindo em diferentes segmentos do mercado imobiliário.", example: 'IFIX (Índice)', icon: Briefcase },
            { name: 'Renda Fixa', value: 20, description: "Sua reserva de segurança e oportunidade, para aproveitar momentos de baixa do mercado ou para objetivos de curto prazo.", example: 'Tesouro Selic', icon: Landmark },
            { name: 'Criptomoedas', value: 10, description: "Uma pequena parte alocada em ativos digitais com alto potencial de valorização, mas também alto risco.", example: 'Bitcoin', icon: Hexagon },
        ]
    }
};

const generateAssetsForProfile = (profile: InvestorProfile): Asset[] => {
    if (!profile) return [];

    const config = profileConfig[profile];
    let idCounter = 1;
    const totalValue = 10000; // Simulate a R$ 10.000,00 portfolio

    return config.allocation.map(item => {
        const value = totalValue * (item.value / 100);
        return {
            id: idCounter++,
            ticker: item.example,
            nome: item.name,
            categoria: item.name,
            quantidade: 1, // Simplified for simulation
            precoCompra: value,
            cotacaoBase: value,
            cotacaoAtual: value,
            corretora: 'Simulação',
            pais: item.name.includes('EUA') ? 'EUA' : (item.name.includes('Cripto') ? 'Global' : 'Brasil'),
            riskProfile: profile === 'Conservador' ? 'Seguro' : profile === 'Moderado' ? 'Moderado' : 'Arriscado',
            historicoPreco: Array(7).fill(value),
            dividendYield: 0,
            moedaCompra: 'BRL',
            order_index: idCounter,
        };
    });
};


const ModelPortfolio: React.FC<ModelPortfolioProps> = ({ profile, onCreateSimulation }) => {
    if (!profile) {
        return <div>Carregando perfil...</div>;
    }

    const config = profileConfig[profile];
    const { icon: Icon } = config;

    const handleCreateClick = () => {
        const simulatedAssets = generateAssetsForProfile(profile);
        onCreateSimulation(simulatedAssets);
    };

    const handleDownload = (format: 'pdf' | 'xlsx' | 'csv') => {
        if (!profile) return;
        const assets = generateAssetsForProfile(profile);
        switch (format) {
            case 'pdf':
                generateModelPortfolioPdf(assets, profile);
                break;
            case 'xlsx':
                generateModelPortfolioXlsx(assets, profile);
                break;
            case 'csv':
                generateModelPortfolioCsv(assets, profile);
                break;
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <header className="text-center mb-8">
                <Icon className="h-16 w-16 mx-auto text-sky-500 mb-4" />
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{config.title}</h1>
                <p className="text-md text-slate-500 dark:text-slate-400 mt-2">{config.description}</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Alocação Sugerida</h2>
                    <div className="h-72">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={config.allocation} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius={90}
                                    innerRadius={50}
                                    paddingAngle={3}
                                >
                                    {config.allocation.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />)}
                                </Pie>
                                <Legend verticalAlign="bottom" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="space-y-4">
                    {config.allocation.map((item, index) => {
                         const { icon: ItemIcon } = item;
                        return (
                        <div key={item.name} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 flex gap-4 items-start">
                             <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-700" style={{ color: CHART_COLORS[index % CHART_COLORS.length] }}>
                                <ItemIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-200">{item.name} ({item.value}%)</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{item.description}</p>
                            </div>
                        </div>
                    )})}
                </div>
            </div>
            
            <div className="mt-10 text-center">
                 <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
                    <HelpCircle className="h-4 w-4" />
                    <p>Lembre-se: esta é uma sugestão educativa, não uma recomendação de compra.</p>
                </div>
                <button
                    onClick={handleCreateClick}
                    className="bg-sky-600 text-white font-semibold py-3 px-8 rounded-lg text-lg hover:bg-sky-500 transition-transform transform hover:scale-105 shadow-lg hover:shadow-sky-500/30"
                >
                    Criar meu Portfólio Simulado
                </button>
            </div>

            <div className="mt-12 pt-8 border-t border-dashed border-slate-300 dark:border-slate-700">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 text-center mb-4">Seu Relatório Inicial</h3>
                <p className="text-center text-slate-500 dark:text-slate-400 mb-6">Guarde uma cópia da sua estratégia modelo. É um ótimo ponto de partida para seus estudos!</p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <button onClick={() => handleDownload('pdf')} className="flex items-center justify-center w-full sm:w-auto font-semibold bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 py-2 px-5 rounded-lg transition-colors">
                        <Download className="h-5 w-5 mr-2" /> Baixar PDF
                    </button>
                    <button onClick={() => handleDownload('xlsx')} className="flex items-center justify-center w-full sm:w-auto font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-900 py-2 px-5 rounded-lg transition-colors">
                        <Download className="h-5 w-5 mr-2" /> Baixar XLSX
                    </button>
                    <button onClick={() => handleDownload('csv')} className="flex items-center justify-center w-full sm:w-auto font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 py-2 px-5 rounded-lg transition-colors">
                        <Download className="h-5 w-5 mr-2" /> Baixar CSV
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModelPortfolio;