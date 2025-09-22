import React, { useEffect, useState } from 'react';
import { Notification } from '../types';
import { X, AlertTriangle, Landmark, MessageSquare, PieChart, Bell } from 'lucide-react';

interface NotificationBannerProps {
    notification: Notification;
    onClose: () => void;
    onClick: () => void;
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

const NotificationBanner: React.FC<NotificationBannerProps> = ({ notification, onClose, onClick }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 500); // Wait for animation to finish
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, 5000); // Auto-dismiss after 5 seconds

        return () => clearTimeout(timer);
    }, [notification]);

    const animationClass = isExiting ? 'animate-slide-out-up-fade' : 'animate-slide-in-down-fade';

    return (
        <div className={`fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-[100] ${animationClass}`}>
            <div className="w-full max-w-sm sm:max-w-md mx-auto">
                 <div
                    onClick={onClick}
                    className="flex items-start gap-4 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl cursor-pointer"
                >
                    <div className="flex-shrink-0 pt-1">{getNotificationIcon(notification)}</div>
                    <div className="flex-grow">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{notification.title}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{notification.message}</p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClose();
                        }}
                        className="p-1.5 -mr-2 -mt-2 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
                        aria-label="Dispensar notificação"
                    >
                        <X className="h-4 w-4"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationBanner;