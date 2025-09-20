import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Asset } from '../types';

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
    
    const tableData = portfolio.map(asset => {
        const valorMercado = asset.quantidade * asset.cotacaoAtual;
        const lucroPrejuizo = valorMercado - (asset.quantidade * asset.precoCompra);
        return [
            asset.ticker,
            asset.categoria,
            asset.pais,
            asset.quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 6 }),
            formatCurrency(asset.precoCompra),
            formatCurrency(asset.cotacaoAtual),
            formatCurrency(valorMercado),
            formatCurrency(lucroPrejuizo)
        ];
    });

    autoTable(doc, {
        head: [['Ativo', 'Categoria', 'País', 'Qtd.', 'Preço Médio', 'Preço Atual', 'Valor Mercado', 'L/P']],
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
}