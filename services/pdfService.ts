import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Asset, InvestorProfile, IrInfo } from '../types.ts';

const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type DerivedData = {
    patrimonioTotal: number;
    lucroPrejuizoTotal: number;
    totalInvestido: number;
    proventosAnuaisEstimados: number;
}

const addFooter = (doc: jsPDF, reportName: string) => {
    const pageCount = doc.getNumberOfPages();
    const generationDate = new Date().toLocaleDateString('pt-BR');
    
    doc.setFontSize(8);
    doc.setTextColor('#64748b'); // slate-500

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15); // Footer line
        doc.text(`Relatório ${reportName} - Nexus`, 14, pageHeight - 10);
        doc.text(`Gerado em: ${generationDate}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    }
};


export const generatePortfolioPdf = async (portfolio: Asset[], derivedData: DerivedData, chartImageDataUrl: string): Promise<void> => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor('#1e293b');
    doc.text('Relatório de Carteira - Nexus', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor('#334155');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 14, 29);
    
    // Summary KPIs
    doc.setFontSize(12);
    doc.setTextColor('#1e293b');
    doc.text('Resumo da Carteira', 14, 45);
    doc.setLineWidth(0.5);
    doc.line(14, 47, 196, 47);

    const kpiData = [
        ['Patrimônio Total:', formatCurrency(derivedData.patrimonioTotal)],
        ['Lucro/Prejuízo Total:', formatCurrency(derivedData.lucroPrejuizoTotal)],
        ['Total Investido:', formatCurrency(derivedData.totalInvestido)],
        ['Proventos Anuais (Est.):', formatCurrency(derivedData.proventosAnuaisEstimados)],
    ];
    autoTable(doc, {
        body: kpiData,
        startY: 50,
        theme: 'plain',
        styles: {
            fontSize: 10,
            cellPadding: 1.5,
        },
        columnStyles: {
            0: { fontStyle: 'bold', textColor: '#334155' },
            1: { halign: 'right', textColor: '#0f172a' },
        }
    });
    
    // Evolution Chart
    const chartYPosition = (doc as any).lastAutoTable.finalY + 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const chartWidth = pageWidth - 28; // with margins
    const chartHeight = 80; // Fixed height for the chart image
    
    doc.setFontSize(12);
    doc.setTextColor('#1e293b');
    doc.text('Evolução Patrimonial', 14, chartYPosition);
    doc.setLineWidth(0.5);
    doc.line(14, chartYPosition + 2, 196, chartYPosition + 2);

    doc.addImage(chartImageDataUrl, 'PNG', 14, chartYPosition + 5, chartWidth, chartHeight);
    
    // Assets Table
    const tableYPosition = chartYPosition + chartHeight + 15;
    
    const USD_BRL_RATE = 5.25;
    const tableData = portfolio.map(asset => {
        const purchaseRate = asset.moedaCompra === 'USD' || asset.moedaCompra === 'USDT' ? USD_BRL_RATE : 1;
        const currentRate = asset.moedaCotacao === 'USD' ? USD_BRL_RATE : 1;
        const valorMercadoEmBRL = asset.quantidade * asset.cotacaoAtual * currentRate;
        const custoTotalEmBRL = asset.quantidade * asset.precoCompra * purchaseRate;
        const lucroPrejuizoEmBRL = valorMercadoEmBRL - custoTotalEmBRL;
        const precoMedioEmBRL = asset.quantidade > 0 ? custoTotalEmBRL / asset.quantidade : 0;
        const precoAtualEmBRL = asset.cotacaoAtual * currentRate;

        return [
            asset.ticker,
            asset.categoria,
            asset.pais,
            asset.quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 6 }),
            formatCurrency(precoMedioEmBRL),
            formatCurrency(precoAtualEmBRL),
            formatCurrency(valorMercadoEmBRL),
            formatCurrency(lucroPrejuizoEmBRL)
        ];
    });

    autoTable(doc, {
        head: [['Ativo', 'Categoria', 'País', 'Qtd.', 'Preço Médio (BRL)', 'Preço Atual (BRL)', 'Valor Mercado (BRL)', 'L/P (BRL)']],
        body: tableData,
        startY: tableYPosition,
        theme: 'grid',
        headStyles: {
            fillColor: '#1e293b',
            textColor: '#ffffff',
            fontSize: 9,
        },
        styles: {
            fontSize: 8,
            cellPadding: 2,
        },
        alternateRowStyles: {
            fillColor: '#f1f5f9'
        },
        columnStyles: {
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' },
            7: { halign: 'right' },
        },
        didParseCell: (data) => {
            // Color code profit/loss column
            if (data.column.index === 7 && data.cell.section === 'body') {
                const text = data.cell.text[0] || '';
                if (text.includes('-')) {
                    data.cell.styles.textColor = '#ef4444';
                } else {
                    data.cell.styles.textColor = '#16a34a';
                }
            }
        },
        didDrawPage: (data) => {
             // Add header to new pages created by autoTable
            if (data.pageNumber > 1) {
                 doc.setFontSize(12);
                 doc.setTextColor('#1e293b');
                 doc.text('Detalhes dos Ativos (continuação)', 14, 22);
            }
        }
    });
    
    addFooter(doc, 'Carteira');

    doc.save('relatorio-carteira-nexus.pdf');
};


export const generateTaxReportPdf = async (portfolio: Asset[], derivedData: DerivedData): Promise<void> => {
    const doc = new jsPDF();
    const generationDate = new Date();

    // Header
    doc.setFontSize(22);
    doc.setTextColor('#1e293b');
    doc.text('Relatório para Imposto de Renda', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor('#334155');
    doc.text(`Posição da carteira em: ${generationDate.toLocaleDateString('pt-BR')}`, 14, 29);
    
    // Summary
    doc.setFontSize(12);
    doc.setTextColor('#1e293b');
    doc.text('Resumo para Declaração', 14, 45);
    doc.setLineWidth(0.5);
    doc.line(14, 47, 196, 47);

    const kpiData = [
        ['Patrimônio Total:', formatCurrency(derivedData.patrimonioTotal)],
        ['Total Custo de Aquisição:', formatCurrency(derivedData.totalInvestido)],
    ];
    autoTable(doc, {
        body: kpiData,
        startY: 50,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 1.5 },
        columnStyles: {
            0: { fontStyle: 'bold', textColor: '#334155' },
            1: { halign: 'right', textColor: '#0f172a' },
        }
    });

    // Assets Table - Bens e Direitos
    const tableStartY = (doc as any).lastAutoTable.finalY + 15;
    
    const tableData = portfolio.map(asset => {
        const custoTotal = asset.quantidade * asset.precoCompra;
        return [
            asset.ticker,
            asset.nome,
            asset.quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 6 }),
            formatCurrency(asset.precoCompra),
            formatCurrency(custoTotal),
        ];
    });

    autoTable(doc, {
        head: [['Ativo', 'Nome', 'Quantidade', 'Custo Médio', 'Custo Total de Aquisição']],
        body: tableData,
        startY: tableStartY,
        theme: 'grid',
        headStyles: { fillColor: '#1e293b', textColor: '#ffffff', fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 2 },
        alternateRowStyles: { fillColor: '#f1f5f9' },
        columnStyles: {
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
        },
        didDrawPage: (data) => {
             if (data.pageNumber > 1) {
                 doc.setFontSize(12);
                 doc.setTextColor('#1e293b');
                 doc.text('Detalhes dos Ativos (continuação)', 14, 22);
            }
        }
    });
    
    addFooter(doc, 'Imposto de Renda');

    doc.save(`relatorio-imposto-renda-${generationDate.getFullYear()}.pdf`);
};


const drawBarcode = (doc: jsPDF, x: number, y: number, width: number, height: number, code: string) => {
    let currentX = x;
    for (let i = 0; i < 44; i++) {
        const barWidth = 1 + Math.random();
        doc.rect(currentX, y, barWidth, height, 'F');
        currentX += barWidth + (1 + Math.random() * 0.8);
        if (currentX > x + width) break;
    }
    doc.setFont('courier', 'normal');
    doc.setFontSize(10);
    doc.text(code, x + width / 2, y + height + 4, { align: 'center' });
};

const generatePixCode = () => '00020126' + Math.random().toString(36).substring(2, 15) + '5204000053039865802BR5913' + Math.random().toString(36).substring(2, 15).toUpperCase() + '6009SAO PAULO62070503***6304' + Math.random().toString(16).substring(2, 6).toUpperCase();

export const generateDarfPdf = async (period: string, taxDue: number): Promise<void> => {
    const doc = new jsPDF();
    const [year, month] = period.split('-');
    const dueDate = new Date(parseInt(year), parseInt(month), 0); // Last day of next month
    dueDate.setDate(dueDate.getDate() + 1); // Go to next month
    while (dueDate.getDay() === 0 || dueDate.getDay() === 6) { // Find last weekday
         dueDate.setDate(dueDate.getDate() - 1);
    }
    
    const formattedPeriod = `${month}/${year}`;
    const formattedDueDate = dueDate.toLocaleDateString('pt-BR');
    const formattedTaxDue = formatCurrency(taxDue);
    const referenceNumber = new Date().getFullYear() + Math.random().toString().slice(2, 11);

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text("DARF - Documento de Arrecadação de Receitas Federais", 105, 20, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text("MINISTÉRIO DA FAZENDA - Secretaria da Receita Federal do Brasil", 105, 25, { align: 'center' });

    // Table with fields
    const tableData = [
        ["01 | Período de Apuração", formattedPeriod],
        ["02 | CPF/CNPJ", "XXX.XXX.XXX-XX (Seu CPF)"],
        ["03 | Código da Receita", "6015 - Ganhos de Capital"],
        ["04 | Número de Referência", referenceNumber],
        ["05 | Data de Vencimento", formattedDueDate],
        ["06 | Valor Principal", formattedTaxDue],
        ["07 | Valor da Multa", "R$ 0,00"],
        ["08 | Valor dos Juros", "R$ 0,00"],
        ["09 | Valor Total", formattedTaxDue],
    ];
    
    autoTable(doc, {
        body: tableData,
        startY: 32,
        theme: 'grid',
        styles: {
            fontSize: 10,
            cellPadding: 2.5,
            lineColor: '#000',
            lineWidth: 0.1
        },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 70, textColor: '#333' },
            1: { textColor: '#000' }
        },
    });

    const finalY = (doc as any).lastAutoTable.finalY;

    // Payment Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Pagamento", 105, finalY + 15, { align: 'center' });

    // Barcode
    doc.setDrawColor('#000');
    doc.rect(14, finalY + 20, 182, 30);
    const barcodeNumber = `85810000000 0 ${Math.round(taxDue * 100).toString().padStart(11, '0')} 00000000000 0 ${referenceNumber} 0`;
    drawBarcode(doc, 20, finalY + 25, 100, 15, barcodeNumber.replace(/\s/g, ''));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text("Autenticação Mecânica", 130, finalY + 25);

    // PIX Section
    const pixY = finalY + 60;
    doc.rect(14, pixY, 182, 50);
    doc.setFont('helvetica', 'bold');
    doc.text("Pagamento via PIX", 20, pixY + 7);
    
    // Fake QR Code
    doc.rect(20, pixY + 10, 30, 30);
    doc.setFontSize(8);
    doc.text("Leia o QR Code", 35, pixY + 25, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text("Use o aplicativo do seu banco para pagar com o PIX. Aponte a câmera para o QR Code ou use a chave 'Copia e Cola'.", 55, pixY + 14, { maxWidth: 135 });
    
    const pixCode = generatePixCode();
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.text(pixCode, 55, pixY + 30, { maxWidth: 135 });
    doc.rect(55, pixY + 33, 135, 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text("PIX Copia e Cola", 122.5, pixY + 37.5, { align: 'center' });

    // Disclaimer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor('#64748b');
    doc.text("Este é um documento simulado gerado pelo Nexus para auxiliar no pagamento. Verifique todos os dados antes de efetuar o pagamento.", 105, 280, { align: 'center' });

    doc.save(`darf-simulado-${period.replace('-', '_')}-nexus.pdf`);
};

export const generateModelPortfolioPdf = (portfolio: Asset[], profile: InvestorProfile): void => {
    const doc = new jsPDF();
    const totalValue = portfolio.reduce((sum, asset) => sum + asset.precoCompra * asset.quantidade, 0);

    // Header
    doc.setFontSize(22);
    doc.setTextColor('#1e293b');
    doc.text('Sua Carteira Modelo - Nexus', 14, 22);
    doc.setFontSize(14);
    doc.setTextColor('#334155');
    doc.text(`Perfil do Investidor: ${profile}`, 14, 30);

    // Summary
    doc.setFontSize(12);
    doc.setTextColor('#1e293b');
    doc.text('Resumo da Alocação', 14, 45);
    doc.setLineWidth(0.5);
    doc.line(14, 47, 196, 47);

    const tableData = portfolio.map(asset => {
        const allocation = ((asset.precoCompra * asset.quantidade) / totalValue) * 100;
        return [
            asset.ticker,
            asset.nome,
            `${allocation.toFixed(2)}%`,
            formatCurrency(asset.precoCompra * asset.quantidade)
        ];
    });

    autoTable(doc, {
        head: [['Ativo', 'Descrição', 'Alocação (%)', 'Valor Simulado']],
        body: tableData,
        startY: 50,
        theme: 'grid',
        headStyles: {
            fillColor: '#1e293b',
            textColor: '#ffffff',
            fontSize: 10,
        },
        styles: {
            fontSize: 9,
            cellPadding: 3,
        },
        columnStyles: {
            2: { halign: 'right' },
            3: { halign: 'right' },
        },
    });

    // Disclaimer
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(9);
    doc.setTextColor('#64748b'); // slate-500
    doc.text(
        'Este é um relatório educacional gerado com base no seu perfil. Os ativos são exemplos e não constituem uma recomendação de investimento.',
        14,
        finalY + 15,
        { maxWidth: 182 }
    );

    addFooter(doc, `Modelo ${profile}`);
    doc.save(`carteira_modelo_${profile}.pdf`);
};

export const generateAnnualTaxReportPdf = (portfolio: Asset[], irInfo: Record<string, IrInfo>, year: number): void => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor('#1e293b');
    doc.text(`Relatório de Bens e Direitos ${year}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor('#334155');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 29);

    const totalAcquisitionCost = portfolio.reduce((sum, asset) => sum + (asset.precoCompra * asset.quantidade), 0);
    doc.setFontSize(12);
    doc.text(`Custo Total de Aquisição em 31/12/${year}: ${formatCurrency(totalAcquisitionCost)}`, 14, 40);

    const tableData = portfolio.map(asset => {
        const info = irInfo[asset.categoria];
        const custoTotal = asset.precoCompra * asset.quantidade;
        const descriptionTemplate = info?.description || "[TICKER] - [QUANTIDADE] unidades adquiridas ao custo total de [CUSTO_TOTAL].";
        const finalDescription = descriptionTemplate
            .replace(/\[TICKER\]/g, asset.ticker)
            .replace(/\[NOME_EMPRESA\]/g, asset.nome)
            .replace(/\[QUANTIDADE\]/g, asset.quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 6 }))
            .replace(/\[CUSTO_TOTAL\]/g, `R$ ${custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
            .replace(/\[CORRETORA\]/g, asset.corretora);
        
        return [
            info?.group || 'Outros',
            info?.code || 'N/A',
            `${asset.ticker} - ${asset.nome}`,
            finalDescription,
            formatCurrency(custoTotal),
        ];
    });

    autoTable(doc, {
        head: [['Grupo', 'Código', 'Ativo', 'Discriminação', `Situação em 31/12/${year}`]],
        body: tableData,
        startY: 50,
        theme: 'grid',
        headStyles: {
            fillColor: '#1e293b',
            textColor: '#ffffff',
            fontSize: 9,
        },
        styles: {
            fontSize: 8,
            cellPadding: 2,
            valign: 'middle',
        },
        columnStyles: {
            3: { cellWidth: 88 }, // Discrimination column
            4: { halign: 'right' },
        },
        didDrawPage: (data) => {
            if (data.pageNumber > 1) {
                doc.setFontSize(12);
                doc.setTextColor('#1e293b');
                doc.text('Relatório de Bens e Direitos (continuação)', 14, 22);
            }
        }
    });
    
    addFooter(doc, `Bens e Direitos ${year}`);
    doc.save(`relatorio_bens_e_direitos_${year}.pdf`);
};