import { GoogleGenAI, Type } from "@google/genai";
import { Asset, AiAnalysis, NewsItem, AiOptimizationAnalysis, SimulatedSale, TaxSummary, OptimizationStrategy, Message, InvestorProfile } from '../types.ts';

// Robust check for API_KEY to prevent crashing the app.
const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.error("FATAL: API_KEY environment variable not set. AI features will be disabled.");
}

const assetDetailsSchema = {
    type: Type.OBJECT,
    properties: {
        nome: { type: Type.STRING, description: "O nome completo oficial do ativo." },
        categoria: { type: Type.STRING, description: "A categoria do ativo. Ex: 'Ações', 'FIIs', 'Cripto', 'Tesouro Direto', 'Bancos'." },
        pais: { type: Type.STRING, description: "O país de origem do ativo. Ex: 'Brasil', 'EUA', 'Global'." },
        cotacaoAtual: { type: Type.NUMBER, description: "O preço de mercado atual aproximado do ativo." },
        moedaCotacao: { type: Type.STRING, description: "A moeda da cotação atual. Deve ser 'BRL' para ativos brasileiros ou 'USD' para ativos dos EUA e Cripto." },
    },
    required: ["nome", "categoria", "pais", "cotacaoAtual", "moedaCotacao"],
};

const throwErrorIfAiDisabled = () => {
    if (!ai) {
        throw new Error("O serviço de IA não está disponível. Verifique se a chave de API está configurada corretamente no ambiente de deploy.");
    }
}

export const getAssetDetails = async (ticker: string) => {
    throwErrorIfAiDisabled();
    const prompt = `
        Analise o código de ativo financeiro (ticker) a seguir: '${ticker}'.
        O ativo pode ser uma ação (ex: PETR4, AAPL), um Fundo Imobiliário (FII, ex: MXRF11), um criptoativo (ex: BTC, ETH, XRP), ou um título do Tesouro Direto.
        
        Sua tarefa é fornecer as seguintes informações:
        1.  **nome**: O nome completo e oficial do ativo. Para criptoativos, use o nome da criptomoeda (ex: Bitcoin, Ripple, Ethereum).
        2.  **categoria**: A categoria mais apropriada. Escolha uma das seguintes opções: 'Ações', 'FIIs', 'Cripto', 'Tesouro Direto', 'Bancos'. Para '${ticker}', qual é a melhor categoria?
        3.  **pais**: O país de origem. Para ações brasileiras, 'Brasil'. Para ações americanas, 'EUA'. Para criptoativos, use 'Global'.
        4.  **cotacaoAtual**: O preço de mercado atual e aproximado do ativo.
        5.  **moedaCotacao**: A moeda em que a 'cotacaoAtual' está expressa. Deve ser 'USD' para ativos dos EUA e Criptoativos. Deve ser 'BRL' para ativos do Brasil.

        Responda em português do Brasil.
    `;
    const response = await ai!.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: assetDetailsSchema,
        },
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

const brokerageSchema = {
    type: Type.OBJECT,
    properties: {
        brokerages: {
            type: Type.ARRAY,
            description: "Uma lista de nomes de corretoras.",
            items: { type: Type.STRING },
        },
    },
};

