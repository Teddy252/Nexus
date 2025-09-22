import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Asset } from '../types.ts';
import TableRow from './TableRow.tsx';
import { Download, Search, Eye, LayoutGrid, MoreHorizontal, Pencil, Trash2, Copy, Bell, BellOff, ExternalLink, GripVertical } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext.tsx';

export interface ColumnDef {
  key: string;
  label: string;
  className: string;
}

const allColumns: ColumnDef[] = [
    { key: 'ativo', label: 'Ativo', className: 'p-4' },
    { key: 'quantidade', label: 'Quantidade', className: 'p-4 text-right' },
    { key: 'precoMedio', label: 'Preço Médio', className: 'p-4 text-right' },
    { key: 'precoAtual', label: 'Preço Atual', className: 'p-4 text-right' },
    { key: 'valorMercado', label: 'Valor Mercado', className: 'p-4 text-right' },
    { key: 'valorBRL', label: 'Valor em BRL', className: 'p-4 text-right' },
    { key: 'lucroPrejuizo', label: 'L/P (R$)', className: 'p-4 text-right' },
    { key: 'rentabilidade', label: 'Rentabilidade', className: 'p-4 text-right' },
    { key: 'acoes', label: 'Ações', className: 'p-4 text-center w-24' },
];

const columnVisibility: Record<string, ('detailed' | 'simple')[]> = {
    'ativo': ['detailed', 'simple'],
    'quantidade': ['detailed'],
    'precoMedio': ['detailed'],
    'precoAtual': ['detailed'],
    'valorMercado': ['detailed', 'simple'],
    'valorBRL': ['detailed'],
    'lucroPrejuizo': ['detailed'],
    'rentabilidade': ['detailed', 'simple'],
    'acoes': ['detailed', 'simple'],
};


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

