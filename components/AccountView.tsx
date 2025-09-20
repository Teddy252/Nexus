import React, { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { Asset } from '../types';
import { Loader2, Camera, Shield, Trash2, LogOut, AlertTriangle, User, Palette, Download, Sun, Moon, Monitor } from 'lucide-react';

interface AccountViewProps {
    portfolioData: Asset[];
}

const SectionCard: React.FC<{ title: string, children: React.ReactNode, footer?: React.ReactNode }> = ({ title, children, footer }) => (
    <div className="bg-white dark:bg-slate-800 shadow-md shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl">
        <div className="p-6">
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-6">{title}</h2>
            {children}
        </div>
        {footer && (
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 rounded-b-xl flex justify-end">
                {footer}
            </div>
        )}
    </div>
);

const AccountView: React.FC<AccountViewProps> = ({ portfolioData }) => {
    const { currentUser, userProfile, updateUserProfile, uploadAvatar, logout, updateUserPassword } = useContext(AuthContext);
    const { theme, setTheme } = useContext(ThemeContext);

    const [activeTab, setActiveTab] = useState('perfil');

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    useEffect(() => {
        if(userProfile) {
            setFirstName(userProfile.first_name || '');
            setLastName(userProfile.last_name || '');
        }
    }, [userProfile]);
    
    const clearMessages = () => {
        setError('');
        setSuccess('');
    }

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        clearMessages();
        setIsSavingProfile(true);
        try {
            await updateUserProfile({ first_name: firstName, last_name: lastName });
            setSuccess('Perfil atualizado com sucesso!');
        } catch (err: any) {
            setError(err.message || 'Falha ao atualizar o perfil.');
        } finally {
            setIsSavingProfile(false);
        }
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        clearMessages();
        setIsUploading(true);
        try {
            await uploadAvatar(file);
            setSuccess('Foto de perfil atualizada!');
        } catch (err: any) {
             setError(err.message || 'Falha ao enviar a foto.');
        } finally {
            setIsUploading(false);
        }
    };
    
    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        clearMessages();
        if (newPassword !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }
        if (newPassword.length < 6) {
            setError("A senha deve ter no mínimo 6 caracteres.");
            return;
        }
        
        setIsSavingPassword(true);
        try {
            const { error } = await updateUserPassword(newPassword);
            if (error) throw error;
            setSuccess('Senha alterada com sucesso!');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
             setError(err.message || 'Falha ao alterar a senha.');
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleDeleteAccount = () => {
        if (window.confirm("ATENÇÃO: Esta ação é irreversível e todos os seus dados serão perdidos. Deseja realmente excluir sua conta?")) {
            alert("Funcionalidade de exclusão de conta a ser implementada.");
        }
    };
    
    const handleExportData = () => {
        clearMessages();
        try {
            const dataToExport = {
                profile: userProfile,
                portfolio: portfolioData,
            };
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(dataToExport, null, 2)
            )}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = "nexus_user_data.json";
            link.click();
            setSuccess("Seus dados foram exportados.");
        } catch (err) {
            setError("Ocorreu um erro ao exportar seus dados.");
        }
    }

    const getInitials = () => {
        const first = userProfile?.first_name?.[0] || '';
        const last = userProfile?.last_name?.[0] || '';
        return `${first}${last}`.toUpperCase();
    }

    const TABS = [
        { key: 'perfil', label: 'Perfil', icon: User },
        { key: 'seguranca', label: 'Segurança', icon: Shield },
        { key: 'preferencias', label: 'Preferências', icon: Palette },
    ];
    
    const TabButton: React.FC<{ tabKey: string; label: string; icon: React.ElementType }> = ({ tabKey, label, icon: Icon }) => {
        const isActive = activeTab === tabKey;
        return (
             <button
                onClick={() => { setActiveTab(tabKey); clearMessages(); }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 w-full text-left ${
                    isActive
                        ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
            >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
            </button>
        );
    }
    
    const ThemeButton: React.FC<{
        onClick: () => void;
        label: string;
        icon: React.ElementType;
        isActive: boolean;
    }> = ({ onClick, label, icon: Icon, isActive }) => (
        <button onClick={onClick} className={`p-4 rounded-lg border-2 text-center transition-all ${isActive ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/10' : 'border-slate-300 dark:border-slate-600 hover:border-sky-400 dark:hover:border-slate-500'}`}>
            <Icon className={`h-8 w-8 mx-auto mb-2 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className={`font-semibold ${isActive ? 'text-sky-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-300'}`}>{label}</span>
        </button>
    );

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-8">
                <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-2">Configurações da Conta</h1>
                <p className="text-lg text-slate-500 dark:text-slate-400">Gerencie suas informações pessoais, segurança e preferências do aplicativo.</p>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <aside className="lg:col-span-1">
                     <nav className="space-y-2 sticky top-8">
                        {TABS.map(tab => <TabButton key={tab.key} tabKey={tab.key} label={tab.label} icon={tab.icon} />)}
                    </nav>
                </aside>
                
                <main className="lg:col-span-3 space-y-8">
                    {error && <div className="bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-300 p-4 rounded-xl text-sm flex items-center gap-3"><AlertTriangle className="h-5 w-5" />{error}</div>}
                    {success && <div className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 p-4 rounded-xl text-sm">{success}</div>}

                    {activeTab === 'perfil' && (
                        <SectionCard 
                            title="Informações Pessoais"
                            footer={
                                <button type="submit" form="profile-form" disabled={isSavingProfile} className="py-2 px-5 w-36 flex justify-center bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold text-white transition-colors disabled:bg-sky-400 disabled:cursor-not-allowed">
                                    {isSavingProfile ? <Loader2 className="animate-spin" /> : 'Salvar Perfil'}
                                </button>
                            }
                        >
                            <div className="flex items-center gap-6 mb-8">
                                <div className="relative group">
                                    <label htmlFor="avatar-upload" className="relative w-24 h-24 rounded-full cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-sky-500 dark:focus-within:ring-offset-slate-800 block">
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center z-10">
                                                <Loader2 className="h-8 w-8 text-white animate-spin" />
                                            </div>
                                        )}
                                        {userProfile?.avatar_url ? (
                                            <img src={userProfile.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                                <span className="text-3xl font-bold text-slate-500 dark:text-slate-400">{getInitials()}</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="h-8 w-8" />
                                        </div>
                                    </label>
                                    <input type="file" id="avatar-upload" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" className="hidden" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{userProfile?.first_name} {userProfile?.last_name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{currentUser?.email}</p>
                                </div>
                            </div>
                            <form id="profile-form" onSubmit={handleProfileUpdate}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nome</label>
                                        <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="block w-full bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-md py-2 px-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition" required />
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Sobrenome</label>
                                        <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="block w-full bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-md py-2 px-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition" required />
                                    </div>
                                </div>
                            </form>
                        </SectionCard>
                    )}

                    {activeTab === 'seguranca' && (
                        <>
                            <SectionCard 
                                title="Alterar Senha"
                                footer={
                                    <button type="submit" form="password-form" disabled={isSavingPassword} className="py-2 px-5 w-40 flex justify-center bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold text-white transition-colors disabled:bg-sky-400 disabled:cursor-not-allowed">
                                        {isSavingPassword ? <Loader2 className="animate-spin" /> : 'Alterar Senha'}
                                    </button>
                                }
                            >
                                <form id="password-form" onSubmit={handlePasswordUpdate}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="newPassword" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nova Senha</label>
                                            <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="block w-full bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-md py-2 px-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition" required />
                                        </div>
                                        <div>
                                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Confirmar Nova Senha</label>
                                            <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="block w-full bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-md py-2 px-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition" required />
                                        </div>
                                    </div>
                                </form>
                            </SectionCard>
                            <div className="border border-red-500/30 p-6 rounded-xl">
                                <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center"><AlertTriangle className="mr-2" /> Zona de Perigo</h2>
                                <div className="space-y-4">
                                    <button onClick={logout} className="w-full sm:w-auto flex items-center justify-center gap-2 py-2 px-5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-300 transition-colors">
                                        <LogOut className="h-5 w-5" />
                                        <span>Sair da conta</span>
                                    </button>
                                    <button onClick={handleDeleteAccount} className="w-full sm:w-auto flex items-center justify-center gap-2 py-2 px-5 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-white transition-colors">
                                        <Trash2 className="h-5 w-5" />
                                        <span>Excluir Conta Permanentemente</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                    
                    {activeTab === 'preferencias' && (
                         <>
                            <SectionCard title="Aparência">
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Escolha como o Nexus deve aparecer para você.</p>
                                <div className="grid grid-cols-3 gap-4">
                                    <ThemeButton onClick={() => setTheme('light')} label="Claro" icon={Sun} isActive={theme === 'light'} />
                                    <ThemeButton onClick={() => setTheme('dark')} label="Escuro" icon={Moon} isActive={theme === 'dark'} />
                                    <ThemeButton onClick={() => setTheme('system')} label="Sistema" icon={Monitor} isActive={theme === 'system'} />
                                </div>
                            </SectionCard>
                             <SectionCard title="Gerenciamento de Dados">
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Exporte seus dados de perfil e carteira a qualquer momento.</p>
                                <button onClick={handleExportData} className="w-full sm:w-auto flex items-center justify-center gap-2 py-2 px-5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-300 transition-colors">
                                    <Download className="h-5 w-5" />
                                    <span>Exportar Meus Dados (.json)</span>
                                </button>
                             </SectionCard>
                        </>
                    )}

                </main>
            </div>
        </div>
    );
};
export default AccountView;