export const getBrokerageSuggestions = async (country: string): Promise<string[]> => {
    throwErrorIfAiDisabled();
    const prompt = `Liste as 5 corretoras de investimentos mais populares no seguinte país: ${country}. Responda em português do Brasil.`;
    try {
        const response = await ai!.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: brokerageSchema,
            },
        });
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText) as { brokerages: string[] };
        return parsed.brokerages || [];
    } catch (error) {
        console.error("Error fetching brokerage suggestions:", error);
        return [];
    }
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "Um resumo conciso da saúde geral do portfólio, com um tom ligeiramente sarcástico." },
        topPerformers: {
            type: Type.ARRAY,
            description: "Os 3 ativos com melhor desempenho com base no lucro percentual.",
            items: {
                type: Type.OBJECT,
                properties: {
                    ticker: { type: Type.STRING, description: "O ticker do ativo." },
                    reason: { type: Type.STRING, description: "Uma breve e espirituosa explicação do porquê é um dos melhores." },
                },
            },
        },
        worstPerformers: {
            type: Type.ARRAY,
            description: "Os 3 ativos com pior desempenho com base na perda percentual.",
            items: {
                type: Type.OBJECT,
                properties: {
                    ticker: { type: Type.STRING, description: "O ticker do ativo." },
                    reason: { type: Type.STRING, description: "Uma breve e espirituosa explicação do porquê é um dos piores." },
                },
            },
        },
        diversification: {
            type: Type.OBJECT,
            properties: {
                byCategory: { type: Type.STRING, description: "Análise da diversificação por categoria de ativo." },
                byCountry: { type: Type.STRING, description: "Análise da diversificação por país." },
            },
        },
        riskAnalysis: {
            type: Type.OBJECT,
            description: "Análise detalhada do risco do portfólio.",
            properties: {
                overallRiskLevel: { type: Type.STRING, description: "O nível de risco geral da carteira. Valores possíveis: 'Baixo', 'Moderado', 'Alto', 'Muito Alto'." },
                riskSummary: { type: Type.STRING, description: "Um resumo conciso da análise de risco da carteira." },
                riskFactors: {
                    type: Type.ARRAY,
                    description: "Uma lista dos 3 a 5 principais fatores que contribuem para o risco da carteira.",
                    items: { type: Type.STRING }
                },
            },
        },
        suggestions: {
            type: Type.ARRAY,
            description: "Uma lista de sugestões acionáveis e realistas para melhorar o portfólio.",
            items: { type: Type.STRING }
        },
        marketSentiment: { type: Type.STRING, description: "Uma análise do sentimento geral do mercado em relação aos ativos da carteira (otimista, pessimista, neutro) e por quê." },
        futuristicSuggestion: { type: Type.STRING, description: "Uma sugestão de investimento ousada e 'futurista', que pode ser especulativa mas é instigante." },
    },
};


export const getPortfolioAnalysis = async (portfolio: Asset[]): Promise<AiAnalysis> => {
    throwErrorIfAiDisabled();
    const simplifiedPortfolio = portfolio.map(({ ticker, nome, categoria, pais, precoCompra, cotacaoAtual, quantidade }) => ({
        ticker,
        nome,
        categoria,
        pais,
        custoTotal: precoCompra * quantidade,
        valorAtual: cotacaoAtual * quantidade,
    }));

    const prompt = `
        Aja como um analista financeiro sarcástico, porém brilhante.
        Analise o seguinte portfólio de investimentos de um investidor brasileiro.
        Sua resposta deve ser em português do Brasil, com um tom espirituoso, direto e inteligente.
        
        Forneça uma análise detalhada focando em:
        1.  Um resumo geral da saúde e composição do portfólio.
        2.  Os 3 ativos com melhor e pior desempenho percentual (não se segure nos comentários).
        3.  A qualidade da diversificação (ou falta dela) por categoria e geografia.
        4.  Análise de Risco: Avalie o risco geral da carteira (nível: 'Baixo', 'Moderado', 'Alto', 'Muito Alto'), forneça um resumo conciso e liste os principais fatores de risco (ex: concentração em um setor, volatilidade de criptoativos, exposição a uma única moeda).
        5.  Sugestões de melhoria (seja útil, apesar do sarcasmo).
        6.  Sentimento do mercado em relação aos ativos da carteira.
        7.  Uma sugestão de investimento "futurista" e ousada.

        Dados do Portfólio para sua análise cética:
        ${JSON.stringify(simplifiedPortfolio, null, 2)}
    `;

    const response = await ai!.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as AiAnalysis;
};

const optimizationSchema = {
    type: Type.OBJECT,
    properties: {
        strategySummary: { type: Type.STRING, description: 'Um resumo conciso e inteligente da estratégia de otimização proposta para o perfil de risco solicitado.' },
        suggestions: {
            type: Type.ARRAY,
            description: "Uma lista de ações (comprar, vender, manter) para otimizar o portfólio.",
            items: {
                type: Type.OBJECT,
                properties: {
                    action: { type: Type.STRING, description: "A ação a ser tomada: 'BUY', 'SELL' ou 'KEEP'." },
                    ticker: { type: Type.STRING, description: "O ticker do ativo." },
                    nome: { type: Type.STRING, description: "Nome completo do ativo. Essencial, especialmente se for um novo ativo." },
                    categoria: { type: Type.STRING, description: "Categoria do ativo (ex: Ações, FIIs, Cripto). Essencial se for um novo ativo." },
                    pais: { type: Type.STRING, description: "País de origem do ativo (ex: Brasil, EUA). Essencial se for um novo ativo." },
                    quantidade: { type: Type.NUMBER, description: "A quantidade a ser comprada, vendida ou mantida." },
                    precoAtual: { type: Type.NUMBER, description: "O preço de mercado atual aproximado do ativo. Essencial para novas compras." },
                    justificativa: { type: Type.STRING, description: "Uma explicação detalhada do porquê desta sugestão." },
                },
                required: ["action", "ticker", "nome", "categoria", "pais", "quantidade", "precoAtual", "justificativa"],
            },
        },
    },
};


