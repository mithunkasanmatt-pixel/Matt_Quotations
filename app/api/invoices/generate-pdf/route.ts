import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clientName = 'Client Name',
      place = 'City',
      invoiceDate = '',
      dueDate = '',
      referenceQuotationDate = '',
      phase1Scope = 'Original Quotation Scope',
      phase1Amount = 0,
      phase2Scope = 'Additional Work Features',
      phase2Amount = 0,
      currency = 'INR',
    } = body;

    const amt1 = Number(phase1Amount) || 0;
    const amt2 = Number(phase2Amount) || 0;
    const subtotal = amt1 + amt2;
    const totalAmountDue = subtotal;

    const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    };

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        bufferPages: true,
        autoFirstPage: true,
        info: {
          Title: `Invoice - ${clientName}`,
          Author: 'Matt Engineering Solutions',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      const signPath = path.join(process.cwd(), 'public', 'sign.png');

      const leftMargin = 36;
      const rightMargin = 559;
      const pageWidth = rightMargin - leftMargin; // 523pt

      // 1. HEADER SECTION
      let currentY = 30;

      // Top Left: Company details
      doc.fillColor('#000000').fontSize(13).font('Times-Bold').text('MATT ENGINEERING SOLUTIONS.', leftMargin, currentY);
      currentY += 16;
      doc.fillColor('#000000').fontSize(8.5).font('Times-BoldItalic').text('WE LEAD TO DIGITAL ERA', leftMargin, currentY);
      currentY += 13;

      doc.fillColor('#000000').fontSize(8.5).font('Times-Roman');
      doc.text('3rd Floor, Pillars Gate, opposite Anna Stadium, Vadasery Nagercoil,', leftMargin, currentY);
      currentY += 11;
      doc.text('Kanyakumari, Tamil Nadu 629001.', leftMargin, currentY);
      currentY += 11;
      doc.text('Mob: 7305197833 Web: mattengineeringsolutions.com', leftMargin, currentY);

      // Top Right: Logo
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, rightMargin - 75, 25, { width: 75, height: 75 });
      }

      // 2. INVOICE TITLE
      currentY = 115;
      doc.fillColor('#1f3864').fontSize(20).font('Times-Bold').text('INVOICE', leftMargin, currentY, {
        width: pageWidth,
        align: 'center',
      });

      // 3. META SECTION (BILL TO + BOXED DETAILS)
      currentY = 150;
      const metaBoxY = currentY;

      // BILL TO (Left)
      doc.fillColor('#1f3864').fontSize(10).font('Times-Bold').text('BILL TO', leftMargin, currentY);
      currentY += 14;
      doc.fillColor('#000000').fontSize(10).font('Times-Bold').text(`Mr. ${clientName.replace(/^Mr\.\s*/i, '')}`, leftMargin, currentY);
      currentY += 13;
      doc.fillColor('#000000').fontSize(9.5).font('Times-Roman').text(place, leftMargin, currentY);

      // BOXED DETAILS TABLE (Right)
      const boxX = 275;
      const boxWidth = rightMargin - boxX; // 284pt
      const boxHeight = 63;
      const rowHeight = 21;
      const splitColX = boxX + 110;

      // Draw Box Outer & Borders
      doc.strokeColor('#71717a').lineWidth(0.8);
      doc.rect(boxX, metaBoxY, boxWidth, boxHeight).stroke();
      
      // Horizontal row dividers
      doc.moveTo(boxX, metaBoxY + rowHeight).lineTo(rightMargin, metaBoxY + rowHeight).stroke();
      doc.moveTo(boxX, metaBoxY + rowHeight * 2).lineTo(rightMargin, metaBoxY + rowHeight * 2).stroke();

      // Vertical divider
      doc.moveTo(splitColX, metaBoxY).lineTo(splitColX, metaBoxY + boxHeight).stroke();

      // Box Row Content
      const r1Y = metaBoxY + 5;
      const r2Y = metaBoxY + rowHeight + 5;
      const r3Y = metaBoxY + rowHeight * 2 + 5;

      // Row 1
      doc.fillColor('#000000').fontSize(9).font('Times-Bold').text('Invoice Date', boxX + 8, r1Y);
      doc.fillColor('#000000').fontSize(9).font('Times-Roman').text(invoiceDate || 'DD/MM/YYYY', splitColX + 8, r1Y);

      // Row 2
      doc.fillColor('#000000').fontSize(9).font('Times-Bold').text('Due Date', boxX + 8, r2Y);
      doc.fillColor('#000000').fontSize(9).font('Times-Roman').text(dueDate || 'DD/MM/YYYY', splitColX + 8, r2Y);

      // Row 3
      doc.fillColor('#000000').fontSize(9).font('Times-Bold').text('Reference Quotation', boxX + 8, r3Y);
      doc.fillColor('#000000').fontSize(9).font('Times-Roman').text(
        referenceQuotationDate ? `Dated ${referenceQuotationDate}` : 'Dated DD/MM/YYYY',
        splitColX + 8,
        r3Y
      );

      // 4. ITEMS TABLE
      let tableY = 240;
      const col1X = leftMargin; // 36
      const col2X = leftMargin + 32; // 68
      const col3X = 425; // 425
      const tableRight = rightMargin; // 559

      const col1Width = 32;
      const col2Width = col3X - col2X; // 357
      const col3Width = tableRight - col3X; // 134

      // Header Row (Dark Blue Background)
      const headerHeight = 22;
      doc.rect(col1X, tableY, pageWidth, headerHeight).fill('#1f3864');

      doc.fillColor('#ffffff').fontSize(9).font('Times-Bold');
      doc.text('#', col1X, tableY + 6, { width: col1Width, align: 'center' });
      doc.text('Description', col2X + 6, tableY + 6, { width: col2Width - 12, align: 'left' });
      doc.text('Amount (INR)', col3X, tableY + 6, { width: col3Width - 8, align: 'right' });

      let currentTableRowY = tableY + headerHeight;

      // Items Data
      const items = [
        {
          num: '1',
          desc: `Website Development – Original Quotation Scope (${phase1Scope})`,
          amount: amt1,
        },
      ];

      if (amt2 > 0 || phase2Scope) {
        items.push({
          num: '2',
          desc: `Additional Work Features (${phase2Scope})`,
          amount: amt2,
        });
      }

      doc.strokeColor('#71717a').lineWidth(0.8);

      items.forEach((item) => {
        // Calculate dynamic height based on description text length
        doc.font('Times-Roman').fontSize(9);
        const textHeight = doc.heightOfString(item.desc, { width: col2Width - 16 });
        const rowH = Math.max(textHeight + 16, 32);

        // Row background & borders
        doc.rect(col1X, currentTableRowY, pageWidth, rowH).stroke();

        // Vertical column dividers
        doc.moveTo(col2X, currentTableRowY).lineTo(col2X, currentTableRowY + rowH).stroke();
        doc.moveTo(col3X, currentTableRowY).lineTo(col3X, currentTableRowY + rowH).stroke();

        // Row Text Content
        doc.fillColor('#000000').fontSize(9).font('Times-Roman');
        doc.text(item.num, col1X, currentTableRowY + 10, { width: col1Width, align: 'center' });
        doc.text(item.desc, col2X + 8, currentTableRowY + 10, { width: col2Width - 16 });
        doc.text(formatCurrency(item.amount), col3X, currentTableRowY + 10, { width: col3Width - 8, align: 'right' });

        currentTableRowY += rowH;
      });

      // 5. SUBTOTAL & TOTAL AMOUNT DUE SUMMARY
      // Outer border for total section area
      const summaryY = currentTableRowY;

      // Subtotal Row
      const subtotalRowH = 22;
      doc.rect(col1X, summaryY, pageWidth, subtotalRowH).stroke();
      doc.moveTo(col3X, summaryY).lineTo(col3X, summaryY + subtotalRowH).stroke();

      doc.fillColor('#000000').fontSize(9.5).font('Times-Bold');
      doc.text('Subtotal', col2X, summaryY + 6, { width: col2Width - 8, align: 'right' });
      doc.text(`INR ${formatCurrency(subtotal)}`, col3X, summaryY + 6, { width: col3Width - 8, align: 'right' });

      // TOTAL AMOUNT DUE Row (Cream/Light Yellow Highlight Banner)
      const totalRowY = summaryY + subtotalRowH;
      const totalRowH = 28;

      // Fill Cream Yellow background
      doc.rect(col1X, totalRowY, pageWidth, totalRowH).fill('#fffbeb');
      doc.strokeColor('#71717a').lineWidth(0.8).rect(col1X, totalRowY, pageWidth, totalRowH).stroke();
      doc.moveTo(col3X, totalRowY).lineTo(col3X, totalRowY + totalRowH).stroke();

      doc.fillColor('#1f3864').fontSize(11).font('Times-Bold');
      doc.text('TOTAL AMOUNT DUE', col1X, totalRowY + 8, { width: col3X - col1X - 10, align: 'right' });

      doc.fillColor('#1f3864').fontSize(11).font('Times-Bold');
      doc.text(`INR ${formatCurrency(totalAmountDue)}`, col3X, totalRowY + 8, { width: col3Width - 8, align: 'right' });

      // 6. FOOTER / SIGNATURE SECTION
      let sigY = totalRowY + totalRowH + 45;

      doc.fillColor('#000000').fontSize(9.5).font('Times-Roman').text('For MATT ENGINEERING SOLUTIONS', leftMargin, sigY);
      sigY += 15;

      if (fs.existsSync(signPath)) {
        doc.image(signPath, leftMargin, sigY, { width: 75, height: 28 });
        sigY += 32;
      } else {
        sigY += 32;
      }

      doc.fillColor('#000000').fontSize(9.5).font('Times-Bold').text('Mr. MOHAMMED SHAHEER', leftMargin, sigY);
      sigY += 12;
      doc.fillColor('#000000').fontSize(9.5).font('Times-Bold').text('Managing Director', leftMargin, sigY);
      sigY += 12;
      doc.fillColor('#000000').fontSize(8.5).font('Times-Italic').text('Authorized Signatory', leftMargin, sigY);

      doc.end();
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice_${clientName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Invoice PDF generation error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
