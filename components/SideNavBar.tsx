import React from 'react';
import { LogOut, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { navItems as originalNavItems } from './navItems';

interface SideNavBarProps {
    activeView: string;
    onNavigate: (view: string) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onLogout: () => void;
}

const NavItem: React.FC<{
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
    isCollapsed: boolean;
}> = ({ icon: Icon, label, isActive, onClick, isCollapsed }) => {
    const activeClasses = 'bg-sky-600 text-white shadow-md shadow-sky-500/20';
    const inactiveClasses = 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50';
    return (
        <button
            onClick={onClick}
            title={isCollapsed ? label : undefined}
            className={`flex items-center w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 ${
                isActive ? activeClasses : inactiveClasses
            } ${isCollapsed ? 'justify-center' : ''}`}
        >
            <Icon className={`h-5 w-5 ${!isCollapsed ? 'mr-3' : ''}`} />
            {!isCollapsed && <span>{label}</span>}
        </button>
    );
};


const SideNavBar: React.FC<SideNavBarProps> = ({ activeView, onNavigate, isCollapsed, onToggleCollapse, onLogout }) => {
    
    return (
        <aside className={`hidden lg:flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 fixed top-4 left-4 h-[calc(100vh-2rem)] rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 p-3 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <div className={`flex items-center gap-3 mb-10 px-2 pt-2 ${isCollapsed ? 'justify-center' : ''}`}>
                 <div className="w-8 h-8 bg-sky-600 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-white text-xl shadow-md shadow-sky-500/40">
                    N
                </div>
                {!isCollapsed && <span className="font-bold text-xl text-slate-800 dark:text-slate-100">Nexus</span>}
            </div>
            
            <nav className="flex-grow space-y-2">
                {originalNavItems.map(item => (
                    <NavItem
                        key={item.key}
                        icon={item.icon}
                        label={item.name}
                        isActive={activeView === item.key}
                        onClick={() => onNavigate(item.key)}
                        isCollapsed={isCollapsed}
                    />
                ))}
            </nav>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-2 space-y-2">
                 <button onClick={onLogout} className={`flex items-center w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors ${isCollapsed ? 'justify-center' : ''}`}>
                    <LogOut className={`h-5 w-5 ${!isCollapsed ? 'mr-3' : ''}`} />
                    {!isCollapsed && 'Sair'}
                </button>
                 <button 
                    onClick={onToggleCollapse}
                    className={`flex items-center w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? "Expandir" : "Recolher"}
                >
                    {isCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5 mr-3" />}
                    {!isCollapsed && 'Recolher'}
                </button>
            </div>
        </aside>
    );
};

export default SideNavBar;