import React, { useContext } from 'react';
import { User as UserIcon } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

interface MobileHeaderProps {
    title: string;
    onNavigate: (view: string) => void;
    unreadCount: number;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ title, onNavigate, unreadCount }) => {
    const { userProfile } = useContext(AuthContext);
    
    const getInitials = () => {
        const first = userProfile?.first_name?.[0] || '';
        const last = userProfile?.last_name?.[0] || '';
        return `${first}${last}`.toUpperCase() || 'U';
    }
    
    return (
        <header className="flex md:hidden items-center justify-between p-4 h-16 fixed top-0 left-0 right-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md z-30 border-b border-slate-200 dark:border-slate-800">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 capitalize">{title}</h1>
            <div className="flex items-center gap-4">
                <NotificationBell
                    unreadCount={unreadCount}
                    onClick={() => onNavigate('notificacoes')}
                />
                <button 
                    onClick={() => onNavigate('conta')} 
                    className="focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-900 rounded-full"
                    aria-label="Acessar minha conta"
                >
                    {userProfile?.avatar_url ? (
                        <img src={userProfile.avatar_url} alt="User Avatar" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{getInitials()}</span>
                        </div>
                    )}
                </button>
            </div>
        </header>
    );
};

export default MobileHeader;