export const getPortfolioOptimization = async (portfolio: Asset[], strategy: OptimizationStrategy): Promise<AiOptimizationAnalysis> => {
     throwErrorIfAiDisabled();
     const simplifiedPortfolio = portfolio.map(({ ticker, nome, categoria, pais, precoCompra, cotacaoAtual, quantidade, riskProfile }) => ({
        ticker,
        nome,
        categoria,
        pais,
        quantidade,
        risco: riskProfile,
        custoTotal: precoCompra * quantidade,
        valorAtual: cotacaoAtual * quantidade,
    }));
    
    const strategyExplanations: Record<OptimizationStrategy, string> = {
        'Conservador': 'Foco em preservação de capital, baixa volatilidade e geração de renda. Priorize ativos como títulos de renda fixa, FIIs de tijolo sólidos e ações de empresas grandes e estáveis que pagam dividendos (blue chips).',
        'Balanceado': 'Busca uma combinação equilibrada de crescimento e segurança. A carteira deve ser diversificada entre diferentes classes de ativos, incluindo ações de boas empresas, FIIs, ETFs e uma pequena parcela em ativos mais arriscados.',
        'Agressivo': 'Objetivo de maximizar o crescimento do capital, aceitando alta volatilidade e risco. Priorize ações de crescimento (growth stocks), small caps, criptoativos e outros ativos com alto potencial de valorização.'
    };
    
    const prompt = `
        Aja como um gestor de portfólio experiente e proativo.
        Analise o portfólio de investimentos de um investidor brasileiro e forneça um plano de otimização claro e acionável.
        O objetivo é rebalancear a carteira para um perfil "${strategy}".
        
        Descrição do perfil "${strategy}": ${strategyExplanations[strategy]}
        
        Sua resposta deve estar em português do Brasil e seguir estritamente o schema JSON.
        
        Para cada ativo no portfólio atual, decida se a ação é MANTER ('KEEP') ou VENDER ('SELL').
        Se for vender, especifique a quantidade a ser vendida (pode ser parcial ou total).
        
        Para melhorar o portfólio, sugira a COMPRA ('BUY') de novos ativos ou o aumento da posição em ativos existentes que se alinhem à estratégia.
        Para cada sugestão de COMPRA, forneça todos os dados necessários (ticker, nome, categoria, país, quantidade, preço atual).
        
        Cada sugestão, seja de compra, venda ou manutenção, deve ter uma justificativa clara e concisa, alinhada à estratégia ${strategy}.
        Finalize com um resumo da estratégia geral aplicada.

        Dados do Portfólio Atual:
        ${JSON.stringify(simplifiedPortfolio, null, 2)}
    `;

    const response = await ai!.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: optimizationSchema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as AiOptimizationAnalysis;
};

const dividendYieldSchema = {
    type: Type.OBJECT,
    properties: {
        dividendYield: { 
            type: Type.NUMBER, 
            description: "O dividend yield anual do ativo em formato percentual (ex: 5.42 para 5.42%). Se não for aplicável ou não for encontrado, o valor deve ser 0." 
        },
    },
    required: ["dividendYield"],
};

export const getDividendYield = async (ticker: string, country: string): Promise<number> => {
    throwErrorIfAiDisabled();
    const prompt = `Qual é o dividend yield anual para o ativo '${ticker}' do país '${country}'?`;

    try {
        const response = await ai!.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: dividendYieldSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText) as { dividendYield: number };
        return parsed.dividendYield || 0;
    } catch (error) {
        console.error("Error fetching dividend yield:", error);
        return 0;
    }
};

