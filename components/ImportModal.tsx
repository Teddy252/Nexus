import React, { useState, useCallback } from 'react';
import { Asset } from '../types';
import * as XLSX from 'xlsx';
import { X, UploadCloud, Loader2, AlertTriangle, CheckCircle, Bot } from 'lucide-react';
import { extractAssetsFromFileContent } from '../services/geminiService';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (assets: Asset[]) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Processando arquivo...');

    const resetState = () => {
        setFile(null);
        setPreviewData([]);
        setIsLoading(false);
        setError(null);
        setLoadingMessage('Processando arquivo...');
    };

    const handleClose = () => {
        resetState();
        onClose();
    };
    
    const enrichAndFinalizeAssets = (aiAssets: Partial<Asset>[]): { validAssets: Asset[], error: string | null } => {
        if (!aiAssets || aiAssets.length === 0) {
            return { validAssets: [], error: "A IA não encontrou nenhum ativo válido no arquivo." };
        }
        
        const validAssets: Asset[] = [];
        aiAssets.forEach((asset, index) => {
            const { ticker, quantidade, precoCompra } = asset;

            if (!ticker || typeof quantidade === 'undefined' || typeof precoCompra === 'undefined') {
                console.warn(`Ativo da IA na posição ${index} ignorado por falta de dados obrigatórios.`);
                return;
            }

            const quant = Number(quantidade);
            const preco = Number(precoCompra);

            if (isNaN(quant) || isNaN(preco) || quant <= 0 || preco < 0) {
                console.warn(`Ativo da IA na posição ${index} ignorado por valores numéricos inválidos.`);
                return;
            }

            const categoria = asset.categoria || 'Ações';
            const pais = asset.pais || (categoria === 'Cripto' ? 'Global' : 'Brasil');
            const newAsset: Asset = {
                id: Date.now() + index,
                ticker: String(ticker).toUpperCase(),
                nome: asset.nome || String(ticker).toUpperCase(),
                categoria: categoria,
                quantidade: quant,
                precoCompra: preco,
                cotacaoBase: preco,
                cotacaoAtual: preco,
                corretora: asset.corretora || 'N/A',
                pais: pais,
                moedaCompra: (pais === 'EUA' || categoria === 'Cripto') ? 'USD' : 'BRL',
                riskProfile: categoria === 'Cripto' ? 'Arriscado' : (['FIIs', 'Tesouro Direto'].includes(categoria) ? 'Seguro' : 'Moderado'),
                historicoPreco: Array(7).fill(preco),
                dividendYield: 0,
                order_index: index, // Temporary index, will be properly set in App.tsx
            };
            validAssets.push(newAsset);
        });
        
        return { validAssets, error: null };
    };


    const processFileWithAI = useCallback(async (selectedFile: File) => {
        if (!selectedFile) return;
        resetState();
        setFile(selectedFile);
        setIsLoading(true);
        setLoadingMessage('Analisando arquivo com IA...');

        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const fileContent = e.target?.result;
                let contentString: string;

                if (selectedFile.name.endsWith('.xlsx')) {
                    const workbook = XLSX.read(fileContent, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    contentString = JSON.stringify(jsonData);
                } else { // Assume CSV
                     contentString = fileContent as string;
                }
                
                if (contentString.trim().length === 0) {
                    throw new Error("O arquivo está vazio.");
                }

                setLoadingMessage('IA está extraindo os dados...');
                const aiResult = await extractAssetsFromFileContent(contentString);
                
                setLoadingMessage('Finalizando importação...');
                const { validAssets, error } = enrichAndFinalizeAssets(aiResult);
                
                if (error) {
                    setError(error);
                } else {
                    setPreviewData(validAssets);
                }

            } catch (err: any) {
                setError(`Falha ao processar o arquivo: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        reader.onerror = () => {
             setError("Não foi possível ler o arquivo.");
             setIsLoading(false);
        };
        
        if (selectedFile.name.endsWith('.xlsx')) {
            reader.readAsBinaryString(selectedFile);
        } else {
            reader.readAsText(selectedFile);
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFileWithAI(e.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFileWithAI(e.dataTransfer.files[0]);
        }
    };
    
    const handleImportClick = () => {
        onImport(previewData);
        handleClose();
    };

    if (!isOpen) return null;

    const renderContent = () => {
        if (isLoading) return (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-sky-500" />
                <p className="mt-4 text-slate-500 dark:text-slate-400">{loadingMessage}</p>
            </div>
        );

        if (error) return (
             <div className="flex flex-col items-center justify-center h-64 text-center bg-red-500/10 p-4 rounded-lg">
                <AlertTriangle className="h-12 w-12 text-red-500" />
                <p className="mt-4 font-semibold text-red-600 dark:text-red-400">Erro ao Importar</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{error}</p>
                <button onClick={resetState} className="mt-4 text-sm font-semibold text-sky-600 hover:underline">Tentar Novamente</button>
            </div>
        );

        if (previewData.length > 0) return (
             <div className="flex flex-col">
                <div className="flex items-center gap-3 p-3 mb-4 bg-emerald-500/10 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                    <div>
                        <p className="font-semibold text-emerald-700 dark:text-emerald-300">Arquivo processado com sucesso!</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">IA encontrou {previewData.length} ativos para importação.</p>
                    </div>
                </div>
                <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="sticky top-0 bg-slate-100 dark:bg-slate-700">
                            <tr>
                                <th className="p-2 font-medium text-slate-600 dark:text-slate-300">Ticker</th>
                                <th className="p-2 font-medium text-slate-600 dark:text-slate-300">Quantidade</th>
                                <th className="p-2 font-medium text-slate-600 dark:text-slate-300">Preço de Compra</th>
                                <th className="p-2 font-medium text-slate-600 dark:text-slate-300">Categoria</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {previewData.slice(0, 10).map(asset => ( // Show first 10 as preview
                            <tr key={asset.id} className="dark:text-slate-300">
                                <td className="p-2 font-semibold text-slate-800 dark:text-slate-200">{asset.ticker}</td>
                                <td className="p-2">{asset.quantidade.toLocaleString('pt-BR')}</td>
                                <td className="p-2">{`${asset.moedaCompra === 'USD' ? '$' : 'R$'} ${asset.precoCompra.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}</td>
                                <td className="p-2">{asset.categoria}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                {previewData.length > 10 && <p className="text-xs text-center mt-2 text-slate-500 dark:text-slate-400">Mostrando 10 de {previewData.length} ativos.</p>}
            </div>
        );

        return (
            <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                <label htmlFor="file-upload" className={`relative block w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragOver ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/50' : 'border-slate-300 dark:border-slate-600 hover:border-sky-400 dark:hover:border-sky-500'}`}>
                    <div className="flex flex-col items-center">
                        <Bot className="h-12 w-12 text-slate-400" />
                        <span className="mt-2 block font-semibold text-slate-800 dark:text-slate-200">Arraste seu arquivo de carteira</span>
                        <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">ou clique para selecionar</span>
                         <span className="mt-4 block text-xs text-slate-400">A IA identificará os dados automaticamente (.xlsx, .csv)</span>
                    </div>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
                </label>
                <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                    <p className="font-semibold mb-1 text-slate-600 dark:text-slate-300">Como funciona:</p>
                    <p>A IA irá ler seu arquivo e identificar as colunas de <code className="font-mono">ativo</code>, <code className="font-mono">quantidade</code> e <code className="font-mono">preço de compra</code>, mesmo que tenham nomes diferentes. Apenas garanta que essas informações estejam presentes.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col">
                <header className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Importação Inteligente</h2>
                    <button onClick={handleClose} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 rounded-full">
                        <X className="h-6 w-6" />
                    </button>
                </header>
                <main className="p-6">
                    {renderContent()}
                </main>
                <footer className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-xl">
                    <button type="button" onClick={handleClose} className="py-2 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg font-semibold text-slate-700 dark:text-slate-300 transition-colors">
                        Cancelar
                    </button>
                    <button 
                        type="button" 
                        onClick={handleImportClick}
                        disabled={previewData.length === 0 || isLoading}
                        className="py-2 px-5 bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Importar {previewData.length > 0 ? `(${previewData.length})` : ''}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ImportModal;