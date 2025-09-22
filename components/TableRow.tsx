import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Asset } from '../types.ts';
import { ColumnDef } from './PortfolioTable.tsx';
import { Pencil, Trash2, ExternalLink, Bell, BellOff, MoreHorizontal, GripVertical, Copy } from 'lucide-react';

interface TableRowProps {
    asset: Asset;
    columns: ColumnDef[];
    onEdit: (asset: Asset) => void;
    onDelete: (id: number) => void;
    onDuplicate: (id: number) => void;
    onToggleAlert: (id: number) => void;
    isSelected: boolean;
    onToggleSelection: (id: number) => void;
    isBeingDragged: boolean;
    isDragOver: boolean;
    onDragStart: (id: number) => void;
    onDragEnter: (id: number) => void;
    onDragEnd: () => void;
    onDrop: (id: number) => void;
    scrollToTicker: string | null;
    onScrollComplete: () => void;
}

const getTradingViewUrl = (asset: Asset): string | null => {
    const { ticker, pais, categoria } = asset;
    const formattedTicker = ticker.replace(/\s/g, '');
    if (categoria === 'Tesouro Direto') return null;
    if (categoria === 'Cripto') return `https://www.tradingview.com/chart/?symbol=BINANCE:${formattedTicker}BRL`;
    if (pais === 'Brasil') return `https://www.tradingview.com/chart/?symbol=B3:${formattedTicker}`;
    if (pais === 'EUA') return `https://www.tradingview.com/chart/?symbol=NASDAQ:${formattedTicker}`;
    if (pais === 'Global' && categoria !== 'Cripto') return null;
    return `https://www.tradingview.com/chart/?symbol=${formattedTicker}`;
};

