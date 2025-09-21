import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Wallet } from 'lucide-react';
import { mockSearchResults, SearchResult } from '../data/searchMockData';
import { Asset } from '../types';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    portfolioData: Asset[];
    onSelectAsset: (ticker: string) => void;
}

// Helper component to highlight the search query within the text
const HighlightMatch: React.FC<{ text: string, query: string }> = ({ text, query }) => {
    if (!query || text.toLowerCase().indexOf(query.toLowerCase()) === -1) {
        return <>{text}</>;
    }
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <span key={i} className="bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold rounded-sm">{part}</span>
                ) : (
                    part
                )
            )}
        </>
    );
};


const AssetRow: React.FC<{
    asset: Asset | SearchResult;
    isInPortfolio?: boolean;
    isActive: boolean;
    id: string;
    onHover: () => void;
    onSelect: (ticker: string) => void;
    query: string; // Pass query for highlighting
}> = ({ asset, isInPortfolio = false, isActive, id, onHover, onSelect, query }) => {
    const ticker = 'ticker' in asset ? asset.ticker : '';
    const name = 'nome' in asset ? asset.nome : ('name' in asset ? asset.name : '');
    const assetClass = 'categoria' in asset ? asset.categoria : ('assetClass' in asset ? asset.assetClass : '');
    const exchange = 'corretora' in asset ? asset.corretora : ('exchange' in asset ? asset.exchange : '');
    const icon = ticker?.[0]?.toUpperCase() ?? '?';
    const activeClasses = 'bg-sky-100 dark:bg-sky-500/20';

    return (
        <button
            id={id}
            role="option"
            aria-selected={isActive}
            onMouseEnter={onHover}
            onClick={() => onSelect(ticker)}
            className={`w-full text-left flex items-center p-3 rounded-lg transition-colors group ${isActive ? activeClasses : 'hover:bg-sky-50 dark:hover:bg-sky-500/10'}`}
        >
            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold mr-4 transition-colors ${
                isActive ? 'bg-sky-200 dark:bg-sky-500/30 text-sky-600 dark:text-sky-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
            }`}>
                {icon}
            </div>
            <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                        <HighlightMatch text={ticker} query={query} />
                    </p>
                    {isInPortfolio && (
                        <span className="flex-shrink-0 text-xs font-semibold bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full">Na Carteira</span>
                    )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                     <HighlightMatch text={name} query={query} />
                </p>
            </div>
            <div className="text-right ml-4 flex-shrink-0 hidden sm:block">
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{assetClass.replace(' cfd', '').replace(' crypto', '')}</p>
                <div className="flex items-center justify-end gap-2 mt-1">
                    <p className="font-semibold text-sm text-slate-600 dark:text-slate-300">{exchange}</p>
                </div>
            </div>
        </button>
    );
};


const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, portfolioData, onSelectAsset }) => {
    const [query, setQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [activeIndex, setActiveIndex] = useState(-1);
    const modalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsContainerRef = useRef<HTMLDivElement>(null);

    const portfolioResults = useMemo(() => {
        if (!query) return [];
        const lowerCaseQuery = query.toLowerCase();
        return portfolioData.filter(asset => 
            asset.ticker.toLowerCase().includes(lowerCaseQuery) ||
            asset.nome.toLowerCase().includes(lowerCaseQuery)
        );
    }, [query, portfolioData]);
    
    const globalResults = useMemo(() => {
        const portfolioTickers = new Set(portfolioData.map(a => a.ticker));
        let results = mockSearchResults.filter(item => !portfolioTickers.has(item.ticker));

        if (activeFilter !== 'All') {
            results = results.filter(item => item.type === activeFilter);
        }

        if (query) {
            const lowerCaseQuery = query.toLowerCase();
            results = results.filter(
                item =>
                    item.ticker.toLowerCase().includes(lowerCaseQuery) ||
                    item.name.toLowerCase().includes(lowerCaseQuery)
            );
        }
        return results;
    }, [query, activeFilter, portfolioData]);

    const combinedResults = useMemo(() => {
        if (!query) {
            return portfolioData;
        }
        return [...portfolioResults, ...globalResults];
    }, [query, portfolioData, portfolioResults, globalResults]);
    
    const handleSelect = (ticker: string) => {
        onSelectAsset(ticker);
        onClose();
    };


    // Handle modal lifecycle and keyboard events
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            document.body.style.overflow = '';
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
                return;
            }
            
            if (combinedResults.length > 0) {
                 if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    setActiveIndex(prev => (prev + 1) % combinedResults.length);
                } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    setActiveIndex(prev => (prev - 1 + combinedResults.length) % combinedResults.length);
                } else if (event.key === 'Enter' && activeIndex > -1) {
                    event.preventDefault();
                    const selectedAsset = combinedResults[activeIndex];
                    const ticker = 'ticker' in selectedAsset ? selectedAsset.ticker : '';
                    if (ticker) {
                       handleSelect(ticker);
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose, combinedResults, activeIndex]);
    
    // Reset query and filters when closing
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setActiveFilter('All');
        }
    }, [isOpen]);

    // Reset active index when query changes
    useEffect(() => {
        setActiveIndex(-1);
    }, [query, activeFilter]);
    
    // Scroll active item into view
    useEffect(() => {
        if (activeIndex < 0 || !resultsContainerRef.current) return;
        const activeElement = resultsContainerRef.current.querySelector(`#search-result-${activeIndex}`);
        activeElement?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    const FILTERS = useMemo(() => ['All', ...[...new Set(mockSearchResults.map(item => item.type))].sort()], []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center items-start z-50 p-4 sm:p-8" onClick={onClose}>
            <div
                ref={modalRef}
                className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-fade-in-scale-up"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Pesquisar símbolo, ex. AAPL"
                            className="w-full bg-transparent text-slate-900 dark:text-slate-100 rounded-lg py-2.5 pl-10 pr-10 text-base focus:outline-none"
                            role="combobox"
                            aria-expanded="true"
                            aria-controls="search-results-list"
                            aria-activedescendant={activeIndex > -1 ? `search-result-${activeIndex}` : undefined}
                        />
                        {query && (
                             <button onClick={() => setQuery('')} title="Limpar busca" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full hover:bg-slate-200 dark:hover:bg-slate-600">
                                <X className="h-4 w-4" />
                             </button>
                        )}
                    </div>
                </div>
                <div className="p-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                         {FILTERS.map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-3 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${
                                    activeFilter === filter
                                    ? 'bg-sky-500 text-white'
                                    : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                {filter}
                            </button>
                         ))}
                    </div>
                </div>
                <div
                    ref={resultsContainerRef}
                    id="search-results-list"
                    role="listbox"
                    className="h-[60vh] overflow-y-auto p-2"
                >
                    {query && portfolioResults.length > 0 && (
                        <>
                            <h3 className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Na sua carteira</h3>
                            {portfolioResults.map((asset, index) => (
                                <AssetRow
                                    key={`portfolio-${asset.id}`}
                                    asset={asset}
                                    isInPortfolio
                                    isActive={index === activeIndex}
                                    id={`search-result-${index}`}
                                    onHover={() => setActiveIndex(index)}
                                    onSelect={handleSelect}
                                    query={query}
                                />
                            ))}
                        </>
                    )}
                     {query && globalResults.length > 0 && (
                        <>
                            <h3 className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Resultados Globais</h3>
                            {globalResults.map((item, index) => {
                                const combinedIndex = portfolioResults.length + index;
                                return (
                                    <AssetRow
                                        key={`global-${item.id}`}
                                        asset={item}
                                        isActive={combinedIndex === activeIndex}
                                        id={`search-result-${combinedIndex}`}
                                        onHover={() => setActiveIndex(combinedIndex)}
                                        onSelect={handleSelect}
                                        query={query}
                                    />
                                );
                            })}
                        </>
                    )}
                    {!query && (
                         <>
                            <h3 className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Meus Ativos</h3>
                            {portfolioData.length > 0 ? (
                                portfolioData.map((asset, index) => (
                                    <AssetRow
                                        key={`asset-${asset.id}`}
                                        asset={asset}
                                        isInPortfolio
                                        isActive={index === activeIndex}
                                        id={`search-result-${index}`}
                                        onHover={() => setActiveIndex(index)}
                                        onSelect={handleSelect}
                                        query={query}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-10 text-slate-500 flex flex-col items-center">
                                    <Wallet className="h-8 w-8 mb-2" />
                                    <p>Sua carteira está vazia.</p>
                                </div>
                            )}
                        </>
                    )}

                    {query && combinedResults.length === 0 && (
                        <div className="text-center py-10 text-slate-500">
                            <p>Nenhum resultado para "{query}"</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default SearchModal;