import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserProfile } from '../types';
import { AuthContext } from '../context/AuthContext';
import { X, Loader2, Camera, AlertTriangle } from 'lucide-react';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { currentUser, userProfile, updateUserProfile, uploadAvatar } = useContext(AuthContext);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && userProfile) {
            setFirstName(userProfile.first_name || '');
            setLastName(userProfile.last_name || '');
            setError('');
            setSuccess('');
        }
    }, [userProfile, isOpen]);

    const clearMessages = () => {
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearMessages();
        setIsSaving(true);
        try {
            await updateUserProfile({ first_name: firstName, last_name: lastName });
            setSuccess('Perfil atualizado com sucesso!');
        } catch (err: any) {
            setError(err.message || "Não foi possível salvar as alterações.");
        } finally {
            setIsSaving(false);
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
    
    const getInitials = () => {
        const first = userProfile?.first_name?.[0] || '';
        const last = userProfile?.last_name?.[0] || '';
        return `${first}${last}`.toUpperCase();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950 bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 rounded-2xl shadow-2xl">
                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Meu Perfil</h2>
                    <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-700 rounded-full">
                        <X className="h-5 w-5" />
                    </button>
                </header>

                {error && <div className="bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm flex items-center gap-3 mb-4"><AlertTriangle className="h-5 w-5" />{error}</div>}
                {success && <div className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 p-3 rounded-lg text-sm mb-4">{success}</div>}

                <div className="flex items-center gap-6 mb-8">
                    <div className="relative group">
                        <label htmlFor="avatar-upload" title="Alterar foto de perfil" className="relative w-24 h-24 rounded-full cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-sky-500 dark:focus-within:ring-offset-slate-800 block">
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
                        <p className="text-sm text-slate-500 dark:text-slate-400">Logado como</p>
                        <p className="font-semibold text-slate-700 dark:text-slate-300">{currentUser?.email}</p>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Nome</label>
                            <input
                                type="text"
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                className="mt-1 block w-full bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-md py-2 px-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                            />
                        </div>
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Sobrenome</label>
                            <input
                                type="text"
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                className="mt-1 block w-full bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-md py-2 px-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                            />
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-4 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="py-2 px-5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 rounded-lg font-semibold text-slate-800 dark:text-slate-200 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSaving} className="py-2 px-5 w-28 flex justify-center bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold text-white transition-colors disabled:bg-sky-400 dark:disabled:bg-sky-800">
                            {isSaving ? <Loader2 className="animate-spin" /> : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileModal;