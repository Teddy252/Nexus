import * as XLSX from 'xlsx';
import { Asset } from '../types';
import { InvestorProfile, IrInfo } from '../types';

// Helper function to prepare data for export
const prepareDataForExport = (portfolio: Asset[], totalValue: number) => {
    return portfolio.map(asset => ({
        'Ativo (Ticker)': asset.ticker,
        'Nome': asset.nome,
        'Categoria': asset.categoria,
        'Alocação (%)': ((asset.precoCompra * asset.quantidade) / totalValue) * 100,
        'Valor Simulado (R$)': asset.precoCompra * asset.quantidade,
    }));
};

const downloadFile = (buffer: any, fileName: string, mimeType: string) => {
    const data = new Blob([buffer], { type: mimeType });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const generateModelPortfolioXlsx = (portfolio: Asset[], profile: InvestorProfile) => {
    if (!profile) return;
    const totalValue = portfolio.reduce((sum, asset) => sum + asset.precoCompra * asset.quantidade, 0);
    const data = prepareDataForExport(portfolio, totalValue);
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Carteira Modelo');

    // Adjust column widths
    worksheet['!cols'] = [
        { wch: 20 }, // Ativo
        { wch: 30 }, // Nome
        { wch: 20 }, // Categoria
        { wch: 15 }, // Alocação
        { wch: 20 }, // Valor
    ];
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    downloadFile(excelBuffer, `carteira_modelo_${profile.toLowerCase()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
};

export const generateModelPortfolioCsv = (portfolio: Asset[], profile: InvestorProfile) => {
    if (!profile) return;
    const totalValue = portfolio.reduce((sum, asset) => sum + asset.precoCompra * asset.quantidade, 0);
    const data = prepareDataForExport(portfolio, totalValue);

    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput: string = XLSX.utils.sheet_to_csv(worksheet);
    
    downloadFile(`\uFEFF${csvOutput}`, `carteira_modelo_${profile.toLowerCase()}.csv`, 'text/csv;charset=utf-8;');
};

// Helper for tax reports
const prepareTaxDataForExport = (portfolio: Asset[], irInfo: Record<string, IrInfo>, year: number) => {
    return portfolio.map(asset => {
        const info = irInfo[asset.categoria];
        const custoTotal = asset.precoCompra * asset.quantidade;
        const descriptionTemplate = info?.description || "[TICKER] - [QUANTIDADE] unidades adquiridas ao custo total de [CUSTO_TOTAL].";
        const finalDescription = descriptionTemplate
            .replace(/\[TICKER\]/g, asset.ticker)
            .replace(/\[NOME_EMPRESA\]/g, asset.nome)
            .replace(/\[QUANTIDADE\]/g, asset.quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 6 }))
            .replace(/\[CUSTO_TOTAL\]/g, `R$ ${custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
            .replace(/\[CORRETORA\]/g, asset.corretora);
            
        return {
            'Grupo': info?.group || 'Outros Bens e Direitos',
            'Código': info?.code || 'N/A',
            'Ticker': asset.ticker,
            'Nome': asset.nome,
            'Discriminação': finalDescription,
            [`Situação em 31/12/${year} (R$)`]: custoTotal,
        };
    });
};

export const generateAnnualTaxReportXlsx = (portfolio: Asset[], irInfo: Record<string, IrInfo>, year: number) => {
    const data = prepareTaxDataForExport(portfolio, irInfo, year);
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Bens e Direitos ${year}`);

    // Adjust column widths
    worksheet['!cols'] = [
        { wch: 30 }, // Grupo
        { wch: 10 }, // Código
        { wch: 15 }, // Ticker
        { wch: 30 }, // Nome
        { wch: 100 }, // Discriminação
        { wch: 20 }, // Situação
    ];
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    downloadFile(excelBuffer, `relatorio_bens_e_direitos_${year}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
};

export const generateAnnualTaxReportCsv = (portfolio: Asset[], irInfo: Record<string, IrInfo>, year: number) => {
    const data = prepareTaxDataForExport(portfolio, irInfo, year);
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput: string = XLSX.utils.sheet_to_csv(worksheet);
    
    downloadFile(`\uFEFF${csvOutput}`, `relatorio_bens_e_direitos_${year}.csv`, 'text/csv;charset=utf-8;');
};