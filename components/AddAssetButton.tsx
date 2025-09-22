import React from 'react';
import { Plus } from 'lucide-react';

interface AddAssetButtonProps {
    onClick: () => void;
}

const AddAssetButton: React.FC<AddAssetButtonProps> = ({ onClick }) => {
    return (
        <div className="fixed bottom-20 right-6 lg:bottom-8 lg:right-8 z-30">
            <button
                onClick={onClick}
                title="Adicionar Novo Ativo"
                aria-label="Adicionar Novo Ativo"
                className="w-14 h-14 flex items-center justify-center bg-sky-600 text-white rounded-full shadow-xl shadow-sky-500/40 transition-all transform hover:scale-110 hover:bg-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/50"
            >
                <Plus className="h-7 w-7" />
            </button>
        </div>
    );
};

export default AddAssetButton;