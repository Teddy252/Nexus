import React from 'react';
import { Notification } from '../types';
import { X, Bell } from 'lucide-react';

interface NotificationBannerProps {
    notifications: Notification[];
    onDismiss: (id: number) => void;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({ notifications, onDismiss }) => {
    if (notifications.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-6 right-6 z-50 w-full max-w-sm space-y-3">
            {notifications.map(notification => (
                <div
                    key={notification.id}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-4 flex items-start gap-4 animate-fade-in-down"
                    role="alert"
                    aria-live="assertive"
                >
                    <div className="flex-shrink-0 pt-1">
                        <Bell className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div className="flex-grow">
                        <p className="font-bold text-slate-800 dark:text-slate-100">Alerta de Preço Atingido</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{notification.message}</p>
                    </div>
                    <button
                        onClick={() => onDismiss(notification.id)}
                        className="p-1.5 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
                        aria-label="Dispensar notificação"
                        title="Dispensar notificação"
                    >
                        <X className="h-5 w-5"/>
                    </button>
                </div>
            ))}
        </div>
    );
};

export default NotificationBanner;