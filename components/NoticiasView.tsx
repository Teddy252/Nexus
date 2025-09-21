import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Asset, NewsItem } from '../types';
import { getRelevantNews } from '../services/geminiService';
import { useDebounce } from '../hooks/useDebounce';
import { Search, Loader2, AlertTriangle, Newspaper, ExternalLink, Wallet } from 'lucide-react';

interface NoticiasViewProps {
    portfolioData: Asset[];
}

const NewsCard: React.FC<{ item: NewsItem }> = ({ item }) => (
    <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-500/50 dark:hover:border-sky-500/50 hover:shadow-md transition-all group"
    >
        <p className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400">{item.title}</p>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 italic">"{item.summary}"</p>
        <div className="flex justify-between items-center mt-4">
            <p className="text-xs font-bold text-sky-600 dark:text-sky-400">{item.source}</p>
            <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-sky-500 transition-colors" />
        </div>
    </a>
);

const NoticiasView: React.FC<NoticiasViewProps> = ({ portfolioData }) => {
    const [query, setQuery] = useState('');
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const debouncedQuery = useDebounce(query, 500);

    const fetchNews = useCallback(async (searchQuery: string) => {
        if (!searchQuery) {
            setNews([]);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const results = await getRelevantNews(searchQuery);
            setNews(results);
        } catch (err: any) {
            const errorMessage = err.message || err.toString();
            if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
                setError("Limite de requisições à API atingido. Tente novamente mais tarde.");
            } else {
                setError("Não foi possível buscar as notícias.");
            }
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchNews(debouncedQuery);
    }, [debouncedQuery, fetchNews]);

    const handleFetchPortfolioNews = () => {
        if (portfolioData.length === 0) {
            return;
        }

        const topTickers = portfolioData
            .map(asset => ({
                ticker: asset.ticker,
                marketValue: asset.quantidade * asset.cotacaoAtual,
            }))
            .sort((a, b) => b.marketValue - a.marketValue)
            .slice(0, 10)
            .map(a => a.ticker);

        if (topTickers.length > 0) {
            setQuery(topTickers.join(', '));
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center text-center py-20">
                    <Loader2 className="h-12 w-12 animate-spin text-sky-500" />
                    <p className="mt-4 text-slate-500 dark:text-slate-400">Buscando notícias...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center text-center py-20 text-red-500 dark:text-red-400 bg-red-500/10 rounded-lg">
                    <AlertTriangle className="h-12 w-12 mb-4" />
                    <h3 className="text-xl font-bold">Ocorreu um Erro</h3>
                    <p>{error}</p>
                </div>
            );
        }

        if (news.length > 0) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {news.map((item, index) => <NewsCard key={index} item={item} />)}
                </div>
            );
        }
        
        if (!debouncedQuery) {
            return (
                <div className="flex flex-col items-center justify-center text-center py-20 text-slate-500 dark:text-slate-400">
                    <Search className="h-16 w-16 mx-auto mb-4" />
                    <p className="font-semibold text-lg">Pesquise por notícias</p>
                    <p>Digite um ticker, nome de empresa ou tópico de mercado para começar.</p>
                </div>
            )
        }

        return (
            <div className="flex flex-col items-center justify-center text-center py-20 text-slate-500 dark:text-slate-400">
                <Newspaper className="h-16 w-16 mx-auto mb-4" />
                <p className="font-semibold text-lg">Nenhuma notícia encontrada</p>
                <p>Tente refinar sua busca para encontrar resultados.</p>
            </div>
        );
    };


    return (
        <div className="max-w-7xl mx-auto">
            <header className="mb-6 md:mb-8">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-2">Central de Notícias</h1>
                <p className="text-base md:text-lg text-slate-500 dark:text-slate-400">Pesquise as últimas notícias do mercado financeiro para se manter informado.</p>
            </header>
            
            <div className="sticky top-4 z-10 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-md p-4 -mx-4 mb-8 rounded-b-xl shadow-sm">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Pesquisar por ativo, empresa ou tópico (ex: 'AAPL', 'inflação Brasil')..."
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg py-3 pl-12 pr-4 text-base focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                    />
                </div>
                <div className="mt-4 flex justify-center">
                    <button 
                        onClick={handleFetchPortfolioNews}
                        className="flex items-center gap-2 py-2 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                       <Wallet className="h-4 w-4 text-sky-500" />
                       Ver notícias da minha carteira
                    </button>
                </div>
            </div>

            {renderContent()}
        </div>
    );
};

export default NoticiasView;