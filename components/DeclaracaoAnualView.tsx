import React, { useState, useMemo } from 'react';
import { Asset, IrInfo } from '../types';
import { FileText, Loader2, Clipboard, Check, AlertTriangle, Download } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { generateAnnualTaxReportPdf } from '../services/pdfService';
import { generateAnnualTaxReportXlsx, generateAnnualTaxReportCsv } from '../services/exportService';

interface DeclaracaoAnualViewProps {
    portfolioData: Asset[];
    irInfo: Record<string, IrInfo>;
    loadingInfo: boolean;
    error: string | null;
}

const DeclaracaoAnualView: React.FC<DeclaracaoAnualViewProps> = ({ portfolioData, irInfo, loadingInfo, error }) => {
    const [year, setYear] = useState(new Date().getFullYear() - 1);
    const [copiedTicker, setCopiedTicker] = useState<string | null>(null);
    const { formatCurrency, convertValue } = useCurrency();

    const handleCopyToClipboard = (text: string, ticker: string) => {
        navigator.clipboard.writeText(text);
        setCopiedTicker(ticker);
        setTimeout(() => setCopiedTicker(null), 2000);
    };

    const assetsByGroup = useMemo(() => {
        const grouped: { [group: string]: Asset[] } = {};
        portfolioData.forEach(asset => {
            const groupName = irInfo[asset.categoria]?.group || 'Outros Bens e Direitos';
            if (!grouped[groupName]) {
                grouped[groupName] = [];
            }
            grouped[groupName].push(asset);
        });
        return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
    }, [portfolioData, irInfo]);

    const totalAcquisitionCost = useMemo(() => {
        return portfolioData.reduce((sum, asset) => sum + (asset.precoCompra * asset.quantidade), 0);
    }, [portfolioData]);

    const handleDownload = (format: 'pdf' | 'xlsx' | 'csv') => {
        switch (format) {
            case 'pdf':
                generateAnnualTaxReportPdf(portfolioData, irInfo, year);
                break;
            case 'xlsx':
                generateAnnualTaxReportXlsx(portfolioData, irInfo, year);
                break;
            case 'csv':
                generateAnnualTaxReportCsv(portfolioData, irInfo, year);
                break;
        }
    };
    
    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-6 md:mb-8">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-2">Declaração Anual de IR</h1>
                <p className="text-base md:text-lg text-slate-500 dark:text-slate-400">Consolide as informações da sua carteira para a declaração de "Bens e Direitos".</p>
            </header>
            
            <div className="flex flex-col md:flex-row gap-6 mb-8 p-6 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg items-center justify-between">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div>
                        <label htmlFor="year" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Ano-Calendário</label>
                        <select id="year" value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500">
                            <option>{new Date().getFullYear() - 1}</option>
                            <option>{new Date().getFullYear() - 2}</option>
                            <option>{new Date().getFullYear() - 3}</option>
                        </select>
                    </div>
                    <div className="sm:border-l sm:pl-4 sm:ml-4 border-slate-200 dark:border-slate-700">
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Exportar Relatório</label>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleDownload('pdf')} title="Baixar PDF" className="p-2.5 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"><Download className="h-5 w-5" /></button>
                            <button onClick={() => handleDownload('xlsx')} title="Baixar XLSX" className="p-2.5 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition-colors"><Download className="h-5 w-5" /></button>
                            <button onClick={() => handleDownload('csv')} title="Baixar CSV" className="p-2.5 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"><Download className="h-5 w-5" /></button>
                        </div>
                    </div>
                </div>
                <div className="text-center md:text-right">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Custo Total de Aquisição</p>
                    <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">{formatCurrency(convertValue(totalAcquisitionCost))}</p>
                </div>
            </div>

            {error && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-red-600 dark:text-red-400 bg-red-500/10 rounded-lg">
                    <AlertTriangle className="h-10 w-10 mb-4" />
                    <h3 className="text-xl font-bold">Erro ao Carregar Dados</h3>
                    <p>{error}</p>
                </div>
            )}

            {loadingInfo && (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                    <p className="ml-4 text-slate-500 dark:text-slate-400">Buscando informações da Receita Federal com IA...</p>
                </div>
            )}
            
            {!loadingInfo && !error && assetsByGroup.length === 0 && (
                 <div className="text-center py-20 text-slate-500 dark:text-slate-400">
                    <FileText className="h-16 w-16 mx-auto mb-4" />
                    <p className="font-semibold text-lg">Nenhum ativo na carteira</p>
                    <p>Adicione seus ativos para ver o resumo da declaração.</p>
                </div>
            )}

            {!loadingInfo && !error && assetsByGroup.map(([groupName, assets]) => (
                <div key={groupName} className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 pb-2 mb-4 border-b border-slate-200 dark:border-slate-700">{groupName}</h2>
                    <div className="space-y-4">
                        {assets.map(asset => {
                            const info = irInfo[asset.categoria];
                            const custoTotal = asset.precoCompra * asset.quantidade;
                            const descriptionTemplate = info?.description || "[TICKER] - [QUANTIDADE] unidades adquiridas ao custo total de [CUSTO_TOTAL].";
                            const finalDescription = descriptionTemplate
                                .replace(/\[TICKER\]/g, asset.ticker)
                                .replace(/\[NOME_EMPRESA\]/g, asset.nome)
                                .replace(/\[QUANTIDADE\]/g, asset.quantidade.toLocaleString('pt-BR', {maximumFractionDigits: 6}))
                                .replace(/\[CUSTO_TOTAL\]/g, `R$ ${custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`) // Keep BRL for official document text
                                .replace(/\[CORRETORA\]/g, asset.corretora);

                            return (
                                <div key={asset.id} className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{asset.ticker} - {asset.nome}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Código: <span className="font-semibold">{info?.code || 'N/A'}</span></p>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-4">
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Situação em 31/12/{year}</p>
                                            <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{formatCurrency(convertValue(custoTotal))}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-900/70 rounded-lg">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Discriminação</label>
                                            <button onClick={() => handleCopyToClipboard(finalDescription, asset.ticker)} className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300">
                                                {copiedTicker === asset.ticker ? <Check className="h-4 w-4 text-emerald-500"/> : <Clipboard className="h-3 w-3"/>}
                                                {copiedTicker === asset.ticker ? 'Copiado!' : 'Copiar'}
                                            </button>
                                        </div>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 font-mono">{finalDescription}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DeclaracaoAnualView;