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
      let totalPoints = 0;
      quotation.titles.forEach((t: any) => (totalPoints += t.points.length));
      const isCompact = totalPoints > 15;

      const doc = new PDFDocument({
        size: 'A4',
        margin: 30,
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

      // 1. BRANDING HEADER
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, leftMargin, 22, { width: 44, height: 44 });
      }
      doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('MATT ENGINEERING SOLUTIONS.', leftMargin + 50, 24);
      doc.fillColor('#0284c7').fontSize(7.5).font('Helvetica-Bold').text('WE LEAD TO DIGITAL ERA', leftMargin + 50, 39);

      // Address (right aligned block)
      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica');
      doc.text('5th Floor, Pillars Gate, opposite Anna Stadium,\nVadasery Nagercoil, Kanyakumari,\nTamil Nadu 629001.', 280, 24, {
        width: rightMargin - 280,
        align: 'right',
        lineGap: 1.5,
      });

      // Blue divider line
      doc.strokeColor('#0284c7').lineWidth(1.5).moveTo(leftMargin, 70).lineTo(rightMargin, 70).stroke();

      // 2. PROPOSAL METADATA BOX
      const metaY = 76;
      const metaHeight = 44;
      doc.rect(leftMargin, metaY, pageWidth, metaHeight).fill('#f8fafc');
      doc.strokeColor('#e2e8f0').lineWidth(0.8).rect(leftMargin, metaY, pageWidth, metaHeight).stroke();

      // Left column in metadata
      doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text('PROPOSAL PREPARED FOR:', leftMargin + 10, metaY + 6);
      doc.fillColor('#1e293b').fontSize(8.5).font('Helvetica-Bold').text(quotation.clientName, leftMargin + 10, metaY + 17);
      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica').text(quotation.place, leftMargin + 10, metaY + 28);

      // Right column in metadata
      const metaCol2X = leftMargin + 270;
      doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text('QUOTATION DOCUMENT:', metaCol2X, metaY + 6);
      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica').text('Quote Number: ', metaCol2X, metaY + 17);
      doc.fillColor('#0284c7').font('Helvetica-Bold').text(quotation.quotationNumber, metaCol2X + 60, metaY + 17);

      const dateIssuedStr = quotation.quotationDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const validUntilStr = quotation.validUntil.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

      doc.fillColor('#64748b').font('Helvetica').text(`Date Issued: ${dateIssuedStr}`, metaCol2X, metaY + 26);
      doc.text(`Valid Until: ${validUntilStr}`, metaCol2X, metaY + 35);

      // 3. PROJECT SCOPE BRIEF
      const briefY = metaY + metaHeight + 6;
      doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica').text(`Dear ${quotation.sirMadam},`, leftMargin, briefY);
      doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text(`Sub: Quotation for ${quotation.quotationTitle} Development`, leftMargin, briefY + 10, { underline: true });
      doc.fillColor('#64748b').fontSize(7).font('Helvetica').text(
        'As per our discussion through meeting and phone call, here-with we have mentioned all the Deliverables based on your requirement:',
        leftMargin,
        briefY + 22,
        { width: pageWidth }
      );

      // 4. TWO-COLUMN SCOPE GRID
      const leftTitles = quotation.titles.filter((_: any, idx: number) => idx % 2 === 0);
      const rightTitles = quotation.titles.filter((_: any, idx: number) => idx % 2 !== 0);

      const gridStartY = briefY + 34;
      const colWidth = 250;
      const splitX = leftMargin + colWidth + 6;
      const rightColX = splitX + 6;

      const pointFontSize = isCompact ? 6 : 6.8;
      const titleFontSize = isCompact ? 6.8 : 7.5;

      let leftY = gridStartY + 4;
      leftTitles.forEach((t: any) => {
        doc.fillColor('#0f172a').fontSize(titleFontSize).font('Helvetica-Bold').text(t.title.toUpperCase(), leftMargin + 6, leftY, { width: colWidth });
        leftY = doc.y + 1;
        doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(leftMargin + 6, leftY).lineTo(leftMargin + colWidth, leftY).stroke();
        leftY += 2;

        doc.fillColor('#334155').fontSize(pointFontSize).font('Helvetica');
        t.points.forEach((p: any) => {
          doc.text(`• ${p.content}`, leftMargin + 10, leftY, { width: colWidth - 6 });
          leftY = doc.y + (isCompact ? 0.3 : 1);
        });
        leftY += 2.5;
      });

      let rightY = gridStartY + 4;
      rightTitles.forEach((t: any) => {
        doc.fillColor('#0f172a').fontSize(titleFontSize).font('Helvetica-Bold').text(t.title.toUpperCase(), rightColX, rightY, { width: colWidth });
        rightY = doc.y + 1;
        doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(rightColX, rightY).lineTo(rightColX + colWidth - 6, rightY).stroke();
        rightY += 2;

        doc.fillColor('#334155').fontSize(pointFontSize).font('Helvetica');
        t.points.forEach((p: any) => {
          doc.text(`• ${p.content}`, rightColX + 4, rightY, { width: colWidth - 10 });
          rightY = doc.y + (isCompact ? 0.3 : 1);
        });
        rightY += 2.5;
      });

      const gridEndY = Math.max(leftY, rightY) + 2;
      const gridHeight = gridEndY - gridStartY;

      // Grid Borders
      doc.strokeColor('#cbd5e1').lineWidth(0.8).rect(leftMargin, gridStartY, pageWidth, gridHeight).stroke();
      doc.moveTo(splitX, gridStartY).lineTo(splitX, gridStartY + gridHeight).stroke();

      // 5. COMMERCIAL SUMMARY BOX
      const commY = gridEndY + 5;
      const commHeight = 32;
      doc.rect(leftMargin, commY, pageWidth, commHeight).fill('#f8fafc');
      doc.strokeColor('#e2e8f0').lineWidth(0.8).rect(leftMargin, commY, pageWidth, commHeight).stroke();

      doc.fillColor('#0f172a').fontSize(6.8).font('Helvetica-Bold').text('TECHNICAL & COMMERCIAL DETAILS', leftMargin + 8, commY + 3.5);
      doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(leftMargin + 8, commY + 11).lineTo(rightMargin - 8, commY + 11).stroke();

      // 3 Columns inside Commercial Box
      doc.fillColor('#64748b').fontSize(5.8).font('Helvetica-Bold').text('WEB-APPLICATION PLATFORM', leftMargin + 8, commY + 13.5);
      doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text(quotation.technology, leftMargin + 8, commY + 21);

      doc.fillColor('#64748b').fontSize(5.8).font('Helvetica-Bold').text('DURATION', leftMargin + 200, commY + 13.5);
      doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text(quotation.duration, leftMargin + 200, commY + 21);

      const formattedAmt = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(Number(quotation.amount));

      doc.fillColor('#64748b').fontSize(5.8).font('Helvetica-Bold').text('DEVELOPMENT CHARGES', leftMargin + 375, commY + 13.5);
      doc.fillColor('#0284c7').fontSize(8.5).font('Helvetica-Bold').text(formattedAmt, leftMargin + 375, commY + 20);

      // 6. CONDITIONS & PAYMENT DETAILS
      const condY = commY + commHeight + 5;
      doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(leftMargin, condY).lineTo(rightMargin, condY).stroke();

      let cY = condY + 3.5;
      doc.fillColor('#0f172a').fontSize(6.8).font('Helvetica-Bold').text('Support: ', leftMargin, cY, { continued: true });
      doc.fillColor('#475569').font('Helvetica').text('3 months support will be provided free of cost.');
      cY += 8.5;

      doc.fillColor('#0f172a').fontSize(6.8).font('Helvetica-Bold').text('Project duration and delivery: ', leftMargin, cY, { continued: true });
      doc.fillColor('#475569').font('Helvetica').text('The above delivery time is only applicable for the requirements mentioned in the table. Additional development charge and duration will be applicable for future modifications and changes.');
      cY += 14;

      doc.fillColor('#0f172a').fontSize(6.8).font('Helvetica-Bold').text('Payment terms: ', leftMargin, cY, { continued: true });
      doc.fillColor('#475569').font('Helvetica').text(quotation.notes || '50% advance - 20% while testing - 30% when launch.');
      cY += 8.5;

      doc.fillColor('#0f172a').fontSize(6.8).font('Helvetica-Bold').text('NDA: ', leftMargin, cY, { continued: true });
      doc.fillColor('#475569').font('Helvetica').text('Non-disclosure agreement can be signed for confidentiality.');

      // 7. SIGNATURE LAYOUT
      const sigY = cY + 10;
      doc.strokeColor('#cbd5e1').lineWidth(0.5).dash(3, { space: 2 }).moveTo(leftMargin, sigY).lineTo(rightMargin, sigY).undash().stroke();

      const sContentY = sigY + 4;
      // Left: Client Signature
      doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text('For CLIENT Approval:', leftMargin, sContentY);
      doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(leftMargin, sContentY + 32).lineTo(leftMargin + 150, sContentY + 32).stroke();
      doc.fillColor('#64748b').fontSize(6.5).font('Helvetica').text('Authorized Signatory (Date)', leftMargin, sContentY + 35);

      // Right: Matt Signature
      doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text('For MATT ENGINEERING SOLUTIONS', rightMargin - 200, sContentY, { align: 'center', width: 200 });
      if (fs.existsSync(signPath)) {
        doc.image(signPath, rightMargin - 135, sContentY + 9, { width: 65, height: 22 });
      }
      doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text('Mr. MOHAMMED SHAHEER', rightMargin - 200, sContentY + 32, { align: 'center', width: 200 });
      doc.fillColor('#64748b').fontSize(6.5).font('Helvetica').text('Managing Director', rightMargin - 200, sContentY + 41, { align: 'center', width: 200 });

      // 8. FOOTER (Strictly anchored at bottom of page 1)
      const footerLineY = 792;
      const footerTextY = 797;
      const day = String(quotation.quotationDate.getDate()).padStart(2, '0');
      const month = String(quotation.quotationDate.getMonth() + 1).padStart(2, '0');
      const year = quotation.quotationDate.getFullYear();
      const dateFormatted = `${day}/${month}/${year}`;
      const footerText = `Date: ${dateFormatted} | Place: ${quotation.place} | Mob: 7505197855 | Web: mattengineeringsolutions.com`;

      doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(leftMargin, footerLineY).lineTo(rightMargin, footerLineY).stroke();
      doc.fillColor('#94a3b8').fontSize(7).font('Helvetica').text(footerText, leftMargin, footerTextY, { align: 'center', width: pageWidth });

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