import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
    unreadCount: number;
    onClick: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ unreadCount, onClick }) => {
    return (
        <button
            onClick={onClick}
            title="Notificações"
            className="relative p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-sky-500 dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
        >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
                <div className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white dark:border-slate-800">
                    {unreadCount}
                </div>
            )}
        </button>
    );
};

export default NotificationBell;
