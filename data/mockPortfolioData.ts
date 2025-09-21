import { Asset } from '../types';

// Helper to generate a 7-day price history around a given price
const generatePriceHistory = (currentPrice: number): number[] => {
    const history: number[] = [];
    let price = currentPrice * (1 + (Math.random() - 0.5) * 0.1); // Start ~10% away
    for (let i = 0; i < 7; i++) {
        history.push(parseFloat(price.toFixed(2)));
        const volatility = 0.03; // 3% daily volatility
        price *= 1 + (Math.random() - 0.5) * volatility;
    }
    history[6] = currentPrice; // Ensure the last price is the current price
    return history;
};

const mockAssets: Omit<Asset, 'id' | 'order_index' | 'historicoPreco'>[] = [
  // Ações Brasil
  { ticker: 'PETR4', nome: 'Petrobras', categoria: 'Ações', pais: 'Brasil', quantidade: 100, precoCompra: 35.50, cotacaoAtual: 38.20, corretora: 'XP Investimentos', riskProfile: 'Moderado', dividendYield: 0.12, cotacaoBase: 37.90 },
  { ticker: 'VALE3', nome: 'Vale S.A.', categoria: 'Ações', pais: 'Brasil', quantidade: 50, precoCompra: 65.00, cotacaoAtual: 61.50, corretora: 'BTG Pactual', riskProfile: 'Moderado', dividendYield: 0.08, cotacaoBase: 61.80 },
  { ticker: 'ITUB4', nome: 'Itaú Unibanco', categoria: 'Bancos', pais: 'Brasil', quantidade: 200, precoCompra: 30.10, cotacaoAtual: 32.40, corretora: 'Clear', riskProfile: 'Seguro', dividendYield: 0.06, cotacaoBase: 32.30 },
  { ticker: 'MGLU3', nome: 'Magazine Luiza', categoria: 'Ações', pais: 'Brasil', quantidade: 1000, precoCompra: 2.50, cotacaoAtual: 1.80, corretora: 'Rico', riskProfile: 'Arriscado', dividendYield: 0.00, cotacaoBase: 1.85 },
  { ticker: 'WEGE3', nome: 'WEG S.A.', categoria: 'Ações', pais: 'Brasil', quantidade: 75, precoCompra: 40.00, cotacaoAtual: 42.10, corretora: 'XP Investimentos', riskProfile: 'Moderado', dividendYield: 0.015, cotacaoBase: 41.90 },
  { ticker: 'BBDC4', nome: 'Bradesco', categoria: 'Bancos', pais: 'Brasil', quantidade: 150, precoCompra: 15.20, cotacaoAtual: 14.90, corretora: 'Ágora', riskProfile: 'Seguro', dividendYield: 0.07, cotacaoBase: 14.95 },
  { ticker: 'ABEV3', nome: 'Ambev', categoria: 'Ações', pais: 'Brasil', quantidade: 300, precoCompra: 14.00, cotacaoAtual: 13.50, corretora: 'BTG Pactual', riskProfile: 'Seguro', dividendYield: 0.05, cotacaoBase: 13.60 },
  { ticker: 'SUZB3', nome: 'Suzano Papel e Celulose', categoria: 'Ações', pais: 'Brasil', quantidade: 80, precoCompra: 55.00, cotacaoAtual: 58.90, corretora: 'XP Investimentos', riskProfile: 'Moderado', dividendYield: 0.03, cotacaoBase: 58.50 },
  { ticker: 'RENT3', nome: 'Localiza', categoria: 'Ações', pais: 'Brasil', quantidade: 120, precoCompra: 60.00, cotacaoAtual: 63.25, corretora: 'Rico', riskProfile: 'Moderado', dividendYield: 0.02, cotacaoBase: 63.00 },
  { ticker: 'JBSS3', nome: 'JBS', categoria: 'Ações', pais: 'Brasil', quantidade: 250, precoCompra: 28.00, cotacaoAtual: 26.70, corretora: 'Clear', riskProfile: 'Arriscado', dividendYield: 0.09, cotacaoBase: 26.80 },

  // FIIs
  { ticker: 'MXRF11', nome: 'Maxi Renda FII', categoria: 'FIIs', pais: 'Brasil', quantidade: 500, precoCompra: 10.50, cotacaoAtual: 10.80, corretora: 'BTG Pactual', riskProfile: 'Seguro', dividendYield: 0.11, cotacaoBase: 10.78 },
  { ticker: 'HGLG11', nome: 'CSHG Logística FII', categoria: 'FIIs', pais: 'Brasil', quantidade: 30, precoCompra: 160.00, cotacaoAtual: 165.40, corretora: 'XP Investimentos', riskProfile: 'Seguro', dividendYield: 0.09, cotacaoBase: 165.00 },
  { ticker: 'BCFF11', nome: 'BTG Pactual Fundo de Fundos', categoria: 'FIIs', pais: 'Brasil', quantidade: 100, precoCompra: 70.00, cotacaoAtual: 68.90, corretora: 'BTG Pactual', riskProfile: 'Seguro', dividendYield: 0.10, cotacaoBase: 69.00 },
  { ticker: 'VISC11', nome: 'Vinci Shopping Centers FII', categoria: 'FIIs', pais: 'Brasil', quantidade: 80, precoCompra: 115.00, cotacaoAtual: 118.30, corretora: 'Rico', riskProfile: 'Moderado', dividendYield: 0.08, cotacaoBase: 118.00 },
  { ticker: 'KNCR11', nome: 'Kinea Rendimentos Imobiliários', categoria: 'FIIs', pais: 'Brasil', quantidade: 60, precoCompra: 102.00, cotacaoAtual: 101.50, corretora: 'Clear', riskProfile: 'Seguro', dividendYield: 0.12, cotacaoBase: 101.60 },

  // Ações EUA
  { ticker: 'AAPL', nome: 'Apple Inc.', categoria: 'Ações', pais: 'EUA', quantidade: 10, precoCompra: 170.00, cotacaoAtual: 195.50, corretora: 'Avenue', riskProfile: 'Moderado', dividendYield: 0.005, cotacaoBase: 194.80 },
  { ticker: 'GOOGL', nome: 'Alphabet Inc.', categoria: 'Ações', pais: 'EUA', quantidade: 15, precoCompra: 130.00, cotacaoAtual: 155.20, corretora: 'Avenue', riskProfile: 'Moderado', dividendYield: 0.00, cotacaoBase: 154.90 },
  { ticker: 'MSFT', nome: 'Microsoft Corporation', categoria: 'Ações', pais: 'EUA', quantidade: 8, precoCompra: 300.00, cotacaoAtual: 340.80, corretora: 'Nomad', riskProfile: 'Seguro', dividendYield: 0.007, cotacaoBase: 339.90 },
  { ticker: 'AMZN', nome: 'Amazon.com, Inc.', categoria: 'Ações', pais: 'EUA', quantidade: 12, precoCompra: 125.00, cotacaoAtual: 133.40, corretora: 'Avenue', riskProfile: 'Moderado', dividendYield: 0.00, cotacaoBase: 133.00 },
  { ticker: 'TSLA', nome: 'Tesla, Inc.', categoria: 'Ações', pais: 'EUA', quantidade: 5, precoCompra: 250.00, cotacaoAtual: 215.60, corretora: 'Passfolio', riskProfile: 'Arriscado', dividendYield: 0.00, cotacaoBase: 216.10 },
  { ticker: 'NVDA', nome: 'NVIDIA Corporation', categoria: 'Ações', pais: 'EUA', quantidade: 7, precoCompra: 400.00, cotacaoAtual: 475.00, corretora: 'Avenue', riskProfile: 'Arriscado', dividendYield: 0.001, cotacaoBase: 472.00 },
  { ticker: 'JNJ', nome: 'Johnson & Johnson', categoria: 'Ações', pais: 'EUA', quantidade: 20, precoCompra: 160.00, cotacaoAtual: 162.30, corretora: 'Nomad', riskProfile: 'Seguro', dividendYield: 0.028, cotacaoBase: 162.00 },
  { ticker: 'KO', nome: 'The Coca-Cola Company', categoria: 'Ações', pais: 'EUA', quantidade: 30, precoCompra: 60.00, cotacaoAtual: 58.90, corretora: 'Avenue', riskProfile: 'Seguro', dividendYield: 0.03, cotacaoBase: 59.10 },
  { ticker: 'DIS', nome: 'The Walt Disney Company', categoria: 'Ações', pais: 'EUA', quantidade: 25, precoCompra: 100.00, cotacaoAtual: 85.50, corretora: 'Passfolio', riskProfile: 'Moderado', dividendYield: 0.01, cotacaoBase: 86.00 },
  { ticker: 'PFE', nome: 'Pfizer Inc.', categoria: 'Ações', pais: 'EUA', quantidade: 40, precoCompra: 35.00, cotacaoAtual: 33.20, corretora: 'Avenue', riskProfile: 'Seguro', dividendYield: 0.045, cotacaoBase: 33.30 },

  // Cripto
  { ticker: 'BTC', nome: 'Bitcoin', categoria: 'Cripto', pais: 'Global', quantidade: 0.05, precoCompra: 150000.00, cotacaoAtual: 340000.00, corretora: 'Binance', riskProfile: 'Arriscado', dividendYield: 0.00, cotacaoBase: 338000.00 },
  { ticker: 'ETH', nome: 'Ethereum', categoria: 'Cripto', pais: 'Global', quantidade: 1.2, precoCompra: 8000.00, cotacaoAtual: 18500.00, corretora: 'Mercado Bitcoin', riskProfile: 'Arriscado', dividendYield: 0.00, cotacaoBase: 18400.00 },
  { ticker: 'ADA', nome: 'Cardano', categoria: 'Cripto', pais: 'Global', quantidade: 5000, precoCompra: 1.50, cotacaoAtual: 1.35, corretora: 'Binance', riskProfile: 'Arriscado', dividendYield: 0.00, cotacaoBase: 1.36 },
  { ticker: 'SOL', nome: 'Solana', categoria: 'Cripto', pais: 'Global', quantidade: 100, precoCompra: 100.00, cotacaoAtual: 125.70, corretora: 'Coinbase', riskProfile: 'Arriscado', dividendYield: 0.00, cotacaoBase: 125.00 },
  { ticker: 'XRP', nome: 'Ripple', categoria: 'Cripto', pais: 'Global', quantidade: 2000, precoCompra: 2.50, cotacaoAtual: 2.10, corretora: 'Binance', riskProfile: 'Arriscado', dividendYield: 0.00, cotacaoBase: 2.12 },
  
  // Tesouro Direto
  { ticker: 'TESOURO SELIC 2029', nome: 'Tesouro Selic 2029', categoria: 'Tesouro Direto', pais: 'Brasil', quantidade: 1.5, precoCompra: 13000.00, cotacaoAtual: 13800.00, corretora: 'Tesouro Direto', riskProfile: 'Seguro', dividendYield: 0.00, cotacaoBase: 13750.00 },
  { ticker: 'TESOURO IPCA+ 2045', nome: 'Tesouro IPCA+ 2045', categoria: 'Tesouro Direto', pais: 'Brasil', quantidade: 2, precoCompra: 1200.00, cotacaoAtual: 1350.00, corretora: 'XP Investimentos', riskProfile: 'Seguro', dividendYield: 0.00, cotacaoBase: 1340.00 },
  { ticker: 'TESOURO PREFIXADO 2033', nome: 'Tesouro Prefixado 2033', categoria: 'Tesouro Direto', pais: 'Brasil', quantidade: 3, precoCompra: 500.00, cotacaoAtual: 560.00, corretora: 'BTG Pactual', riskProfile: 'Seguro', dividendYield: 0.00, cotacaoBase: 555.00 },
  
  // More diverse assets to reach 50
  { ticker: 'BBAS3', nome: 'Banco do Brasil', categoria: 'Bancos', pais: 'Brasil', quantidade: 180, precoCompra: 45.00, cotacaoAtual: 52.30, corretora: 'Clear', riskProfile: 'Seguro', dividendYield: 0.09, cotacaoBase: 52.00 },
  { ticker: 'GGBR4', nome: 'Gerdau', categoria: 'Ações', pais: 'Brasil', quantidade: 400, precoCompra: 25.00, cotacaoAtual: 22.80, corretora: 'Rico', riskProfile: 'Moderado', dividendYield: 0.06, cotacaoBase: 23.00 },
  { ticker: 'CPLE6', nome: 'Copel', categoria: 'Ações', pais: 'Brasil', quantidade: 500, precoCompra: 8.00, cotacaoAtual: 9.10, corretora: 'XP Investimentos', riskProfile: 'Moderado', dividendYield: 0.07, cotacaoBase: 9.00 },
  { ticker: 'HGRU11', nome: 'CSHG Renda Urbana FII', categoria: 'FIIs', pais: 'Brasil', quantidade: 70, precoCompra: 120.00, cotacaoAtual: 125.00, corretora: 'BTG Pactual', riskProfile: 'Moderado', dividendYield: 0.08, cotacaoBase: 124.50 },
  { ticker: 'XPML11', nome: 'XP Malls FII', categoria: 'FIIs', pais: 'Brasil', quantidade: 90, precoCompra: 105.00, cotacaoAtual: 110.00, corretora: 'XP Investimentos', riskProfile: 'Moderado', dividendYield: 0.075, cotacaoBase: 109.80 },
  { ticker: 'META', nome: 'Meta Platforms, Inc.', categoria: 'Ações', pais: 'EUA', quantidade: 10, precoCompra: 300.00, cotacaoAtual: 320.00, corretora: 'Avenue', riskProfile: 'Arriscado', dividendYield: 0.00, cotacaoBase: 318.00 },
  { ticker: 'NFLX', nome: 'Netflix, Inc.', categoria: 'Ações', pais: 'EUA', quantidade: 5, precoCompra: 400.00, cotacaoAtual: 380.00, corretora: 'Nomad', riskProfile: 'Arriscado', dividendYield: 0.00, cotacaoBase: 382.00 },
  { ticker: 'BA', nome: 'The Boeing Company', categoria: 'Ações', pais: 'EUA', quantidade: 15, precoCompra: 200.00, cotacaoAtual: 210.00, corretora: 'Passfolio', riskProfile: 'Arriscado', dividendYield: 0.00, cotacaoBase: 208.00 },
  { ticker: 'DOGE', nome: 'Dogecoin', categoria: 'Cripto', pais: 'Global', quantidade: 20000, precoCompra: 0.30, cotacaoAtual: 0.35, corretora: 'Binance', riskProfile: 'Arriscado', dividendYield: 0.00, cotacaoBase: 0.34 },
  { ticker: 'DOT', nome: 'Polkadot', categoria: 'Cripto', pais: 'Global', quantidade: 300, precoCompra: 20.00, cotacaoAtual: 18.50, corretora: 'Coinbase', riskProfile: 'Arriscado', dividendYield: 0.00, cotacaoBase: 18.60 },
  { ticker: 'B3SA3', nome: 'B3 S.A.', categoria: 'Ações', pais: 'Brasil', quantidade: 350, precoCompra: 13.00, cotacaoAtual: 14.10, corretora: 'XP Investimentos', riskProfile: 'Moderado', dividendYield: 0.04, cotacaoBase: 14.00 },
  { ticker: 'CSNA3', nome: 'CSN', categoria: 'Ações', pais: 'Brasil', quantidade: 600, precoCompra: 12.50, cotacaoAtual: 11.90, corretora: 'Rico', riskProfile: 'Arriscado', dividendYield: 0.08, cotacaoBase: 12.00 },
  { ticker: 'VTI', nome: 'Vanguard Total Stock Market ETF', categoria: 'Ações', pais: 'EUA', quantidade: 20, precoCompra: 200.00, cotacaoAtual: 220.00, corretora: 'Avenue', riskProfile: 'Seguro', dividendYield: 0.015, cotacaoBase: 219.00 },
  { ticker: 'VXUS', nome: 'Vanguard Total International Stock ETF', categoria: 'Ações', pais: 'Global', quantidade: 30, precoCompra: 55.00, cotacaoAtual: 58.00, corretora: 'Nomad', riskProfile: 'Seguro', dividendYield: 0.025, cotacaoBase: 57.80 },
  { ticker: 'BND', nome: 'Vanguard Total Bond Market ETF', categoria: 'Tesouro Direto', pais: 'EUA', quantidade: 25, precoCompra: 75.00, cotacaoAtual: 73.50, corretora: 'Avenue', riskProfile: 'Seguro', dividendYield: 0.02, cotacaoBase: 73.60 },
];

export const mockPortfolioData: Asset[] = mockAssets.map((asset, index) => ({
    ...asset,
    id: index + 1,
    order_index: index,
    historicoPreco: generatePriceHistory(asset.cotacaoAtual),
}));