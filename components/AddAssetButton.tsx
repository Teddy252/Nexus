import React from 'react';
import { Plus } from 'lucide-react';

interface AddAssetButtonProps {
    onClick: () => void;
}

const AddAssetButton: React.FC<AddAssetButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            title="Adicionar Novo Ativo"
            aria-label="Adicionar Novo Ativo"
            className="fixed bottom-20 right-6 lg:bottom-8 lg:right-8 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg shadow-sky-500/40 transition-all duration-300 ease-in-out hover:bg-sky-500 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-sky-500/50 animate-fade-in-scale-up"
        >
            <Plus className="h-8 w-8" />
        </button>
    );
};

export default AddAssetButton;