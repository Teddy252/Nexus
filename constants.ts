

import { Asset } from './types';

const generateRandomHistory = (basePrice: number): number[] => {
    return Array.from({ length: 7 }, (_, i) => basePrice * (1 + (Math.random() - 0.5) * (0.1 - i * 0.012)));
};

// Fix: By defining the array with an explicit type `Asset[]` before mapping,
// we provide a type context that prevents TypeScript from widening the `riskProfile`
// string literals to `string`, thus satisfying the stricter union type in `Asset`.
const initialData: Omit<Asset, 'historicoPreco' | 'cotacaoAtual'>[] = [
    { id: 1, ticker: "AZUL4", nome: "Azul SA", categoria: "Ações", quantidade: 25, precoCompra: 22.80, cotacaoBase: 8.50, corretora: "XP", pais: "Brasil", riskProfile: "Moderado", dividendYield: 0, alertActive: false },
    { id: 2, ticker: "IRBR3", nome: "IRB Brasil", categoria: "Ações", quantidade: 100, precoCompra: 6.38, cotacaoBase: 42.15, corretora: "Clear", pais: "Brasil", riskProfile: "Moderado", dividendYield: 0, alertActive: false },
    { id: 3, ticker: "BBSE3", nome: "BB Seguridade", categoria: "Bancos", quantidade: 50, precoCompra: 28.50, cotacaoBase: 33.23, corretora: "BTG", pais: "Brasil", riskProfile: "Moderado", dividendYield: 0.085, alertActive: false },
    { id: 4, ticker: "AAPL", nome: "Apple Inc.", categoria: "Ações", quantidade: 10, precoCompra: 852.5, cotacaoBase: 1118, corretora: "Avenue", pais: "EUA", riskProfile: "Moderado", dividendYield: 0.0055, alertActive: false },
    { id: 5, ticker: "HGBS11", nome: "Hedge Brasil Shopping", categoria: "FIIs", quantidade: 3, precoCompra: 204.60, cotacaoBase: 220.50, corretora: "Rico", pais: "Brasil", riskProfile: "Seguro", dividendYield: 0.09, alertActive: false },
    { id: 6, ticker: "BCFF11", nome: "BTG Fundo de Fundos", categoria: "FIIs", quantidade: 28, precoCompra: 89.16, cotacaoBase: 68.70, corretora: "Clear", pais: "Brasil", riskProfile: "Seguro", dividendYield: 0.10, alertActive: true },
    { id: 7, ticker: "BTC", nome: "Bitcoin", categoria: "Cripto", quantidade: 0.05, precoCompra: 142800, cotacaoBase: 353600, corretora: "Binance", pais: "Global", riskProfile: "Arriscado", dividendYield: 0, alertActive: true },
    { id: 8, ticker: "ETH", nome: "Ethereum", categoria: "Cripto", quantidade: 0.5, precoCompra: 9180, cotacaoBase: 18200, corretora: "Binance", pais: "Global", riskProfile: "Arriscado", dividendYield: 0, alertActive: false },
    { id: 9, ticker: "TESOURO SELIC 2029", nome: "Tesouro Selic", categoria: "Tesouro Direto", quantidade: 1.5, precoCompra: 13750, cotacaoBase: 14120, corretora: "Tesouro Direto", pais: "Brasil", riskProfile: "Seguro", dividendYield: 0, alertActive: false }
];

export const INITIAL_PORTFOLIO_DATA: Asset[] = initialData.map(asset => ({
    ...asset,
    historicoPreco: generateRandomHistory(asset.cotacaoBase),
    cotacaoAtual: asset.cotacaoBase,
}));


interface IrInfo {
    group: string;
    code: string;
    description: string;
}

export const IR_INFO_DATA: Record<string, IrInfo> = {
    'Ações': {
        group: '03 - Participações Societárias',
        code: '01 - Ações',
        description: '[QUANTIDADE] ações de [NOME_EMPRESA], ticker [TICKER], custodiadas na corretora [CORRETORA], ao custo total de [CUSTO_TOTAL].'
    },
    'Bancos': {
        group: '03 - Participações Societárias',
        code: '01 - Ações',
        description: '[QUANTIDADE] ações de [NOME_EMPRESA], ticker [TICKER], custodiadas na corretora [CORRETORA], ao custo total de [CUSTO_TOTAL].'
    },
    'FIIs': {
        group: '07 - Fundos',
        code: '03 - Fundos de Investimento Imobiliário (FIIs)',
        description: '[QUANTIDADE] cotas do FII [NOME_EMPRESA], ticker [TICKER], custodiadas na corretora [CORRETORA], ao custo total de [CUSTO_TOTAL].'
    },
    'Cripto': {
        group: '08 - Criptoativos',
        code: '01 - Criptoativo Bitcoin (BTC)',
        description: 'Posse de [QUANTIDADE] da criptomoeda [NOME_EMPRESA] ([TICKER]), custodiada na exchange [CORRETORA], ao valor de aquisição de [CUSTO_TOTAL].'
    },
    'Tesouro Direto': {
        group: '04 - Aplicações e Investimentos',
        code: '02 - Títulos públicos e privados sujeitos à tributação',
        description: '[QUANTIDADE] títulos de [NOME_EMPRESA] ([TICKER]), custodiados no [CORRETORA], ao custo total de [CUSTO_TOTAL].'
    }
};