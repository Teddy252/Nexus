import React, { useContext, useState, useRef, useEffect } from 'react';
import { Search, User as UserIcon, ChevronDown, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import QuickActions from './QuickActions';
import SearchModal from './SearchModal';
import { Asset } from '../types';

interface HeaderProps {
    portfolioData: Asset[];
    onAddAsset: () => void;
    onAiAnalysis: () => void;
    onExportPdf: () => void;
    isExportingPdf: boolean;
    onOptimizePortfolio: () => void;
    onImportPortfolio: () => void;
    onLogout: () => void;
    onNavigate: (view: string) => void;
    onSelectAsset: (ticker: string) => void;
}


const Header: React.FC<HeaderProps> = ({ portfolioData, onLogout, onNavigate, onSelectAsset, ...props }) => {
    const { userProfile } = useContext(AuthContext);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const getInitials = () => {
        const first = userProfile?.first_name?.[0] || '';
        const last = userProfile?.last_name?.[0] || '';
        return `${first}${last}`.toUpperCase() || 'U';
    }

    // Focus first item on open
    useEffect(() => {
        if (isDropdownOpen) {
             setTimeout(() => {
                const firstItem = dropdownRef.current?.querySelector('button[role="menuitem"]') as HTMLElement;
                firstItem?.focus();
            }, 0);
        }
    }, [isDropdownOpen]);

    // Handle outside clicks and keyboard navigation
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isDropdownOpen) return;

            const menu = dropdownRef.current;
            if (!menu) return;

            if (event.key === 'Escape' || event.key === 'Tab') {
                setIsDropdownOpen(false);
                const triggerButton = menu.querySelector('button[aria-haspopup="true"]') as HTMLElement;
                triggerButton?.focus();
                return;
            }

            const items = Array.from(menu.querySelectorAll('button[role="menuitem"]')) as HTMLElement[];
            if (items.length === 0) return;

            if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
                event.preventDefault();
                const activeElement = document.activeElement;
                const currentIndex = items.indexOf(activeElement as HTMLElement);

                let nextIndex;
                if (event.key === 'ArrowDown') {
                    nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % items.length;
                } else { // ArrowUp
                    nextIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
                }
                items[nextIndex]?.focus();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isDropdownOpen]);

    const displayName = userProfile?.first_name ? `${userProfile.first_name} ${userProfile.last_name}` : 'Usuário';
    const avatarUrl = userProfile?.avatar_url;

    return (
        <>
            <header className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 self-start md:self-center">
                    Visão Geral
                </h1>
                <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-2 md:gap-4">
                    <div className="relative flex-grow w-full sm:w-auto">
                        <button
                            onClick={() => setIsSearchModalOpen(true)}
                            className="w-full text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-3 text-sm text-slate-500 dark:text-slate-400 hover:border-sky-500 dark:hover:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-colors"
                        >
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            Símbolo, ex. AAPL
                        </button>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                        <QuickActions {...props} />
                        <div className="relative" ref={dropdownRef}>
                            <button
                                id="user-menu-button"
                                aria-haspopup="true"
                                aria-expanded={isDropdownOpen}
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-200"
                            >
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="User Avatar" className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                        <span className="text-lg font-bold text-slate-500 dark:text-slate-400">{getInitials()}</span>
                                    </div>
                                )}
                                <div className="hidden lg:flex items-center gap-1 pr-2">
                                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{displayName}</span>
                                    <ChevronDown size={16} className={`text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </div>
                            </button>
                            {isDropdownOpen && (
                                <div
                                    role="menu"
                                    aria-orientation="vertical"
                                    aria-labelledby="user-menu-button"
                                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden animate-fade-in-down origin-top-right"
                                >
                                    <button
                                        role="menuitem"
                                        tabIndex={-1}
                                        onClick={() => { onNavigate('conta'); setIsDropdownOpen(false); }}
                                        className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700 transition-colors"
                                    >
                                        <UserIcon size={16} /> Minha Conta
                                    </button>
                                    <button
                                        role="menuitem"
                                        tabIndex={-1}
                                        onClick={onLogout}
                                        className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 focus:outline-none focus:bg-red-50 dark:focus:bg-red-500/10 transition-colors"
                                    >
                                        <LogOut size={16} /> Sair
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <SearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                portfolioData={portfolioData}
                onSelectAsset={onSelectAsset}
            />
        </>
    );
};

export default Header;