const AssetCard: React.FC<any> = ({ asset, onEdit, onDelete, onDuplicate, onToggleAlert, isSelected, onToggleSelection, isBeingDragged, isDragOver, onDragStart, onDragEnter, onDragEnd, onDrop }) => {
    const { formatCurrency, convertValue } = useCurrency();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const USD_BRL_RATE = 5.25;

    const { valorMercadoEmBRL, lucroPrejuizoEmBRL, rentabilidade } = useMemo(() => {
        const purchaseRate = asset.moedaCompra === 'USD' || asset.moedaCompra === 'USDT' ? USD_BRL_RATE : 1;
        const currentRate = asset.moedaCotacao === 'USD' ? USD_BRL_RATE : 1;
        const custoTotalEmBRL = asset.precoCompra * asset.quantidade * purchaseRate;
        const valorMercadoEmBRL = asset.cotacaoAtual * asset.quantidade * currentRate;
        const lucroPrejuizoEmBRL = valorMercadoEmBRL - custoTotalEmBRL;
        const rentabilidade = custoTotalEmBRL > 0 ? (lucroPrejuizoEmBRL / custoTotalEmBRL) * 100 : 0;
        return { valorMercadoEmBRL, lucroPrejuizoEmBRL, rentabilidade };
    }, [asset]);

    const lpColor = lucroPrejuizoEmBRL >= 0 ? 'text-emerald-500' : 'text-red-500';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const cardClasses = ["relative p-4 rounded-lg border transition-colors duration-200", isBeingDragged ? 'opacity-50 bg-slate-200 dark:bg-slate-700' : isSelected ? 'bg-sky-50 dark:bg-sky-900/40 border-sky-300 dark:border-sky-700' : "bg-transparent border-slate-200 dark:border-slate-700", isDragOver ? 'drag-over-indicator' : ''].filter(Boolean).join(" ");

    return (
        <div className={cardClasses} draggable="true" onDragStart={() => onDragStart(asset.id)} onDragEnter={() => onDragEnter(asset.id)} onDragEnd={onDragEnd} onDrop={() => onDrop(asset.id)} onDragOver={(e) => e.preventDefault()}>
            <div className="flex items-start gap-4">
                <div className="flex items-center gap-2 pt-1">
                    <input type="checkbox" checked={isSelected} onChange={() => onToggleSelection(asset.id)} onClick={(e) => e.stopPropagation()} aria-label={`Selecionar ${asset.ticker}`} className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-sky-600 focus:ring-sky-500 bg-white dark:bg-slate-700 checked:bg-sky-600 dark:checked:bg-sky-500 transition-colors"/>
                    <div className="text-slate-400 cursor-move" title="Arrastar para reordenar"><GripVertical className="h-5 w-5" /></div>
                </div>
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-base text-slate-800 dark:text-slate-100">{asset.ticker}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{asset.nome}</p>
                        </div>
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} title="Mais ações" className="p-2 -mr-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><MoreHorizontal className="h-5 w-5" /></button>
                            {isMenuOpen && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden animate-fade-in-down">
                                    <button onClick={() => { onEdit(asset); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><Pencil size={16} /> Editar</button>
                                    <button onClick={() => { onDuplicate(asset.id); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><Copy size={16} /> Duplicar</button>
                                    <button onClick={() => { onToggleAlert(asset.id); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                        {asset.alertActive ? <BellOff size={16} /> : <Bell size={16} />} {asset.alertActive ? "Desativar Alerta" : "Ativar Alerta"}
                                    </button>
                                    <div className="my-1 h-px bg-slate-100 dark:bg-slate-700" />
                                    <button onClick={() => { onDelete(asset.id); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={16} /> Excluir</button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-3 flex justify-between items-end">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Valor de Mercado</p>
                            <p className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(convertValue(valorMercadoEmBRL))}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-xs text-slate-500 dark:text-slate-400">Rentabilidade</p>
                             <p className={`font-semibold ${lpColor}`}>{rentabilidade.toFixed(2)}%</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


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
    const [columns, setColumns] = useState(allColumns);
    const [draggedColumnKey, setDraggedColumnKey] = useState<string | null>(null);
    const [dragOverColumnKey, setDragOverColumnKey] = useState<string | null>(null);
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

    const filteredColumns = useMemo(() => {
        return columns.filter(c => columnVisibility[c.key].includes(viewMode));
    }, [columns, viewMode]);
    
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

    const handleDragStart = (id: number) => setDraggedId(id);
    const handleDragEnter = (id: number) => {
        const isSelected = selectedAssetIds.has(id);
        const isDraggingSelected = draggedId !== null && selectedAssetIds.has(draggedId);
        if (isDraggingSelected && isSelected) return;
        if (id !== draggedId) setDragOverId(id);
    };
    const handleDragEnd = () => {
        setDraggedId(null);
        setDragOverId(null);
    };
    const handleDrop = (targetId: number) => {
        if (draggedId !== null && draggedId !== targetId) onReorderAssets(draggedId, targetId);
        setDraggedId(null);
        setDragOverId(null);
    };
    
    const handleColumnDragStart = (key: string) => setDraggedColumnKey(key);
    const handleColumnDragEnter = (key: string) => { if (key !== draggedColumnKey) setDragOverColumnKey(key); };
    const handleColumnDragEnd = () => {
        setDraggedColumnKey(null);
        setDragOverColumnKey(null);
    };
    const handleColumnDrop = (targetKey: string) => {
        if (!draggedColumnKey || draggedColumnKey === targetKey) return;
        const newColumns = [...columns];
        const draggedIndex = newColumns.findIndex(c => c.key === draggedColumnKey);
        const targetIndex = newColumns.findIndex(c => c.key === targetKey);
        const [draggedItem] = newColumns.splice(draggedIndex, 1);
        newColumns.splice(targetIndex, 0, draggedItem);
        setColumns(newColumns);
        handleColumnDragEnd();
    };

    const handleExportCsv = () => {
        const headers = ['Ticker', 'Nome', 'Categoria', 'País', 'Corretora', 'Quantidade', 'PrecoMedioCompra', 'CotacaoAtual', 'ValorDeMercado', 'LucroPrejuizo'];
        const data = assets.map(asset => {
            const valorMercado = asset.quantidade * asset.cotacaoAtual;
            const lucroPrejuizo = valorMercado - (asset.quantidade * asset.precoCompra);
            const sanitizedName = `"${asset.nome.replace(/"/g, '""')}"`;
            return [asset.ticker, sanitizedName, asset.categoria, asset.pais, asset.corretora, asset.quantidade, asset.precoCompra, asset.cotacaoAtual, valorMercado.toFixed(2), lucroPrejuizo.toFixed(2)].join(',');
        });
        const csvContent = [headers.join(','), ...data].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'meus_ativos_nexus.csv';
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
                                <button key={category} onClick={() => setCategoryFilter(category)} className={`px-3 py-1 text-xs font-semibold rounded whitespace-nowrap transition-colors ${ categoryFilter === category ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-600/50' }`}>{category}</button>
                            ))}
                        </div>
                         <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-md flex-nowrap">
                            {countries.map(country => (
                                <button key={country} onClick={() => setCountryFilter(country)} className={`px-3 py-1 text-xs font-semibold rounded whitespace-nowrap transition-colors ${ countryFilter === country ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-600/50' }`}>{country}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-md flex-nowrap ml-2">
                        <button onClick={() => setViewMode('detailed')} title="Visão Detalhada" className={`px-2 py-1.5 text-xs font-semibold rounded transition-colors ${ viewMode === 'detailed' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-600/50' }`}><LayoutGrid className="h-4 w-4" /></button>
                        <button onClick={() => setViewMode('simple')} title="Visão Simplificada" className={`px-2 py-1.5 text-xs font-semibold rounded transition-colors ${ viewMode === 'simple' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-600/50' }`}><Eye className="h-4 w-4" /></button>
                    </div>
                    <button onClick={handleExportCsv} title="Exportar para CSV" className="p-2.5 bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/80 hover:text-sky-500 dark:hover:text-sky-400 rounded-lg transition-colors flex-shrink-0"><Download className="h-4 w-4" /></button>
                </div>
            </div>
            
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden lg:block">
                <table className="w-full">
                    <thead className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 text-left">
                        <tr>
                             <th className="p-4 w-12">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" ref={headerCheckboxRef} checked={areAllFilteredSelected} onChange={handleSelectAllClick} aria-label="Selecionar todos os ativos visíveis" className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-sky-600 focus:ring-sky-500 bg-white dark:bg-slate-700 checked:bg-sky-600 dark:checked:bg-sky-500 transition-colors" />
                                    <div className="w-5 h-5" />
                                </div>
                            </th>
                            {filteredColumns.map(col => (
                                <th
                                    key={col.key}
                                    draggable
                                    onDragStart={() => handleColumnDragStart(col.key)}
                                    onDragEnter={() => handleColumnDragEnter(col.key)}
                                    onDragLeave={() => setDragOverColumnKey(null)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => handleColumnDrop(col.key)}
                                    onDragEnd={handleColumnDragEnd}
                                    className={`${col.className} relative cursor-move transition-opacity ${draggedColumnKey === col.key ? 'opacity-50' : ''} ${dragOverColumnKey === col.key ? 'drag-over-column-indicator' : ''}`}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAssets.length > 0 && filteredAssets.map(asset => {
                            const isDraggingSelectedGroup = draggedId !== null && selectedAssetIds.has(draggedId);
                            const isBeingDragged = isDraggingSelectedGroup ? selectedAssetIds.has(asset.id) : draggedId === asset.id;
                            return (
                                <TableRow
                                    key={asset.id}
                                    asset={asset}
                                    columns={filteredColumns}
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
                                />
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-4">
                 {filteredAssets.length > 0 && (
                    <div className="flex items-center gap-2 p-2 border-b border-slate-200 dark:border-slate-700">
                        <input type="checkbox" ref={headerCheckboxRef} checked={areAllFilteredSelected} onChange={handleSelectAllClick} aria-label="Selecionar todos os ativos visíveis" className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-sky-600 focus:ring-sky-500 bg-white dark:bg-slate-700 checked:bg-sky-600 dark:checked:bg-sky-500 transition-colors" />
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Selecionar Todos</label>
                    </div>
                 )}
                 {filteredAssets.map(asset => {
                    const isDraggingSelectedGroup = draggedId !== null && selectedAssetIds.has(draggedId);
                    const isBeingDragged = isDraggingSelectedGroup ? selectedAssetIds.has(asset.id) : draggedId === asset.id;
                     return (
                        <AssetCard
                            key={asset.id}
                            asset={asset}
                            onEdit={onEditAsset}
                            onDelete={onDeleteAsset}
                            onDuplicate={onDuplicateAsset}
                            onToggleAlert={onToggleAlert}
                            isSelected={selectedAssetIds.has(asset.id)}
                            onToggleSelection={() => onToggleAssetSelection(asset.id)}
                            isBeingDragged={isBeingDragged}
                            isDragOver={dragOverId === asset.id}
                            onDragStart={handleDragStart}
                            onDragEnter={handleDragEnter}
                            onDragEnd={handleDragEnd}
                            onDrop={handleDrop}
                        />
                     )
                 })}
            </div>

             {filteredAssets.length === 0 && (
                 <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center">
                        <Search className="h-10 w-10 mb-2" />
                        <p className="font-semibold">Nenhum ativo encontrado</p>
                        <p className="text-sm">Tente ajustar seus filtros.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortfolioTable;