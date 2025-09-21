import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { X, Loader2, AlertTriangle } from 'lucide-react';

interface EmailUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EmailUpdateModal: React.FC<EmailUpdateModalProps> = ({ isOpen, onClose }) => {
    const { updateUserEmail } = useContext(AuthContext);
    const [newEmail, setNewEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const resetForm = () => {
        setNewEmail('');
        setConfirmEmail('');
        setError('');
        setSuccess('');
        setIsSaving(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleEmailUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newEmail !== confirmEmail) {
            setError("Os e-mails não coincidem.");
            return;
        }
        
        setIsSaving(true);
        try {
            const { error } = await updateUserEmail(newEmail);
            if (error) throw error;
            setSuccess('Verifique sua caixa de entrada! Um e-mail foi enviado para seu endereço antigo e um para o novo para confirmar a alteração.');
            setNewEmail('');
            setConfirmEmail('');
        } catch (err: any) {
             setError(err.message || 'Falha ao alterar o e-mail.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950 bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 rounded-2xl shadow-2xl">
                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Alterar E-mail</h2>
                    <button onClick={handleClose} className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-700 rounded-full">
                        <X className="h-5 w-5" />
                    </button>
                </header>
                
                {error && <div className="bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm flex items-center gap-3 mb-4"><AlertTriangle className="h-5 w-5" />{error}</div>}
                {success && <div className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 p-3 rounded-lg text-sm mb-4">{success}</div>}

                <form onSubmit={handleEmailUpdate} className="space-y-4">
                    <div>
                        <label htmlFor="newEmail" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Novo E-mail</label>
                        <input id="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="block w-full bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-md py-2 px-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition" required />
                    </div>
                    <div>
                        <label htmlFor="confirmEmail" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Confirmar Novo E-mail</label>
                        <input id="confirmEmail" type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} className="block w-full bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-md py-2 px-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition" required />
                    </div>
                    <div className="mt-8 pt-4 flex justify-end space-x-4">
                        <button type="button" onClick={handleClose} className="py-2 px-5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 rounded-lg font-semibold text-slate-800 dark:text-slate-200 transition-colors">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="py-2 px-5 w-36 flex justify-center bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold text-white transition-colors disabled:bg-sky-400 dark:disabled:bg-sky-800">
                            {isSaving ? <Loader2 className="animate-spin" /> : 'Salvar E-mail'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmailUpdateModal;