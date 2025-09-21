import { LayoutDashboard, Wallet, FileText, Calculator, BrainCircuit, User, Newspaper, Landmark, PieChart } from 'lucide-react';

export const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, key: 'dashboard' },
    { name: 'Carteira', icon: Wallet, key: 'carteira' },
    { name: 'Proventos', icon: Landmark, key: 'proventos' },
    { name: 'Análise', icon: PieChart, key: 'analise' },
    { name: 'Notícias', icon: Newspaper, key: 'noticias' },
    { name: 'Declaração', icon: FileText, key: 'declaracao' },
    { name: 'IR Mensal', icon: Calculator, key: 'ir_mensal' },
    { name: 'IA', icon: BrainCircuit, key: 'ia' },
    { name: 'Conta', icon: User, key: 'conta' },
];