const newsSchema = {
    type: Type.OBJECT,
    properties: {
        news: {
            type: Type.ARRAY,
            description: "Uma lista de 5 a 10 notícias de mercado recentes e relevantes.",
            items: {
                type: Type.OBJECT,
                properties: {
                    source: { type: Type.STRING, description: "A fonte da notícia (ex: 'Bloomberg', 'InfoMoney')." },
                    title: { type: Type.STRING, description: "O título da notícia." },
                    url: { type: Type.STRING, description: "A URL para o artigo completo." },
                    summary: { type: Type.STRING, description: "Um resumo muito breve (1-2 frases) da notícia." },
                },
            },
        },
    },
};

export const getRelevantNews = async (query: string): Promise<NewsItem[]> => {
    throwErrorIfAiDisabled();
    const prompt = `
        Aja como um curador de notícias financeiras.
        Encontre de 5 a 10 das notícias mais recentes e relevantes (últimas 48 horas) sobre o seguinte tópico ou ativos: "${query}".
        Priorize notícias sobre desempenho de mercado, anúncios de empresas, mudanças regulatórias ou tendências do setor.
        Forneça a fonte, o título, um link válido e um resumo muito breve para cada notícia.
        Sua resposta deve ser em português do Brasil.
    `;

    try {
        const response = await ai!.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: newsSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText) as { news: NewsItem[] };
        return parsed.news || [];
    } catch (error) {
        console.error("Error fetching relevant news:", error);
        // Propagate the original error for specific handling in the UI
        throw error;
    }
};


export const generateAppIcon = async (prompt: string): Promise<string> => {
    throwErrorIfAiDisabled();
    try {
        const response = await ai!.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        } else {
            throw new Error("A IA não conseguiu gerar uma imagem.");
        }
    } catch (error) {
        console.error("Error generating image with AI:", error);
        throw new Error("Ocorreu um erro ao gerar o ícone. Verifique sua chave de API ou tente novamente mais tarde.");
    }
};

const taxExplanationSchema = {
    type: Type.OBJECT,
    properties: {
        explanation: { 
            type: Type.STRING, 
            description: "Uma explicação clara e concisa do cálculo do imposto de renda mensal sobre ganhos de capital para um investidor pessoa física no Brasil. Use markdown para formatação (negrito, listas)."
        },
    },
    required: ["explanation"],
};

export const getTaxExplanation = async (summary: TaxSummary, sales: SimulatedSale[]): Promise<string> => {
    throwErrorIfAiDisabled();
    const simplifiedSales = sales.map(s => ({
        ticker: s.asset.ticker,
        categoria: s.asset.categoria,
        quantidade: s.quantity,
        preco_venda_unitario: s.salePrice,
        lucro_total_operacao: s.profit,
    }));

    const prompt = `
        Aja como um contador especialista em imposto de renda para investidores no Brasil.
        Analise o resumo de vendas e impostos de um investidor para um determinado mês e forneça uma explicação clara e didática.
        Sua resposta deve ser em português do Brasil e usar markdown para formatação (negrito para ênfase, listas para detalhamento).
        
        A explicação deve cobrir os seguintes pontos:
        1.  Um resumo do imposto total devido.
        2.  Detalhar o cálculo para cada categoria de ativo (Ações, FIIs, Cripto).
        3.  Mencionar as regras de isenção e se foram aplicadas. Limite de isenção para Ações é de R$ 20.000,00 em vendas no mês (se o lucro for positivo). Limite para Cripto é de R$ 35.000,00. FIIs não têm isenção.
        4.  Explicar as alíquotas de imposto aplicadas (15% para Ações e Cripto sobre o lucro tributável, 20% para FIIs).
        5.  Concluir com uma observação sobre a importância de pagar o DARF até o último dia útil do mês seguinte.

        **Dados para Análise:**

        **Resumo do Mês:**
        - Imposto Total a Pagar: ${summary.taxDue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        - Total de Vendas em Ações: ${summary.totalSalesAcoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        - Total de Vendas em FIIs: ${summary.totalSalesFiis.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        - Total de Vendas em Cripto: ${summary.totalSalesCripto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        - Lucro Tributável em Ações: ${summary.taxableProfitAcoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        - Lucro Tributável em FIIs: ${summary.taxableProfitFiis.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        - Lucro Tributável em Cripto: ${summary.taxableProfitCripto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}

        **Detalhes das Vendas:**
        ${JSON.stringify(simplifiedSales, null, 2)}
    `;

    try {
        const response = await ai!.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: taxExplanationSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText) as { explanation: string };
        return parsed.explanation;
    } catch (error) {
        console.error("Error fetching tax explanation from AI:", error);
        throw new Error("A IA não conseguiu gerar a análise tributária. Tente novamente.");
    }
};

