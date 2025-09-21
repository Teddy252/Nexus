import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Asset } from '../types';
import TableRow from './TableRow';
import { Download, Search, Eye, LayoutGrid } from 'lucide-react';

interface PortfolioTableProps {
    assets: Asset[];
    onEditAsset: (asset: Asset) => void;
    onDeleteAsset: (id: number) => void;
    onDuplicateAsset: (id: number) => void;
    onToggleAlert: (id: number) => void;
    onReorderAssets: (draggedId: number, targetId: number) => void;
    scrollToTicker: string | null;
    onScrollComplete: () => void;
    selectedAssetIds: Set<number>;
    onToggleAssetSelection: (id: number) => void;
    onToggleAllAssets: (assetIds: number[], areAllCurrentlySelected: boolean) => void;
}

const PortfolioTable: React.FC<PortfolioTableProps> = ({ 
    assets, 
    onEditAsset, 
    onDeleteAsset, 
    onDuplicateAsset, 
    onToggleAlert, 
    onReorderAssets, 
    scrollToTicker, 
    onScrollComplete,
    selectedAssetIds,
    onToggleAssetSelection,
    onToggleAllAssets
}) => {
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [dragOverId, setDragOverId] = useState<number | null>(null);
    const [categoryFilter, setCategoryFilter] = useState('Todos');
    const [countryFilter, setCountryFilter] = useState('Todos');
    const [viewMode, setViewMode] = useState<'detailed' | 'simple'>('detailed');
    const headerCheckboxRef = useRef<HTMLInputElement>(null);

    const categories = useMemo(() => {
        const uniqueCategories = [...new Set(assets.map(a => a.categoria))].sort();
        return ['Todos', ...uniqueCategories];
    }, [assets]);

    const countries = useMemo(() => {
        const uniqueCountries = [...new Set(assets.map(a => a.pais))].sort();
        return ['Todos', ...uniqueCountries];
    }, [assets]);


    const filteredAssets = useMemo(() => {
        return assets.filter(asset => {
            const categoryMatch = categoryFilter === 'Todos' || asset.categoria === categoryFilter;
            const countryMatch = countryFilter === 'Todos' || asset.pais === countryFilter;
            return categoryMatch && countryMatch;
        });
    }, [assets, categoryFilter, countryFilter]);
    
    const areAllFilteredSelected = useMemo(() => 
        filteredAssets.length > 0 && filteredAssets.every(a => selectedAssetIds.has(a.id)),
        [filteredAssets, selectedAssetIds]
    );

    const isPartiallySelected = useMemo(() => {
        const selectedCountInFilter = filteredAssets.filter(a => selectedAssetIds.has(a.id)).length;
        return selectedCountInFilter > 0 && selectedCountInFilter < filteredAssets.length;
    }, [filteredAssets, selectedAssetIds]);
    
    useEffect(() => {
        if (headerCheckboxRef.current) {
            headerCheckboxRef.current.indeterminate = isPartiallySelected;
        }
    }, [isPartiallySelected]);

    const handleSelectAllClick = () => {
        onToggleAllAssets(filteredAssets.map(a => a.id), areAllFilteredSelected);
    };

    const handleDragStart = (id: number) => {
        setDraggedId(id);
    };

    const handleDragEnter = (id: number) => {
        const isSelected = selectedAssetIds.has(id);
        const isDraggingSelected = draggedId !== null && selectedAssetIds.has(draggedId);
        if (isDraggingSelected && isSelected) return;

        if (id !== draggedId) {
            setDragOverId(id);
        }
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setDragOverId(null);
    };

    const handleDrop = (targetId: number) => {
        if (draggedId !== null && draggedId !== targetId) {
            onReorderAssets(draggedId, targetId);
        }
        setDraggedId(null);
        setDragOverId(null);
    };
    
    const handleExportCsv = () => {
        const headers = [
            'Ticker', 'Nome', 'Categoria', 'País', 'Corretora',
            'Quantidade', 'PrecoMedioCompra', 'CotacaoAtual',
            'ValorDeMercado', 'LucroPrejuizo'
        ];

        const data = assets.map(asset => {
            const valorMercado = asset.quantidade * asset.cotacaoAtual;
            const lucroPrejuizo = valorMercado - (asset.quantidade * asset.precoCompra);
            // Sanitize name field by wrapping in quotes and escaping existing quotes
            const sanitizedName = `"${asset.nome.replace(/"/g, '""')}"`;
            
            return [
                asset.ticker, sanitizedName, asset.categoria, asset.pais, asset.corretora,
                asset.quantidade, asset.precoCompra, asset.cotacaoAtual,
                valorMercado.toFixed(2), lucroPrejuizo.toFixed(2)
            ].join(',');
        });

        const csvContent = [headers.join(','), ...data].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'meus_ativos_nexus.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Meus Ativos</h2>
                <div className="flex items-center gap-2 self-start sm:self-center">
                     <div className="flex items-center gap-4 overflow-x-auto pb-2">
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-md flex-nowrap">
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setCategoryFilter(category)}
                                    className={`px-3 py-1 text-xs font-semibold rounded whitespace-nowrap transition-colors ${
                                        categoryFilter === category ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-600/50'
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                         <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-md flex-nowrap">
                            {countries.map(country => (
                                <button
                                    key={country}
                                    onClick={() => setCountryFilter(country)}
                                    className={`px-3 py-1 text-xs font-semibold rounded whitespace-nowrap transition-colors ${
                                        countryFilter === country ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-600/50'
                                    }`}
                                >
                                    {country}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-md flex-nowrap ml-2">
                        <button
                            onClick={() => setViewMode('detailed')}
                            title="Visão Detalhada"
                            className={`px-2 py-1.5 text-xs font-semibold rounded transition-colors ${
                                viewMode === 'detailed' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-600/50'
                            }`}
                        >
                           <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('simple')}
                            title="Visão Simplificada"
                            className={`px-2 py-1.5 text-xs font-semibold rounded transition-colors ${
                                viewMode === 'simple' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-600/50'
                            }`}
                        >
                            <Eye className="h-4 w-4" />
                        </button>
                    </div>
                    <button
                        onClick={handleExportCsv}
                        title="Exportar para CSV"
                        className="p-2.5 bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/80 hover:text-sky-500 dark:hover:text-sky-400 rounded-lg transition-colors flex-shrink-0"
                    >
                        <Download className="h-4 w-4" />
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                    <thead className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 text-left">
                        <tr>
                             <th className="p-4 w-12">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        ref={headerCheckboxRef}
                                        checked={areAllFilteredSelected}
                                        onChange={handleSelectAllClick}
                                        aria-label="Selecionar todos os ativos visíveis"
                                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-sky-600 focus:ring-sky-500 bg-white dark:bg-slate-700 checked:bg-sky-600 dark:checked:bg-sky-500 transition-colors"
                                    />
                                    <div className="w-5 h-5" /> {/* Placeholder for alignment with grip handle */}
                                </div>
                            </th>
                            <th className="p-4">Ativo</th>
                            {viewMode === 'simple' && <th className="p-4 text-right">Quantidade</th>}
                            <th className="p-4 text-center">Preço Atual</th>
                            <th className="p-4 text-right">Valor Mercado</th>
                            {viewMode === 'detailed' && (
                                <>
                                    <th className="p-4 text-right">Lucro/Prejuízo</th>
                                    <th className="p-4 text-right">Tendência (7d)</th>
                                </>
                            )}
                            <th className="p-4 text-center w-24">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAssets.length > 0 ? (
                            filteredAssets.map(asset => {
                                const isDraggingSelectedGroup = draggedId !== null && selectedAssetIds.has(draggedId);
                                const isBeingDragged = isDraggingSelectedGroup 
                                    ? selectedAssetIds.has(asset.id) 
                                    : draggedId === asset.id;

                                return (
                                    <TableRow
                                        key={asset.id}
                                        asset={asset}
                                        onEdit={onEditAsset}
                                        onDelete={onDeleteAsset}
                                        onDuplicate={onDuplicateAsset}
                                        onToggleAlert={onToggleAlert}
                                        isSelected={selectedAssetIds.has(asset.id)}
                                        onToggleSelection={onToggleAssetSelection}
                                        isBeingDragged={isBeingDragged}
                                        isDragOver={dragOverId === asset.id}
                                        onDragStart={handleDragStart}
                                        onDragEnter={handleDragEnter}
                                        onDragEnd={handleDragEnd}
                                        onDrop={handleDrop}
                                        scrollToTicker={scrollToTicker}
                                        onScrollComplete={onScrollComplete}
                                        viewMode={viewMode}
                                    />
                                );
                            })
                        ) : (
                             <tr>
                                <td colSpan={viewMode === 'detailed' ? 7 : 5} className="text-center py-12 text-slate-500 dark:text-slate-400">
                                    <div className="flex flex-col items-center">
                                        <Search className="h-10 w-10 mb-2" />
                                        <p className="font-semibold">Nenhum ativo encontrado</p>
                                        <p className="text-sm">Tente ajustar seus filtros.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PortfolioTable;