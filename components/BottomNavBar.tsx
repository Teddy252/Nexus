import React from 'react';
import { LayoutDashboard, Wallet, Newspaper, User, Landmark } from 'lucide-react';

interface BottomNavBarProps {
    activeView: string;
    onNavigate: (view: string) => void;
}

// A curated list for mobile navigation
const bottomNavItems = [
    { name: 'Dashboard', icon: LayoutDashboard, key: 'dashboard' },
    { name: 'Carteira', icon: Wallet, key: 'carteira' },
    { name: 'Proventos', icon: Landmark, key: 'proventos' },
    { name: 'Notícias', icon: Newspaper, key: 'noticias' },
    { name: 'Conta', icon: User, key: 'conta' },
];

const NavItem: React.FC<{
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => {
    const activeClasses = 'text-sky-600 dark:text-sky-400';
    const inactiveClasses = 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200';
    
    return (
        <button
            onClick={onClick}
            aria-label={label}
            className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}
        >
            <Icon className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">{label}</span>
        </button>
    );
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, onNavigate }) => {
    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-700 z-40">
            <nav className="flex items-center justify-around h-full max-w-7xl mx-auto px-2">
                {bottomNavItems.map(item => (
                    <NavItem
                        key={item.key}
                        icon={item.icon}
                        label={item.name}
                        isActive={activeView === item.key}
                        onClick={() => onNavigate(item.key)}
                    />
                ))}
            </nav>
        </div>
    );
};

export default BottomNavBar;