const assetExtractionSchema = {
    type: Type.OBJECT,
    properties: {
        assets: {
            type: Type.ARRAY,
            description: "Uma lista de ativos financeiros extraídos do arquivo.",
            items: {
                type: Type.OBJECT,
                properties: {
                    ticker: { type: Type.STRING, description: "O código (ticker) do ativo." },
                    quantidade: { type: Type.NUMBER, description: "A quantidade de cotas/unidades do ativo." },
                    precoCompra: { type: Type.NUMBER, description: "O preço médio de compra por unidade do ativo." },
                    nome: { type: Type.STRING, description: "O nome completo do ativo, se disponível." },
                    categoria: { type: Type.STRING, description: "A categoria do ativo (ex: Ações, FIIs), se disponível." },
                    corretora: { type: Type.STRING, description: "A corretora onde o ativo está custodiado, se disponível." },
                    pais: { type: Type.STRING, description: "O país de origem do ativo, se disponível." },
                },
                required: ["ticker", "quantidade", "precoCompra"],
            },
        },
    },
     required: ["assets"],
};


export const extractAssetsFromFileContent = async (fileContent: string): Promise<Partial<Asset>[]> => {
    throwErrorIfAiDisabled();
    const prompt = `
        Aja como um assistente inteligente de importação de dados financeiros.
        Analise o conteúdo do arquivo de portfólio de um usuário fornecido abaixo. O conteúdo pode ser um CSV ou um JSON.
        Sua tarefa é identificar e extrair a lista de ativos financeiros.

        Instruções:
        1.  Identifique as colunas que representam o código do ativo (ticker), a quantidade e o preço de compra. Os nomes das colunas podem variar (ex: 'Ativo', 'Código', 'qtd', 'Preço Médio', 'pm'). Use sua inteligência para mapeá-los corretamente.
        2.  Extraia cada linha como um ativo individual.
        3.  Para cada ativo, forneça o 'ticker', 'quantidade' e 'precoCompra'. A quantidade e o preço de compra devem ser números.
        4.  Se possível, identifique e extraia também as colunas 'nome', 'categoria', 'corretora' e 'pais'. Se não encontrar, não inclua esses campos.
        5.  Ignore linhas de resumo, totais, ou linhas em branco que não representem um ativo.
        6.  Retorne os dados como um objeto JSON que segue estritamente o schema fornecido.

        Conteúdo do Arquivo para Análise:
        \`\`\`
        ${fileContent}
        \`\`\`
    `;

    try {
        const response = await ai!.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: assetExtractionSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText) as { assets: Partial<Asset>[] };
        return parsed.assets || [];
    } catch (error) {
        console.error("Error extracting assets with AI:", error);
        throw new Error("A IA não conseguiu analisar o arquivo. Verifique se o formato é simples e contém colunas claras como 'ticker', 'quantidade' e 'precoCompra'.");
    }
};

export interface ProfileAnalysisResult {
    profile: InvestorProfile;
    summary: string;
}

const profileAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        profile: { 
            type: Type.STRING, 
            description: "O perfil de investidor do usuário. Deve ser 'Conservador', 'Moderado' ou 'Agressivo'."
        },
        summary: { 
            type: Type.STRING, 
            description: "Um resumo amigável e conciso explicando por que o perfil foi determinado, para ser exibido ao usuário."
        },
    },
    required: ["profile", "summary"],
};

