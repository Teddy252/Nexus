import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { Sun, Moon, Monitor, PiggyBank, Landmark, Bell, Globe2, Fingerprint, CircleDollarSign, Palette, ChevronRight, User, ShieldCheck, X, Loader2, AlertTriangle, Mail } from 'lucide-react';
import ProfileModal from './ProfileModal';
import EmailUpdateModal from './EmailUpdateModal';

// Internal component for Security Modal
const SecurityModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { updateUserPassword } = useContext(AuthContext);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }
        if (newPassword.length < 6) {
            setError("A senha deve ter no mínimo 6 caracteres.");
            return;
        }
        
        setIsSaving(true);
        try {
            const { error } = await updateUserPassword(newPassword);
            if (error) throw error;
            setSuccess('Senha alterada com sucesso!');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
             setError(err.message || 'Falha ao alterar a senha.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950 bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 rounded-2xl shadow-2xl">
                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Segurança</h2>
                    <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-700 rounded-full">
                        <X className="h-5 w-5" />
                    </button>
                </header>
                
                {error && <div className="bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm flex items-center gap-3 mb-4"><AlertTriangle className="h-5 w-5" />{error}</div>}
                {success && <div className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 p-3 rounded-lg text-sm mb-4">{success}</div>}

                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nova Senha</label>
                        <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="block w-full bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-md py-2 px-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition" required />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Confirmar Nova Senha</label>
                        <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="block w-full bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-md py-2 px-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition" required />
                    </div>
                    <div className="mt-8 pt-4 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="py-2 px-5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 rounded-lg font-semibold text-slate-800 dark:text-slate-200 transition-colors">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="py-2 px-5 w-36 flex justify-center bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold text-white transition-colors disabled:bg-sky-400 dark:disabled:bg-sky-800">
                            {isSaving ? <Loader2 className="animate-spin" /> : 'Alterar Senha'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const SettingsRow: React.FC<{
    icon: React.ElementType;
    title: string;
    subtitle?: string;
    onClick?: () => void;
    children?: React.ReactNode;
}> = ({ icon: Icon, title, subtitle, onClick, children }) => {
    const Component = onClick ? 'button' : 'div';
    return (
        <Component
            onClick={onClick}
            className="w-full text-left flex items-center p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
            disabled={!onClick}
        >
            <Icon className="h-6 w-6 text-slate-500 dark:text-slate-400 mr-4 flex-shrink-0" />
            <div className="flex-grow">
                <p className="font-semibold text-slate-800 dark:text-slate-100">{title}</p>
                {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">{children}</div>
        </Component>
    );
};

const InfoRow: React.FC<{ title: string, value: string }> = ({ title, value }) => (
    <div className="flex justify-between items-center p-4">
        <p className="font-medium text-slate-600 dark:text-slate-300">{title}</p>
        <p className="text-slate-500 dark:text-slate-400">{value}</p>
    </div>
);

const AccountView: React.FC = () => {
    const { theme, setTheme } = useContext(ThemeContext);
    const { selectedCurrency, setCurrency } = useCurrency();
    const { currentUser } = useContext(AuthContext);
    const { locale, setLocale } = useLanguage();

    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    const [isSecurityModalOpen, setSecurityModalOpen] = useState(false);
    const [isEmailModalOpen, setEmailModalOpen] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(true);

    const currencyMap = { BRL: 'Real (BRL)', USD: 'US Dollar (USD)', EUR: 'Euro (EUR)' };
    const themeMap: { [key: string]: string } = { light: 'Claro', dark: 'Escuro', system: 'Sistema' };
    const languageMap: { [key: string]: string } = {
        'pt-BR': 'Português (Brasil)',
        'en-US': 'English (US)',
        'es-ES': 'Español (España)',
        'fr-FR': 'Français (France)',
        'de-DE': 'Deutsch (Deutschland)',
        'it-IT': 'Italiano (Italia)',
        'ja-JP': '日本語 (日本)',
        'ko-KR': '한국어 (대한민국)',
        'zh-CN': '中文 (简体)',
    };
    
    return (
        <div className="max-w-3xl mx-auto pb-10">
            <header className="mb-6 md:mb-8">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Configurações</h1>
            </header>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
                <SettingsRow icon={User} title="Perfil" subtitle="Gerencie seu nome, avatar e informações pessoais" onClick={() => setProfileModalOpen(true)}>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                </SettingsRow>
                <SettingsRow icon={Mail} title="E-mail" subtitle={currentUser?.email} onClick={() => setEmailModalOpen(true)}>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                </SettingsRow>
                <SettingsRow icon={ShieldCheck} title="Segurança" subtitle="Gerencie sua senha" onClick={() => setSecurityModalOpen(true)}>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                </SettingsRow>
                <SettingsRow icon={PiggyBank} title="Configurações de Poupança" subtitle="Pagamento de juros na mesma moeda">
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                </SettingsRow>
                <SettingsRow icon={Landmark} title="Configurações de Linha de Crédito" subtitle="Gerencie seu empréstimo">
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                </SettingsRow>
                <SettingsRow icon={Bell} title="Notificações" subtitle="Gerencie suas preferências de notificação">
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                </SettingsRow>
                <SettingsRow icon={Globe2} title="Idioma">
                    <select
                        value={locale}
                        onChange={(e) => setLocale(e.target.value as any)}
                        className="font-medium bg-transparent text-slate-600 dark:text-slate-300 text-right focus:outline-none cursor-pointer pr-8 -mr-2"
                        style={{ WebkitAppearance: 'none', appearance: 'none', MozAppearance: 'none' }}
                    >
                        {Object.entries(languageMap).map(([key, value]) => (
                            <option key={key} value={key}>{value}</option>
                        ))}
                    </select>
                    <ChevronRight className="h-5 w-5 text-slate-400 pointer-events-none -ml-6" />
                </SettingsRow>
                <SettingsRow icon={Fingerprint} title="Autenticação biométrica" subtitle="Use biometria para entrar na sua conta">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={biometricEnabled} onChange={() => setBiometricEnabled(!biometricEnabled)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                </SettingsRow>
                <SettingsRow icon={CircleDollarSign} title="Moeda de exibição">
                    <select
                        value={selectedCurrency}
                        onChange={(e) => setCurrency(e.target.value as 'BRL' | 'USD' | 'EUR')}
                        className="font-medium bg-transparent text-slate-600 dark:text-slate-300 text-right focus:outline-none cursor-pointer pr-8 -mr-2"
                        style={{ WebkitAppearance: 'none', appearance: 'none', MozAppearance: 'none' }}
                    >
                        {Object.entries(currencyMap).map(([key, value]) => (
                            <option key={key} value={key}>{value}</option>
                        ))}
                    </select>
                    <ChevronRight className="h-5 w-5 text-slate-400 pointer-events-none -ml-6" />
                </SettingsRow>
                <SettingsRow icon={Palette} title="Aparência">
                     <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                        className="font-medium bg-transparent text-slate-600 dark:text-slate-300 text-right focus:outline-none cursor-pointer pr-8 -mr-2"
                         style={{ WebkitAppearance: 'none', appearance: 'none', MozAppearance: 'none' }}
                    >
                         {Object.entries(themeMap).map(([key, value]) => (
                            <option key={key} value={key}>{value}</option>
                        ))}
                    </select>
                    <ChevronRight className="h-5 w-5 text-slate-400 pointer-events-none -ml-6" />
                </SettingsRow>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700 mt-8">
                <InfoRow title="Versão do App" value="5.25.0" />
                <InfoRow title="Número da Build" value="250909001" />
            </div>

            <ProfileModal isOpen={isProfileModalOpen} onClose={() => setProfileModalOpen(false)} />
            <SecurityModal isOpen={isSecurityModalOpen} onClose={() => setSecurityModalOpen(false)} />
            <EmailUpdateModal isOpen={isEmailModalOpen} onClose={() => setEmailModalOpen(false)} />
        </div>
    );
};
export default AccountView;