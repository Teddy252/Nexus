export interface NewsItem {
    id: number;
    source: string;
    time: string;
    title: string;
    url: string;
}

export const mockNewsData: NewsItem[] = [
    { id: 1, source: "InfoMoney", time: "2h ago", title: "Ibovespa opera em alta com otimismo fiscal e avanço de commodities.", url: "#" },
    { id: 2, source: "Bloomberg", time: "3h ago", title: "Federal Reserve signals potential rate cuts later this year, market reacts positively.", url: "#" },
    { id: 3, source: "Valor Econômico", time: "5h ago", title: "Setor de varejo apresenta recuperação e projeta crescimento para o próximo trimestre.", url: "#" },
    { id: 4, source: "Reuters", time: "8h ago", title: "Tech stocks surge as new AI developments are announced by major players.", url: "#" },
    { id: 5, source: "CriptoFácil", time: "1d ago", title: "Bitcoin price stabilizes above $65,000 after a volatile week.", url: "#" },
];