export const getInvestorProfileAnalysis = async (chatHistory: Message[]): Promise<ProfileAnalysisResult> => {
    throwErrorIfAiDisabled();
    const userMessageCount = chatHistory.filter(m => m.sender === 'user').length;
    const shouldDetermineProfile = userMessageCount >= 3;

    const formattedHistory = chatHistory.map(m => `${m.sender === 'user' ? 'Usuário' : 'Assistente'}: ${m.text}`).join('\n');

    const prompt = `
        Aja como um Planejador Financeiro Pessoal (CFP®) extremamente didático e amigável. Seu objetivo é guiar um investidor iniciante a descobrir seu perfil de investidor (Conservador, Moderado, Agressivo) através de uma conversa curta e acolhedora.

        **Sua Personalidade:**
        - **Educador:** Sempre explique o "porquê" de suas perguntas de forma simples. Ex: "Vou te perguntar sobre o tempo, porque investimentos de longo prazo se comportam de maneira diferente dos de curto prazo."
        - **Empático:** Reconheça que começar a investir pode ser intimidador. Use frases como "Ótima pergunta!", "Entendo perfeitamente", "Não se preocupe, vamos descobrir juntos".
        - **Focado:** Faça uma pergunta clara e objetiva por vez.

        **Instruções do Processo:**
        1.  Comece a conversa de forma calorosa. O histórico já terá sua primeira mensagem.
        2.  Analise a resposta do usuário e faça a próxima pergunta relevante para entender um dos 4 pilares: **Objetivos, Tolerância a Risco, Horizonte de Tempo, e Conhecimento**.
        3.  Após o usuário responder a 3 ou 4 perguntas (quando você tiver informações suficientes para cobrir os pilares), sua **PRÓXIMA** resposta deve ser **APENAS** o objeto JSON final com o perfil e um resumo claro e encorajador.
        4.  Se ainda não tiver informações suficientes, continue a conversa fazendo a próxima pergunta relevante. **NÃO** retorne o JSON ainda. Use o histórico para não repetir temas.

        **Pilares a serem investigados:**
        - **Objetivos:** O que o usuário quer fazer com o dinheiro? (Comprar uma casa, aposentadoria, uma viagem?)
        - **Horizonte de Tempo:** Para quando ele precisa do dinheiro? (1 ano, 5 anos, mais de 10 anos?)
        - **Tolerância a Risco:** Como ele se sentiria se o valor investido caísse 20% em um mês? (Ficaria ansioso e venderia tudo, ou veria como uma oportunidade para comprar mais?)
        - **Conhecimento:** Ele já investiu antes? Conhece termos como ações, renda fixa?

        Histórico da Conversa até agora:
        ${formattedHistory}

        ${shouldDetermineProfile ? 
            `Baseado no histórico, você já tem informações suficientes. Responda APENAS com o objeto JSON contendo o perfil e o resumo, como no schema. O resumo deve explicar de forma simples POR QUE você chegou a essa conclusão, citando as respostas do usuário, e parabenizá-lo por dar o primeiro passo.` 
            : `Continue a conversa fazendo a próxima pergunta. Lembre-se, uma pergunta por vez, com uma breve explicação do motivo.`
        }
    `;

    try {
        const response = await ai!.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: shouldDetermineProfile ? {
                responseMimeType: "application/json",
                responseSchema: profileAnalysisSchema,
            } : {},
        });

        const textResponse = response.text.trim();

        if (shouldDetermineProfile) {
            const parsed = JSON.parse(textResponse);
            return { profile: parsed.profile as InvestorProfile, summary: parsed.summary };
        } else {
             return { profile: null, summary: textResponse };
        }
    } catch (e) {
        console.error("Error in AI profile analysis:", e);
        // Fallback for unexpected errors
        return { profile: null, summary: "Desculpe, tive um problema. Poderia me contar um pouco mais sobre sua experiência com investimentos?" };
    }
};

const intentSchema = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      description: "Classifique a intenção do usuário. Valores possíveis: 'ANALISE_CARTEIRA', 'OTIMIZACAO_CARTEIRA', 'NOTICIAS_ATIVO', 'DUVIDA_GERAL'."
    },
    ticker: {
      type: Type.STRING,
      description: "Se a intenção for 'NOTICIAS_ATIVO', extraia o ticker do ativo. Caso contrário, deixe em branco."
    },
    strategy: {
        type: Type.STRING,
        description: "Se a intenção for 'OTIMIZACAO_CARTEIRA', extraia a estratégia. Valores possíveis: 'Conservador', 'Balanceado', 'Agressivo'. Se não especificado, use 'Balanceado'."
    }
  },
  required: ["intent"],
};

