import React from 'react';
import { Notification } from '../types';
import { Bell, Check, AlertTriangle, Landmark, MessageSquare, PieChart } from 'lucide-react';

interface NotificationsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onNavigateToNotifications: () => void;
    onNotificationClick: (notification: Notification) => void;
}

const getNotificationIcon = (notification: Notification) => {
    if (notification.title === 'Resumo da Carteira') {
        return <PieChart className="h-5 w-5 text-purple-500" />;
    }
    switch (notification.type) {
        case 'price_alert': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
        case 'dividend_payment': return <Landmark className="h-5 w-5 text-emerald-500" />;
        case 'system_message': return <MessageSquare className="h-5 w-5 text-sky-500" />;
        default: return <Bell className="h-5 w-5 text-slate-500" />;
    }
};

const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "a";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "min";
    return "agora";
};


const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
    isOpen, onClose, notifications, onMarkAsRead, onMarkAllAsRead, onNavigateToNotifications, onNotificationClick
}) => {
    if (!isOpen) return null;
    
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden animate-fade-in-down origin-top-right flex flex-col"
        >
            <header className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Notificações</h3>
                {unreadCount > 0 && (
                    <button onClick={onMarkAllAsRead} className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                        Marcar todas como lidas
                    </button>
                )}
            </header>

            <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                    notifications.map(notification => (
                        <button
                            key={notification.id}
                            onClick={() => {
                                onNotificationClick(notification);
                                onClose();
                            }}
                            className="w-full text-left flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors relative"
                            disabled={notification.title !== 'Resumo da Carteira' && !notification.assetId}
                        >
                            {!notification.isRead && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-sky-500 rounded-full"></div>}
                            <div className="flex-shrink-0 pt-1">{getNotificationIcon(notification)}</div>
                            <div className="flex-grow">
                                <p className={`font-semibold text-sm ${notification.isRead ? 'text-slate-600 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>{notification.title}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{notification.message}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{timeSince(notification.createdAt)}</p>
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        <Bell className="h-10 w-10 mx-auto mb-2" />
                        <p>Nenhuma notificação nova.</p>
                    </div>
                )}
            </div>

            <footer className="p-2 border-t border-slate-200 dark:border-slate-700">
                <button onClick={onNavigateToNotifications} className="w-full text-center text-sm font-semibold text-sky-600 dark:text-sky-400 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    Ver todas as notificações
                </button>
            </footer>
        </div>
    );
};

export default NotificationsPanel;