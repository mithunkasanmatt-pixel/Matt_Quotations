import { PrismaClient } from '@prisma/client';

export async function generateQuotationNumber(prisma: PrismaClient | any): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `MATT-QTN-${currentYear}-`;

  // Fetch all existing quotations with this prefix for the current year
  const existingQuotations = await prisma.quotation.findMany({
    where: {
      quotationNumber: {
        startsWith: prefix,
      },
    },
    select: {
      quotationNumber: true,
    },
  });

  // Base sequence for 2026 starts at 111 so the next is 112 (0112)
  let maxSeq = currentYear === 2026 ? 111 : 0;

  for (const q of existingQuotations) {
    const numPart = q.quotationNumber.replace(prefix, '');
    const seq = parseInt(numPart, 10);
    if (!isNaN(seq) && seq > maxSeq) {
      maxSeq = seq;
    }
  }

  const nextSeq = maxSeq + 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}