export const getAiChatResponse = async (
    chatHistory: Message[],
    portfolioData: Asset[]
): Promise<Message> => {
    throwErrorIfAiDisabled();
    
    const userPrompt = chatHistory[chatHistory.length - 1].text;

    const classificationPrompt = `
        Analise a seguinte pergunta de um usuário de um app de investimentos e classifique sua intenção principal.
        
        - Se o usuário pedir uma análise, visão geral, resumo, pontos fortes/fracos ou algo similar sobre a carteira, a intenção é 'ANALISE_CARTEIRA'.
        - Se o usuário pedir para otimizar, rebalancear, melhorar ou sugerir compras/vendas na carteira, a intenção é 'OTIMIZACAO_CARTEIRA'. Extraia a estratégia (Conservador, Balanceado, Agressivo). Se nenhuma for mencionada, use 'Balanceado'.
        - Se o usuário pedir notícias sobre um ativo específico (ex: "notícias da PETR4"), a intenção é 'NOTICIAS_ATIVO'. Extraia o ticker do ativo.
        - Para todas as outras perguntas sobre finanças, investimentos, ou qualquer outro tópico, a intenção é 'DUVIDA_GERAL'.
        
        Pergunta do usuário: "${userPrompt}"
    `;

    let intentData: { intent: string; ticker?: string; strategy?: OptimizationStrategy };

    try {
        const intentResponse = await ai!.models.generateContent({
            model: "gemini-2.5-flash",
            contents: classificationPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: intentSchema,
            },
        });
        const jsonText = intentResponse.text.trim();
        intentData = JSON.parse(jsonText);
    } catch (error) {
        console.error("AI Intent Classification failed, defaulting to general question.", error);
        intentData = { intent: 'DUVIDA_GERAL' };
    }

    switch (intentData.intent) {
        case 'ANALISE_CARTEIRA':
            try {
                const analysis = await getPortfolioAnalysis(portfolioData);
                return {
                    sender: 'ai',
                    text: `Aqui está uma análise da sua carteira feita pela IA. ${analysis.summary}`,
                    type: 'analysis',
                    data: analysis,
                };
            } catch (e) {
                return { sender: 'ai', text: 'Desculpe, não consegui analisar sua carteira agora. Tente novamente mais tarde.' };
            }

        case 'OTIMIZACAO_CARTEIRA':
            try {
                const strategy = intentData.strategy || 'Balanceado';
                const optimization = await getPortfolioOptimization(portfolioData, strategy);
                return {
                    sender: 'ai',
                    text: `Preparei um plano de otimização com um perfil **${strategy}**. ${optimization.strategySummary}`,
                    type: 'optimization',
                    data: optimization,
                };
            } catch (e) {
                 return { sender: 'ai', text: 'Desculpe, não consegui gerar a otimização. Tente novamente mais tarde.' };
            }
        
        case 'NOTICIAS_ATIVO':
            if (!intentData.ticker) {
                 return { sender: 'ai', text: 'Não consegui identificar sobre qual ativo você quer notícias. Poderia especificar o ticker? Ex: "notícias da PETR4".' };
            }
            try {
                const news = await getRelevantNews(intentData.ticker);
                if (news.length === 0) {
                     return { sender: 'ai', text: `Não encontrei notícias recentes para ${intentData.ticker}.` };
                }
                const newsText = `Aqui estão as últimas notícias sobre ${intentData.ticker}:\n` + news.map(n => `- **${n.title}** (${n.source}): *${n.summary}*`).join('\n');
                return {
                    sender: 'ai',
                    text: newsText,
                    type: 'news',
                    data: news,
                };
            } catch (e) {
                 return { sender: 'ai', text: `Desculpe, tive um problema ao buscar notícias para ${intentData.ticker}.` };
            }
            
        case 'DUVIDA_GERAL':
        default:
            const generalPrompt = `
                Você é um assistente financeiro amigável e didático chamado Nexus AI.
                Responda a pergunta do usuário de forma clara e concisa, em português do Brasil.
                
                Histórico da conversa (para contexto):
                ${chatHistory.slice(0, -1).map(m => `${m.sender}: ${m.text}`).join('\n')}
                
                Pergunta do usuário: "${userPrompt}"
            `;
            const response = await ai!.models.generateContent({
                model: "gemini-2.5-flash",
                contents: generalPrompt,
            });
            return { sender: 'ai', text: response.text.trim() };
    }
};