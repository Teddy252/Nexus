import React, { useState, useMemo } from 'react';
import { Notification } from '../types';
import { Bell, Check, Trash2, AlertTriangle, Landmark, MessageSquare, PieChart } from 'lucide-react';

interface NotificacoesViewProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onClearAll: () => void;
    onNotificationClick: (notification: Notification) => void;
}

const getNotificationIcon = (notification: Notification) => {
    if (notification.title === 'Resumo da Carteira') {
        return <PieChart className="h-6 w-6 text-purple-500" />;
    }
    switch (notification.type) {
        case 'price_alert': return <AlertTriangle className="h-6 w-6 text-amber-500" />;
        case 'dividend_payment': return <Landmark className="h-6 w-6 text-emerald-500" />;
        case 'system_message': return <MessageSquare className="h-6 w-6 text-sky-500" />;
        default: return <Bell className="h-6 w-6 text-slate-500" />;
    }
};

const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " anos atrás";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " meses atrás";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " dias atrás";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " horas atrás";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutos atrás";
    return "agora mesmo";
};

const groupNotificationsByDate = (notifications: Notification[]) => {
    const groups: { [key: string]: Notification[] } = {
        'Hoje': [],
        'Ontem': [],
        'Anteriores': []
    };
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach(notification => {
        const notificationDate = new Date(notification.createdAt);
        if (notificationDate.toDateString() === today.toDateString()) {
            groups['Hoje'].push(notification);
        } else if (notificationDate.toDateString() === yesterday.toDateString()) {
            groups['Ontem'].push(notification);
        } else {
            groups['Anteriores'].push(notification);
        }
    });

    return groups;
};


const NotificacoesView: React.FC<NotificacoesViewProps> = ({ notifications, onMarkAsRead, onMarkAllAsRead, onClearAll, onNotificationClick }) => {
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const filteredNotifications = useMemo(() => {
        if (filter === 'unread') {
            return notifications.filter(n => !n.isRead);
        }
        return notifications;
    }, [notifications, filter]);

    const groupedNotifications = useMemo(() => groupNotificationsByDate(filteredNotifications), [filteredNotifications]);

    return (
        <div className="max-w-4xl mx-auto">
            <header className="mb-6 md:mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-2">Notificações</h1>
                    <p className="text-base md:text-lg text-slate-500 dark:text-slate-400">Veja seu histórico de alertas e mensagens.</p>
                </div>
            </header>
            
             <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                <div className="flex items-center gap-2">
                    <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${filter === 'all' ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>Todas</button>
                    <button onClick={() => setFilter('unread')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${filter === 'unread' ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>Não Lidas</button>
                </div>
                 <div className="flex items-center gap-2">
                    <button onClick={onMarkAllAsRead} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 font-semibold"><Check className="h-4 w-4"/> Marcar todas como lidas</button>
                    <div className="h-5 w-px bg-slate-200 dark:bg-slate-600"></div>
                    <button onClick={onClearAll} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 font-semibold"><Trash2 className="h-4 w-4"/> Limpar Todas</button>
                </div>
            </div>

            <div className="space-y-6">
                {filteredNotifications.length > 0 ? (
                    Object.entries(groupedNotifications).map(([groupName, groupNotifications]) => (
                        groupNotifications.length > 0 && (
                            <div key={groupName}>
                                <h2 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 mb-3 px-2">{groupName}</h2>
                                <div className="space-y-3">
                                {groupNotifications.map(notification => (
                                    <div key={notification.id} className={`relative p-4 rounded-xl border transition-all ${!notification.isRead ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent'}`}>
                                        <div className="flex items-start gap-4">
                                            {!notification.isRead && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-sky-500 rounded-full"></div>}
                                            <div className="flex-shrink-0 pt-1">{getNotificationIcon(notification)}</div>
                                            <div className="flex-grow">
                                                <button onClick={() => onNotificationClick(notification)} className="text-left w-full disabled:cursor-default" disabled={notification.title !== 'Resumo da Carteira' && !notification.assetId}>
                                                    <p className="font-bold text-slate-800 dark:text-slate-100">{notification.title}</p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{notification.message}</p>
                                                </button>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{timeSince(notification.createdAt)}</p>
                                            </div>
                                            <div className="flex-shrink-0">
                                                {!notification.isRead && (
                                                    <button onClick={() => onMarkAsRead(notification.id)} title="Marcar como lida" className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-sky-500"></div>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                        )
                    ))
                ) : (
                    <div className="text-center py-20 text-slate-500 dark:text-slate-400">
                        <Bell className="h-16 w-16 mx-auto mb-4" />
                        <p className="font-semibold text-lg">Nenhuma notificação por aqui</p>
                        <p>Seus alertas e mensagens aparecerão aqui quando chegarem.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default NotificacoesView;