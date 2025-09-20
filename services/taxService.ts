import { SimulatedSale, TaxSummary } from '../types';

const TAX_RATE_ACOES = 0.15;
const TAX_RATE_FIIS = 0.20;
const TAX_RATE_CRIPTO = 0.15;
const EXEMPTION_ACOES = 20000;
const EXEMPTION_CRIPTO = 35000;

export const calculateMonthlyTax = (sales: SimulatedSale[]): TaxSummary => {
    const summary: TaxSummary = {
        totalSalesAcoes: 0,
        totalSalesFiis: 0,
        totalSalesCripto: 0,
        profitAcoes: 0,
        profitFiis: 0,
        profitCripto: 0,
        taxableProfitAcoes: 0,
        taxableProfitFiis: 0,
        taxableProfitCripto: 0,
        taxDue: 0,
    };

    sales.forEach(sale => {
        const saleValue = sale.quantity * sale.salePrice;
        if (['Ações', 'Bancos'].includes(sale.assetCategory)) {
            summary.totalSalesAcoes += saleValue;
            summary.profitAcoes += sale.profit;
        } else if (sale.assetCategory === 'FIIs') {
            summary.totalSalesFiis += saleValue;
            summary.profitFiis += sale.profit;
        } else if (sale.assetCategory === 'Cripto') {
            summary.totalSalesCripto += saleValue;
            summary.profitCripto += sale.profit;
        }
    });

    // Calculate taxable profit
    if (summary.totalSalesAcoes > EXEMPTION_ACOES && summary.profitAcoes > 0) {
        summary.taxableProfitAcoes = summary.profitAcoes;
    }
    if (summary.profitFiis > 0) {
        summary.taxableProfitFiis = summary.profitFiis; // No exemption for FIIs
    }
    if (summary.totalSalesCripto > EXEMPTION_CRIPTO && summary.profitCripto > 0) {
        summary.taxableProfitCripto = summary.profitCripto;
    }
    
    // Calculate total tax due
    const taxAcoes = summary.taxableProfitAcoes * TAX_RATE_ACOES;
    const taxFiis = summary.taxableProfitFiis * TAX_RATE_FIIS;
    const taxCripto = summary.taxableProfitCripto * TAX_RATE_CRIPTO;
    summary.taxDue = taxAcoes + taxFiis + taxCripto;

    return summary;
};