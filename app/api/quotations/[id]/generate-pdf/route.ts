import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const qId = parseInt(id);
    if (isNaN(qId)) {
      return new NextResponse('Invalid ID', { status: 400 });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: qId },
      include: {
        titles: {
          orderBy: { sortOrder: 'asc' },
          include: {
            points: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!quotation) {
      return new NextResponse('Quotation not found', { status: 404 });
    }

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        bufferPages: true,
        autoFirstPage: true,
        info: {
          Title: `Quotation - ${quotation.quotationNumber}`,
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

      const renderHeader = (isFirstPage: boolean = true) => {
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, leftMargin, 20, { width: 44, height: 44 });
        }
        doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('MATT ENGINEERING SOLUTIONS.', leftMargin + 52, 22);
        doc.fillColor('#0284c7').fontSize(8.5).font('Helvetica-Bold').text('WE LEAD TO DIGITAL ERA', leftMargin + 52, 38);

        doc.fillColor('#475569').fontSize(8.5).font('Helvetica');
        doc.text('3rd Floor, Pillars Gate, opposite Anna Stadium,\nVadasery Nagercoil, Kanyakumari,\nTamil Nadu 629001.', 280, 20, {
          width: rightMargin - 280,
          align: 'right',
          lineGap: 2,
        });

        doc.strokeColor('#0284c7').lineWidth(1.5).moveTo(leftMargin, 70).lineTo(rightMargin, 70).stroke();
      };

      // Page 1 Header
      renderHeader(true);

      // 2. PROPOSAL METADATA BOX
      const metaY = 78;
      const metaHeight = 48;
      doc.rect(leftMargin, metaY, pageWidth, metaHeight).fill('#f8fafc');
      doc.strokeColor('#cbd5e1').lineWidth(0.8).rect(leftMargin, metaY, pageWidth, metaHeight).stroke();

      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('PROPOSAL PREPARED FOR:', leftMargin + 10, metaY + 7);
      doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text(quotation.clientName, leftMargin + 10, metaY + 19);
      doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(quotation.place, leftMargin + 10, metaY + 32);

      const metaCol2X = leftMargin + 270;
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('QUOTATION DOCUMENT:', metaCol2X, metaY + 7);
      doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text('Quote Number: ', metaCol2X, metaY + 19);
      doc.fillColor('#0284c7').fontSize(9.5).font('Helvetica-Bold').text(quotation.quotationNumber, metaCol2X + 68, metaY + 19);

      const dateIssuedStr = quotation.quotationDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const validUntilStr = quotation.validUntil.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

      doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(`Date Issued: ${dateIssuedStr}`, metaCol2X, metaY + 30);
      doc.text(`Valid Until: ${validUntilStr}`, metaCol2X + 130, metaY + 30);

      // 3. PROJECT SCOPE BRIEF
      let currentY = metaY + metaHeight + 10;
      doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica').text(`Dear ${quotation.sirMadam},`, leftMargin, currentY);
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text(`SUB: QUOTATION FOR ${quotation.quotationTitle.toUpperCase()} DEVELOPMENT`, leftMargin, currentY + 14);
      doc.fillColor('#475569').fontSize(8.5).font('Helvetica').text(
        'As per our discussion through meeting and phone call, here-with we have mentioned all the Deliverables based on your requirement:',
        leftMargin,
        currentY + 28,
        { width: pageWidth }
      );

      currentY += 42;

      // 4. TWO-COLUMN SCOPE GRID
      const leftTitles = quotation.titles.filter((_: any, idx: number) => idx % 2 === 0);
      const rightTitles = quotation.titles.filter((_: any, idx: number) => idx % 2 !== 0);

      const colWidth = 252;
      const splitX = leftMargin + colWidth + 5;
      const rightColX = splitX + 5;
      const pointFontSize = 8.5;
      const titleFontSize = 9.5;

      const gridStartY = currentY;
      let leftY = gridStartY + 6;
      let rightY = gridStartY + 6;

      leftTitles.forEach((t: any) => {
        // Check overflow for left column
        if (leftY > 710) {
          doc.addPage();
          renderHeader(false);
          leftY = 82;
        }

        doc.fillColor('#0f172a').fontSize(titleFontSize).font('Helvetica-Bold').text(t.title.toUpperCase(), leftMargin + 8, leftY, { width: colWidth - 12 });
        leftY = doc.y + 2;
        doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(leftMargin + 8, leftY).lineTo(leftMargin + colWidth - 6, leftY).stroke();
        leftY += 4;

        doc.fillColor('#334155').fontSize(pointFontSize).font('Helvetica');
        t.points.forEach((p: any) => {
          if (leftY > 740) {
            doc.addPage();
            renderHeader(false);
            leftY = 82;
          }
          doc.text(`•  ${p.content}`, leftMargin + 12, leftY, { width: colWidth - 18, lineGap: 2 });
          leftY = doc.y + 2.5;
        });
        leftY += 4;
      });

      rightTitles.forEach((t: any) => {
        if (rightY > 710) {
          doc.addPage();
          renderHeader(false);
          rightY = 82;
        }

        doc.fillColor('#0f172a').fontSize(titleFontSize).font('Helvetica-Bold').text(t.title.toUpperCase(), rightColX + 4, rightY, { width: colWidth - 12 });
        rightY = doc.y + 2;
        doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(rightColX + 4, rightY).lineTo(rightColX + colWidth - 6, rightY).stroke();
        rightY += 4;

        doc.fillColor('#334155').fontSize(pointFontSize).font('Helvetica');
        t.points.forEach((p: any) => {
          if (rightY > 740) {
            doc.addPage();
            renderHeader(false);
            rightY = 82;
          }
          doc.text(`•  ${p.content}`, rightColX + 8, rightY, { width: colWidth - 18, lineGap: 2 });
          rightY = doc.y + 2.5;
        });
        rightY += 4;
      });

      const gridEndY = Math.max(leftY, rightY) + 2;
      const gridHeight = Math.max(gridEndY - gridStartY, 40);

      // Outer Grid Borders if on single page
      doc.strokeColor('#cbd5e1').lineWidth(0.8).rect(leftMargin, gridStartY, pageWidth, gridHeight).stroke();
      doc.moveTo(splitX, gridStartY).lineTo(splitX, gridStartY + gridHeight).stroke();

      currentY = gridEndY + 10;

      // Check if Commercial Box + Conditions fit on current page
      if (currentY + 180 > 740) {
        doc.addPage();
        renderHeader(false);
        currentY = 82;
      }

      // 5. COMMERCIAL SUMMARY BOX
      const commY = currentY;
      const commHeight = 38;
      doc.rect(leftMargin, commY, pageWidth, commHeight).fill('#f8fafc');
      doc.strokeColor('#cbd5e1').lineWidth(0.8).rect(leftMargin, commY, pageWidth, commHeight).stroke();

      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('TECHNICAL & COMMERCIAL DETAILS', leftMargin + 8, commY + 5);
      doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(leftMargin + 8, commY + 16).lineTo(rightMargin - 8, commY + 16).stroke();

      doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text('WEB-APPLICATION PLATFORM', leftMargin + 8, commY + 19);
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(quotation.technology, leftMargin + 8, commY + 27);

      doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text('DURATION', leftMargin + 200, commY + 19);
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(quotation.duration, leftMargin + 200, commY + 27);

      const formattedAmt = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(Number(quotation.amount));

      doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text('DEVELOPMENT CHARGES', leftMargin + 370, commY + 19);
      doc.fillColor('#0284c7').fontSize(10).font('Helvetica-Bold').text(formattedAmt, leftMargin + 370, commY + 26);

      // 6. CONDITIONS & PAYMENT DETAILS
      const condY = commY + commHeight + 8;
      doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(leftMargin, condY).lineTo(rightMargin, condY).stroke();

      let cY = condY + 5;
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('Support: ', leftMargin, cY, { continued: true });
      doc.fillColor('#475569').font('Helvetica').text('3 months support will be provided free of cost.');
      cY += 12;

      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('Project duration and delivery: ', leftMargin, cY, { continued: true });
      doc.fillColor('#475569').font('Helvetica').text('The above delivery time is only applicable for the requirements mentioned in the table. Additional development charge and duration will be applicable for future modifications and changes.', { width: pageWidth - 140 });
      cY = doc.y + 3;

      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('Payment terms: ', leftMargin, cY, { continued: true });
      doc.fillColor('#475569').font('Helvetica').text(quotation.notes || '50% advance - 20% while testing - 30% when launch.');
      cY += 12;

      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('Phase Scope & Milestones: ', leftMargin, cY, { continued: true });
      doc.fillColor('#475569').font('Helvetica').text('All the features mentioned in this quotation are included in Phase 1. Any new features requested after this phase will be considered Phase 2 and will be developed separately. No new features will be added during Phase 1 until all the features listed in this quotation are fully completed.', { width: pageWidth - 140 });
      cY = doc.y + 3;

      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('NDA: ', leftMargin, cY, { continued: true });
      doc.fillColor('#475569').font('Helvetica').text('Non-disclosure agreement can be signed for confidentiality.');

      // 7. SIGNATURE LAYOUT
      if (cY + 70 > 750) {
        doc.addPage();
        renderHeader(false);
        cY = 82;
      }

      const sigY = Math.max(cY + 16, doc.page.height - 125);
      doc.strokeColor('#cbd5e1').lineWidth(0.5).dash(3, { space: 2 }).moveTo(leftMargin, sigY).lineTo(rightMargin, sigY).undash().stroke();

      const sContentY = sigY + 6;
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('For CLIENT Approval:', leftMargin, sContentY);
      doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(leftMargin, sContentY + 38).lineTo(leftMargin + 160, sContentY + 38).stroke();
      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica').text('Authorized Signatory (Date)', leftMargin, sContentY + 42);

      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('For MATT ENGINEERING SOLUTIONS', rightMargin - 200, sContentY, { align: 'center', width: 200 });
      if (fs.existsSync(signPath)) {
        doc.image(signPath, rightMargin - 135, sContentY + 10, { width: 70, height: 25 });
      }
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('Mr. MOHAMMED SHAHEER', rightMargin - 200, sContentY + 38, { align: 'center', width: 200 });
      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica').text('Managing Director', rightMargin - 200, sContentY + 48, { align: 'center', width: 200 });

      // 8. FOOTER ACROSS ALL PAGES
      const range = doc.bufferedPageRange();
      const day = String(quotation.quotationDate.getDate()).padStart(2, '0');
      const month = String(quotation.quotationDate.getMonth() + 1).padStart(2, '0');
      const year = quotation.quotationDate.getFullYear();
      const dateFormatted = `${day}/${month}/${year}`;
      const footerText = `Date: ${dateFormatted} | Place: ${quotation.place} | Mob: 7305197833 | Web: mattengineeringsolutions.com`;

      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const pageNum = i + 1;
        const totalPages = range.count;

        doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(leftMargin, 800).lineTo(rightMargin, 800).stroke();
        doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(footerText, leftMargin, 805, { width: pageWidth - 70 });
        doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(`Page ${pageNum} of ${totalPages}`, rightMargin - 70, 805, { align: 'right', width: 70 });
      }

      doc.end();
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Quotation_${quotation.quotationNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('PDF API route error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}