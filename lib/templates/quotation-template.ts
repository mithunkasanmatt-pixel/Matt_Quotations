import { getLocalAssetAsBase64 } from '@/lib/pdf-generator';

export interface QuotationTemplateItem {
  section?: string;
  title: string;
  description?: string;
  hours?: number;
  rate?: number;
  amount?: number;
}

export interface QuotationTemplateData {
  quotation_number?: string;
  quotation_date?: string | Date;
  valid_until?: string | Date;
  client_name?: string;
  place?: string;
  sir_madam?: string;
  project_name?: string;
  technology?: string;
  duration?: string;
  grand_total?: number;
  currency?: string;
  notes?: string;
  items?: QuotationTemplateItem[];
}

export function generateQuotationHtml(quote: QuotationTemplateData): string {
  const logoBase64 = getLocalAssetAsBase64('logo.png');
  const signBase64 = getLocalAssetAsBase64('sign.png');

  const formatCurrency = (val: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: quote.currency || 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatDateShort = (d?: string | Date) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return String(d);
    }
  };

  const formatDateGb = (d?: string | Date) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('en-GB');
    } catch {
      return String(d);
    }
  };

  const items = quote.items || [];
  const groupedItems = items.reduce((acc: Record<string, QuotationTemplateItem[]>, item) => {
    const sec = item.section || 'General Details';
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(item);
    return acc;
  }, {});

  const leftSections = Object.keys(groupedItems).filter((_, idx) => idx % 2 === 0);
  const rightSections = Object.keys(groupedItems).filter((_, idx) => idx % 2 !== 0);

  const renderSectionList = (sectionNames: string[]) => {
    return sectionNames.map((secName) => {
      const sectionItems = groupedItems[secName] || [];
      return `
        <div class="text-xs mb-5">
          <h4 class="font-bold text-slate-900 mb-2 uppercase tracking-wide border-b border-slate-100 pb-0.5">
            ${secName}
          </h4>
          <ul class="list-disc pl-5 space-y-1.5 text-slate-600 leading-relaxed">
            ${sectionItems.map((item) => `<li>${item.title}</li>`).join('')}
          </ul>
        </div>
      `;
    }).join('');
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Quotation Preview - ${quote.quotation_number || ''}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .page-container {
      width: 100%;
      box-sizing: border-box;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .page-break-before {
      break-before: page;
      page-break-before: always;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="page-container text-slate-800">
    <table class="w-full border-collapse">
      <thead>
        <tr>
          <td class="pb-4">
            <!-- 1. BRANDING HEADER -->
            <div class="flex justify-between items-start border-b-2 border-sky-600 pb-5">
              <div class="flex gap-4 items-center">
                ${logoBase64 ? `<img src="${logoBase64}" alt="Matt Engineering Solutions Logo" class="h-14 w-auto object-contain" />` : ''}
                <div>
                  <h1 class="text-xl font-bold tracking-tight text-slate-900 uppercase">MATT ENGINEERING SOLUTIONS.</h1>
                  <span class="text-xs font-semibold text-sky-600 uppercase tracking-widest block mt-0.5">WE LEAD TO DIGITAL ERA</span>
                </div>
              </div>
              <div class="text-right text-[10px] leading-normal text-slate-500">
                <p>3rd Floor, Pillars Gate, opposite Anna Stadium,</p>
                <p>Vadasery Nagercoil, Kanyakumari,</p>
                <p>Tamil Nadu 629001.</p>
              </div>
            </div>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <!-- 2. PROPOSAL METADATA -->
            <div class="grid grid-cols-2 gap-6 bg-slate-50 border border-slate-200 p-6 rounded-md my-6 text-xs leading-relaxed">
              <div class="space-y-1">
                <span class="font-bold text-slate-900 block mb-1">PROPOSAL PREPARED FOR:</span>
                <p class="font-semibold text-slate-800 text-sm">${quote.client_name || ''}</p>
                <p class="font-medium text-slate-700">${quote.place || ''}</p>
              </div>
              
              <div class="space-y-1 text-left pl-12">
                <span class="font-bold text-slate-900 block mb-1">QUOTATION DOCUMENT:</span>
                <p><span class="font-semibold text-slate-700">Quote Number:</span> <span class="font-bold text-sky-600">${quote.quotation_number || ''}</span></p>
                <p><span class="font-semibold text-slate-700">Date Issued:</span> ${formatDateShort(quote.quotation_date)}</p>
                <p><span class="font-semibold text-slate-700">Valid Until:</span> ${formatDateShort(quote.valid_until)}</p>
              </div>
            </div>

            <!-- 3. PROJECT SCOPE BRIEF -->
            <div class="my-6 text-xs space-y-4">
              <p class="text-slate-800">Dear ${quote.sir_madam || 'Sir/Madam'},</p>
              <h3 class="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1 uppercase">
                Sub: Quotation for ${quote.project_name || 'Project'} Development
              </h3>
              <p class="text-slate-600 leading-relaxed font-medium">
                As per our discussion through meeting and phone call, here-with we have mentioned all the Deliverables based on your requirement:
              </p>
            </div>

            <!-- 4. TWO-COLUMN GRID -->
            <div class="grid grid-cols-2 border border-slate-300 divide-x divide-slate-300 rounded-sm my-6 bg-white overflow-hidden">
              <!-- Left Column -->
              <div class="p-4 space-y-5">
                ${renderSectionList(leftSections)}
              </div>
              <!-- Right Column -->
              <div class="p-4 space-y-5">
                ${renderSectionList(rightSections)}
              </div>
            </div>

            <!-- 5. COMMERCIAL SUMMARY BOX -->
            <div class="bg-slate-50 border border-slate-200 p-5 rounded-md my-6 text-xs">
              <h4 class="font-bold text-slate-900 mb-3 border-b border-slate-200 pb-1">TECHNICAL & COMMERCIAL DETAILS</h4>
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <span class="font-bold text-slate-500 block uppercase tracking-wider text-[9px]">Web-Application platform</span>
                  <span class="font-semibold text-slate-800 text-sm">${quote.technology || ''}</span>
                </div>
                <div>
                  <span class="font-bold text-slate-500 block uppercase tracking-wider text-[9px]">Duration</span>
                  <span class="font-semibold text-slate-800 text-sm">${quote.duration || ''}</span>
                </div>
                <div>
                  <span class="font-bold text-slate-500 block uppercase tracking-wider text-[9px]">Development charges</span>
                  <span class="font-bold text-sky-600 text-sm">${formatCurrency(quote.grand_total || 0)}</span>
                </div>
              </div>
            </div>

            <!-- 6. CONDITIONS & PAYMENT DETAILS -->
            <div class="page-break-before my-6 space-y-4 text-xs border-t border-slate-200 pt-4">
              <div>
                <h4 class="font-bold text-slate-950">Support:</h4>
                <p class="text-slate-600 mt-0.5">3 months support will be provided free of cost.</p>
              </div>
              <div>
                <h4 class="font-bold text-slate-950">Project duration and delivery:</h4>
                <p class="text-slate-600 mt-0.5 leading-relaxed">
                  The above delivery time is only applicable for the requirements mentioned in the table.<br />
                  Additional development charge and duration will be applicable for future modifications and changes.
                </p>
              </div>
              <div>
                <h4 class="font-bold text-slate-950">Payment terms:</h4>
                <p class="text-slate-600 mt-0.5">
                  ${quote.notes || '50% advance - 20% while testing - 30% when launch.'}
                </p>
              </div>
              <div>
                <h4 class="font-bold text-slate-950">Phase Scope & Milestones:</h4>
                <p class="text-slate-600 mt-0.5 leading-relaxed">
                  All the features mentioned in this quotation are included in <strong class="text-slate-900 font-semibold">Phase 1</strong>. Any new features requested after this phase will be considered <strong class="text-slate-900 font-semibold">Phase 2</strong> and will be developed separately. No new features will be added during Phase 1 until all the features listed in this quotation are fully completed.
                </p>
              </div>
              <div>
                <h4 class="font-bold text-slate-950">NDA:</h4>
                <p class="text-slate-600 mt-0.5">Non-disclosure agreement can be signed for confidentiality.</p>
              </div>
            </div>

            <!-- 7. SIGNATURE LAYOUT -->
            <div class="mt-12 text-xs flex justify-between border-t border-dashed border-slate-200 pt-6">
              <div class="text-left w-1/2">
                <p class="font-bold text-slate-800">For CLIENT Approval:</p>
                <div class="h-16"></div>
                <p>_____________________________________</p>
                <p class="text-[10px] text-slate-500 mt-1">Authorized Signatory (Date)</p>
              </div>
              <div class="text-right flex flex-col items-end w-1/2">
                <p class="font-bold text-slate-800">For MATT ENGINEERING SOLUTIONS</p>
                <div class="h-16 flex items-center justify-center py-1">
                  ${signBase64 ? `<img src="${signBase64}" alt="Mohammed Shaheer Signature" class="h-12 w-auto object-contain" />` : ''}
                </div>
                <p class="font-bold text-slate-800">Mr. MOHAMMED SHAHEER</p>
                <p class="text-[10px] text-slate-500 mt-0.5">Managing Director</p>
              </div>
            </div>

            <!-- 8. FOOTER -->
            <div class="mt-10 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
              Date: ${formatDateGb(quote.quotation_date)} | Place: ${quote.place || ''} | Mob: 7305197833 | Web: mattengineeringsolutions.com
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>`;
}
