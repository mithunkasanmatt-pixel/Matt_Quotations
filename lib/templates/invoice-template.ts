import { getLocalAssetAsBase64 } from '@/lib/pdf-generator';

export interface InvoiceTemplateData {
  clientName?: string;
  place?: string;
  invoiceDate?: string;
  dueDate?: string;
  referenceQuotationDate?: string;
  phase1Scope?: string;
  phase1Amount?: number;
  phase2Scope?: string;
  phase2Amount?: number;
  currency?: string;
}

export function generateInvoiceHtml(data: InvoiceTemplateData): string {
  const logoBase64 = getLocalAssetAsBase64('logo.png');
  const signBase64 = getLocalAssetAsBase64('sign.png');

  const amt1 = Number(data.phase1Amount) || 0;
  const amt2 = Number(data.phase2Amount) || 0;
  const subtotal = amt1 + amt2;
  const totalAmountDue = subtotal;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const clientFormatted = data.clientName ? data.clientName.replace(/^Mr\.\s*/i, '') : 'XXXXX';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice - ${data.clientName || 'Client'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-family: Georgia, Cambria, "Times New Roman", Times, serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .page-container {
      width: 210mm;
      box-sizing: border-box;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 2rem;
    }
  </style>
</head>
<body>
  <div class="page-container text-slate-900 leading-normal">
    
    <!-- HEADER SECTION -->
    <div class="flex justify-between items-start border-b-0 pb-4">
      <div class="space-y-0.5">
        <h1 class="text-base font-bold font-serif text-black uppercase tracking-tight">
          MATT ENGINEERING SOLUTIONS.
        </h1>
        <p class="text-[11px] font-bold italic font-serif text-black">
          WE LEAD TO DIGITAL ERA
        </p>
        <p class="text-[10px] font-serif text-black leading-tight mt-1">
          3rd Floor, Pillars Gate, opposite Anna Stadium, Vadasery Nagercoil,<br />
          Kanyakumari, Tamil Nadu 629001.<br />
          Mob: 7305197833 Web: mattengineeringsolutions.com
        </p>
      </div>

      <div class="shrink-0">
        ${logoBase64 ? `<img src="${logoBase64}" alt="Matt Logo" class="h-16 w-16 object-contain" />` : ''}
      </div>
    </div>

    <!-- INVOICE TITLE -->
    <div class="text-center my-6">
      <h2 class="text-2xl font-bold font-serif text-[#1f3864] tracking-wide">
        INVOICE
      </h2>
    </div>

    <!-- BILL TO & META SECTION -->
    <div class="grid grid-cols-12 gap-4 items-start mb-8">
      
      <!-- BILL TO (Left 5 cols) -->
      <div class="col-span-5 space-y-0.5">
        <h3 class="text-xs font-bold font-serif text-[#1f3864] uppercase tracking-wider">
          BILL TO
        </h3>
        <p class="text-xs font-bold font-serif text-black">
          Mr. ${clientFormatted}
        </p>
        <p class="text-xs font-serif text-black">
          ${data.place || 'Nagercoil'}
        </p>
      </div>

      <!-- META BOXED TABLE (Right 7 cols) -->
      <div class="col-span-7 border border-slate-600 text-xs">
        <div class="grid grid-cols-2 border-b border-slate-600">
          <div class="p-1.5 font-bold font-serif border-r border-slate-600 text-black">
            Invoice Date
          </div>
          <div class="p-1.5 font-serif text-black">
            ${data.invoiceDate || 'DD/MM/YYYY'}
          </div>
        </div>

        <div class="grid grid-cols-2 border-b border-slate-600">
          <div class="p-1.5 font-bold font-serif border-r border-slate-600 text-black">
            Due Date
          </div>
          <div class="p-1.5 font-serif text-black">
            ${data.dueDate || 'DD/MM/YYYY'}
          </div>
        </div>

        <div class="grid grid-cols-2">
          <div class="p-1.5 font-bold font-serif border-r border-slate-600 text-black">
            Reference Quotation
          </div>
          <div class="p-1.5 font-serif text-black">
            ${data.referenceQuotationDate ? `Dated ${data.referenceQuotationDate}` : 'Dated 29/09/2022'}
          </div>
        </div>
      </div>

    </div>

    <!-- INVOICE ITEMS TABLE -->
    <div class="border border-slate-600 mb-0">
      <table class="w-full text-xs font-serif border-collapse">
        <thead>
          <tr class="bg-[#1f3864] text-white">
            <th class="p-2 border-r border-slate-600 font-bold text-center w-10">#</th>
            <th class="p-2 border-r border-slate-600 font-bold text-left">Description</th>
            <th class="p-2 font-bold text-right w-36">Amount (INR)</th>
          </tr>
        </thead>
        <tbody>
          <!-- Row 1 -->
          <tr class="border-t border-slate-600">
            <td class="p-2.5 border-r border-slate-600 text-center font-serif align-top">1</td>
            <td class="p-2.5 border-r border-slate-600 font-serif align-top">
              Website Development – Original Quotation Scope (${data.phase1Scope || 'Koticlean – Carpet & Sofa Cleaning Service Website'})
            </td>
            <td class="p-2.5 font-serif text-right align-top">
              ${formatCurrency(amt1)}
            </td>
          </tr>

          <!-- Row 2 (if present) -->
          ${(amt2 > 0 || data.phase2Scope) ? `
          <tr class="border-t border-slate-600">
            <td class="p-2.5 border-r border-slate-600 text-center font-serif align-top">2</td>
            <td class="p-2.5 border-r border-slate-600 font-serif align-top">
              Additional Work Features (${data.phase2Scope || 'Specialized Service Pages, Booking Wizards, Admin CMS Modules, Infrastructure'})
            </td>
            <td class="p-2.5 font-serif text-right align-top">
              ${formatCurrency(amt2)}
            </td>
          </tr>
          ` : ''}
        </tbody>
      </table>
    </div>

    <!-- SUBTOTAL ROW -->
    <div class="flex justify-end border-x border-b border-slate-600 text-xs font-serif">
      <div class="p-2 font-bold text-right w-44 border-r border-slate-600">
        Subtotal
      </div>
      <div class="p-2 font-bold text-right w-36">
        INR ${formatCurrency(subtotal)}
      </div>
    </div>

    <!-- TOTAL AMOUNT DUE HIGHLIGHTED CREAM BANNER -->
    <div class="flex justify-between items-center bg-[#fffbeb] border border-slate-600 p-2.5 mt-2 text-xs font-serif">
      <div class="font-bold text-[#1f3864] text-sm uppercase tracking-wide">
        TOTAL AMOUNT DUE
      </div>
      <div class="font-bold text-[#1f3864] text-sm">
        INR ${formatCurrency(totalAmountDue)}
      </div>
    </div>

    <!-- SIGNATURE SECTION -->
    <div class="mt-12 space-y-1 text-xs font-serif">
      <p class="font-serif text-black">For MATT ENGINEERING SOLUTIONS</p>
      <div class="py-2">
        ${signBase64 ? `<img src="${signBase64}" alt="Signature" class="h-10 object-contain" />` : ''}
      </div>
      <p class="font-bold font-serif text-black">Mr. MOHAMMED SHAHEER</p>
      <p class="font-bold font-serif text-black">Managing Director</p>
      <p class="italic font-serif text-slate-700">Authorized Signatory</p>
    </div>

  </div>
</body>
</html>`;
}
