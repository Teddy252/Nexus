import React, { useState, useEffect, useContext } from 'react';
import { UserProfile } from '../types';
import { AuthContext } from '../context/AuthContext';
import { X, Loader2 } from 'lucide-react';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedProfile: Pick<UserProfile, 'first_name' | 'last_name'>) => Promise<void>;
    profile: UserProfile;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onSave, profile }) => {
    const { currentUser } = useContext(AuthContext);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (profile) {
            setFirstName(profile.first_name || '');
            setLastName(profile.last_name || '');
        }
    }, [profile, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await onSave({ first_name: firstName, last_name: lastName });
        } catch (err: any) {
            setError(err.message || "Não foi possível salvar as alterações.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950 bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white border border-slate-300 w-full max-w-md p-6 rounded-2xl shadow-2xl">
                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Meu Perfil</h2>
                    <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 rounded-full">
                        <X className="h-5 w-5" />
                    </button>
                </header>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                     {error && <p className="bg-red-900/50 text-red-300 p-3 rounded-md text-center text-sm">{error}</p>}

                    <div>
                        <label className="block text-sm font-medium text-slate-600">E-mail</label>
                        <p className="mt-1 text-slate-500 bg-slate-100 rounded-md py-2 px-3">{currentUser?.email}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-slate-600">Nome</label>
                            <input
                                type="text"
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                className="mt-1 block w-full bg-slate-100 border border-slate-300 rounded-md py-2 px-3 text-slate-900 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-slate-600">Sobrenome</label>
                            <input
                                type="text"
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                className="mt-1 block w-full bg-slate-100 border border-slate-300 rounded-md py-2 px-3 text-slate-900 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                            />
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-4 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="py-2 px-5 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold text-slate-800 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isLoading} className="py-2 px-5 w-28 flex justify-center bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold text-white transition-colors disabled:bg-sky-800">
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileModal;