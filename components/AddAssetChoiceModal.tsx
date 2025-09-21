import React from 'react';
import { X, PlusCircle, UploadCloud } from 'lucide-react';

interface AddAssetChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onManualAdd: () => void;
    onImport: () => void;
}

const ChoiceButton: React.FC<{ icon: React.ElementType, title: string, description: string, onClick: () => void }> = ({ icon: Icon, title, description, onClick }) => (
    <button
        onClick={onClick}
        className="group w-full text-left bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-xl hover:border-sky-500/50 dark:hover:border-sky-500/50 transition-all duration-300 transform hover:-translate-y-1"
    >
        <Icon className="h-10 w-10 text-sky-500 mb-4 transition-transform group-hover:scale-110" />
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400">{description}</p>
    </button>
);

const AddAssetChoiceModal: React.FC<AddAssetChoiceModalProps> = ({ isOpen, onClose, onManualAdd, onImport }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-800 w-full max-w-2xl p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-fade-in-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Adicionar Ativos</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Como você gostaria de adicionar seus ativos?</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700">
                        <X className="h-5 w-5"/>
                    </button>
                </header>
                <main className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ChoiceButton
                        icon={PlusCircle}
                        title="Adicionar Manualmente"
                        description="Insira os detalhes de um único ativo de cada vez."
                        onClick={onManualAdd}
                    />
                    <ChoiceButton
                        icon={UploadCloud}
                        title="Importar de Arquivo"
                        description="Envie um arquivo .csv ou .xlsx com múltiplos ativos."
                        onClick={onImport}
                    />
                </main>
            </div>
        </div>
    );
};

export default AddAssetChoiceModal;