const TableRow: React.FC<TableRowProps> = ({ 
    asset, columns, onEdit, onDelete, onDuplicate, onToggleAlert, 
    isSelected, onToggleSelection, isBeingDragged, isDragOver, 
    onDragStart, onDragEnter, onDragEnd, onDrop, 
    scrollToTicker, onScrollComplete 
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const rowRef = useRef<HTMLTableRowElement>(null);

    const USD_BRL_RATE = 5.25;

    const { valorMercadoOriginal, valorMercadoEmBRL, lucroPrejuizoEmBRL, custoTotalEmBRL } = useMemo(() => {
        const purchaseRate = asset.moedaCompra === 'USD' || asset.moedaCompra === 'USDT' ? USD_BRL_RATE : 1;
        const currentRate = asset.moedaCotacao === 'USD' ? USD_BRL_RATE : 1;
        
        const valorMercadoOriginal = asset.cotacaoAtual * asset.quantidade;
        const valorMercadoEmBRL = valorMercadoOriginal * currentRate;

        const custoTotalEmBRL = asset.precoCompra * asset.quantidade * purchaseRate;
        const lucroPrejuizoEmBRL = valorMercadoEmBRL - custoTotalEmBRL;
        
        return { valorMercadoOriginal, valorMercadoEmBRL, lucroPrejuizoEmBRL, custoTotalEmBRL };
    }, [asset]);

    const localCurrencyFormatter = useMemo(() => new Intl.NumberFormat(asset.moedaCotacao === 'USD' ? 'en-US' : 'pt-BR', {
        style: 'currency',
        currency: asset.moedaCotacao === 'USD' ? 'USD' : 'BRL',
    }), [asset.moedaCotacao]);

    const brlFormatter = useMemo(() => new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }), []);

    const rentabilidade = custoTotalEmBRL > 0 ? (lucroPrejuizoEmBRL / custoTotalEmBRL) * 100 : 0;

    const lpColor = lucroPrejuizoEmBRL >= 0 ? 'text-emerald-500' : 'text-red-500';
    const lpSign = lucroPrejuizoEmBRL >= 0 ? '+' : '';

    const tradingViewUrl = getTradingViewUrl(asset);
    const isAlertTriggered = asset.alertActive && ((asset.alertPriceSuperior && asset.cotacaoAtual >= asset.alertPriceSuperior) || (asset.alertPriceInferior && asset.cotacaoAtual <= asset.alertPriceInferior));

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (scrollToTicker && asset.ticker === scrollToTicker) {
            rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            rowRef.current?.classList.add('highlight-row');
            const timer = setTimeout(() => {
                rowRef.current?.classList.remove('highlight-row');
                onScrollComplete();
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [scrollToTicker, asset.ticker, onScrollComplete]);
    
    const rowClasses = ["border-b border-slate-100 dark:border-slate-800 transition-colors duration-200 group", isBeingDragged ? 'opacity-50 bg-slate-200 dark:bg-slate-700' : isSelected ? 'bg-sky-50 dark:bg-sky-900/40' : (isAlertTriggered ? "bg-yellow-100 dark:bg-yellow-900/20" : "hover:bg-slate-100 dark:hover:bg-slate-700/40"), isDragOver ? 'drag-over-indicator' : ''].filter(Boolean).join(" ");

    const renderCellContent = (columnKey: string) => {
        switch(columnKey) {
            case 'ativo': return (<>
                <div className="font-bold text-base text-slate-800 dark:text-slate-100">{asset.ticker}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{asset.nome} &bull; {asset.pais}</div>
            </>);
            case 'quantidade': return asset.quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 6 });
            case 'precoMedio': return localCurrencyFormatter.format(asset.precoCompra);
            case 'precoAtual': return localCurrencyFormatter.format(asset.cotacaoAtual);
            case 'valorMercado': return localCurrencyFormatter.format(valorMercadoOriginal);
            case 'valorBRL': return brlFormatter.format(valorMercadoEmBRL);
            case 'lucroPrejuizo': return asset.precoCompra === 0 ? (<span className="text-sm text-slate-400 dark:text-slate-500">N/A</span>) : (`${lpSign}${brlFormatter.format(lucroPrejuizoEmBRL)}`);
            case 'rentabilidade': return asset.precoCompra === 0 ? (<span className="text-sm text-slate-400 dark:text-slate-500">N/A</span>) : (`${rentabilidade >= 0 ? '+' : ''}${rentabilidade.toFixed(2)}%`);
            case 'acoes': return (
                 <div className="relative flex items-center justify-center" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} title="Mais ações" className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><MoreHorizontal className="h-5 w-5" /></button>
                     {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden animate-fade-in-down">
                            <button onClick={() => { onEdit(asset); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><Pencil size={16} /> Editar</button>
                            <button onClick={() => { onDuplicate(asset.id); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><Copy size={16} /> Duplicar</button>
                            <button onClick={() => { onToggleAlert(asset.id); setIsMenuOpen(false); }} title={asset.alertActive ? "Desativar alerta" : "Ativar alerta"} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                {asset.alertActive ? <BellOff size={16} className={`${isAlertTriggered ? 'text-amber-500' : 'text-yellow-500'}`} /> : <Bell size={16} />} {asset.alertActive ? "Desativar Alerta" : "Ativar Alerta"}
                            </button>
                            {tradingViewUrl && <a href={tradingViewUrl} target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><ExternalLink size={16} /> Ver no TradingView</a>}
                            <div className="my-1 h-px bg-slate-100 dark:bg-slate-700" />
                            <button onClick={() => { onDelete(asset.id); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={16} /> Excluir</button>
                        </div>
                    )}
                </div>
            );
            default: return null;
        }
    };

    const getCellClassName = (columnKey: string) => {
        const baseClass = 'p-2 md:p-4';
        const textRightClass = ' text-right';
        const fontMediumClass = ' font-medium text-slate-700 dark:text-slate-200';
        
        switch(columnKey) {
            case 'quantidade': return baseClass + textRightClass + fontMediumClass;
            case 'precoMedio': return baseClass + textRightClass + fontMediumClass;
            case 'precoAtual': return baseClass + textRightClass + fontMediumClass;
            case 'valorMercado': return baseClass + textRightClass + fontMediumClass;
            case 'valorBRL': return baseClass + textRightClass + fontMediumClass;
            case 'lucroPrejuizo': return `${baseClass}${textRightClass} font-semibold text-base ${lpColor}`;
            case 'rentabilidade': return `${baseClass}${textRightClass} font-semibold text-base ${lpColor}`;
            case 'acoes': return `${baseClass} text-center`;
            default: return baseClass;
        }
    };

    return (
        <tr ref={rowRef} className={rowClasses} draggable="true" onDragStart={() => onDragStart(asset.id)} onDragEnter={() => onDragEnter(asset.id)} onDragEnd={onDragEnd} onDrop={() => onDrop(asset.id)} onDragOver={(e) => e.preventDefault()}>
            <td className="p-2 md:p-4">
                 <div className="flex items-center gap-2">
                    <input type="checkbox" checked={isSelected} onChange={() => onToggleSelection(asset.id)} onClick={(e) => e.stopPropagation()} aria-label={`Selecionar ${asset.ticker}`} className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-sky-600 focus:ring-sky-500 bg-white dark:bg-slate-700 checked:bg-sky-600 dark:checked:bg-sky-500 transition-colors"/>
                    <div className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-move" title="Arrastar para reordenar"><GripVertical className="h-5 w-5" /></div>
                </div>
            </td>
            {columns.map(col => (
                <td key={col.key} className={getCellClassName(col.key)}>
                    {renderCellContent(col.key)}
                </td>
            ))}
        </tr>
    );
};

export default TableRow;