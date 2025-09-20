export interface SearchResult {
    id: string;
    ticker: string;
    name: string;
    type: 'Stock' | 'Fund' | 'Futures' | 'Forex' | 'Crypto' | 'Index' | 'Bond' | 'Economy' | 'Options';
    assetClass: string;
    exchange: string;
    exchangeLogo: string;
    icon: string;
}

export const mockSearchResults: SearchResult[] = [
    { id: '1', ticker: 'XRPUSD', name: 'XRP / US DOLLAR', type: 'Crypto', assetClass: 'spot crypto', exchange: 'BINANCE', exchangeLogo: 'B', icon: 'X' },
    { id: '2', ticker: 'XRP', name: 'MARKET CAP XRP, $', type: 'Crypto', assetClass: 'index crypto', exchange: 'CRYPTOCAP', exchangeLogo: 'C', icon: 'X' },
    { id: '3', ticker: 'VLID3', name: 'VALID SOLUCOES SA', type: 'Stock', assetClass: 'stock', exchange: 'BMFBOVESPA', exchangeLogo: 'B3', icon: 'V' },
    { id: '4', ticker: 'MELANIAUSDT', name: 'MELANIA MEME/TETHER', type: 'Crypto', assetClass: 'spot crypto', exchange: 'GATEIO', exchangeLogo: 'G', icon: 'M' },
    { id: '5', ticker: 'TRUMPUSDT', name: 'OFFICIAL TRUMP / USDT', type: 'Crypto', assetClass: 'spot crypto', exchange: 'MEXC', exchangeLogo: 'M', icon: 'T' },
    { id: '6', ticker: 'BTCBRL', name: 'BITCOIN / BRL', type: 'Crypto', assetClass: 'spot crypto', exchange: 'BINANCE', exchangeLogo: 'B', icon: '?' },
    { id: '7', ticker: 'XRPBRL', name: 'XRP / BRL', type: 'Crypto', assetClass: 'spot crypto', exchange: 'BINANCE', exchangeLogo: 'B', icon: 'X' },
    { id: '8', ticker: 'BOVA11', name: 'ISHARES IBOVESPA FUNDO DE INDICE', type: 'Fund', assetClass: 'fund etf', exchange: 'BMFBOVESPA', exchangeLogo: 'B3', icon: 'i' },
    { id: '9', ticker: 'BOVA', name: 'ISHARES IBOVESPA FUNDO DE INDICE', type: 'Fund', assetClass: 'fund etf', exchange: 'BMFBOVESPA', exchangeLogo: 'B3', icon: 'i' },
    { id: '10', ticker: 'MXRF11', name: 'MAXI RENDA FUNDO DE INVESTIMENTO IMOBILIARIO CO...', type: 'Fund', assetClass: 'fund closedend', exchange: 'BMFBOVESPA', exchangeLogo: 'B3', icon: 'H' },
    { id: '11', ticker: 'CROUSD', name: 'CRONOS / US DOLLAR', type: 'Crypto', assetClass: 'spot crypto', exchange: 'COINBASE', exchangeLogo: 'C', icon: 'C' },
    { id: '12', ticker: 'XAUUSD', name: 'GOLD', type: 'Forex', assetClass: 'commodity cfd', exchange: 'OANDA', exchangeLogo: 'O', icon: 'G' },
    { id: '13', ticker: 'NQ', name: 'E-MINI NASDAQ-100 FUTURES', type: 'Futures', assetClass: 'futures', exchange: 'CME', exchangeLogo: 'CME', icon: '>100' },
    { id: '14', ticker: 'BTCUSDT', name: 'BITCOIN / TETHERUS', type: 'Crypto', assetClass: 'spot crypto', exchange: 'Binance', exchangeLogo: 'B', icon: '?' },
    { id: '15', ticker: 'AAPL', name: 'APPLE INC', type: 'Stock', assetClass: 'stock', exchange: 'NASDAQ', exchangeLogo: 'NSDQ', icon: 'A' },
    { id: '16', ticker: 'GOOGL', name: 'ALPHABET INC', type: 'Stock', assetClass: 'stock', exchange: 'NASDAQ', exchangeLogo: 'NSDQ', icon: 'G' },
    { id: '17', ticker: 'PETR4', name: 'PETROBRAS', type: 'Stock', assetClass: 'stock', exchange: 'BMFBOVESPA', exchangeLogo: 'B3', icon: 'P' },
    { id: '18', ticker: 'IBOV', name: 'IBOVESPA INDEX', type: 'Index', assetClass: 'index', exchange: 'BMFBOVESPA', exchangeLogo: 'B3', icon: 'I' },
    { id: '19', ticker: 'EURUSD', name: 'EURO / US DOLLAR', type: 'Forex', assetClass: 'forex', exchange: 'FXCM', exchangeLogo: 'F', icon: '€' },
];
