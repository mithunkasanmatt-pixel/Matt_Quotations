"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { QuotationData } from "@/hooks/useQuotations";
import { 
  FileText, 
  Download, 
  Layers, 
  CheckCircle2, 
  Search, 
  Calendar, 
  User, 
  MapPin, 
  DollarSign, 
  Sparkles,
  Receipt
} from "lucide-react";

export default function GenerateInvoicePage() {
  const { toast } = useToast();

  const [allQuotations, setAllQuotations] = React.useState<QuotationData[]>([]);
  const [loadingQuotations, setLoadingQuotations] = React.useState<boolean>(true);
  const [selectedPhase1Id, setSelectedPhase1Id] = React.useState<string>("");
  const [selectedPhase2Id, setSelectedPhase2Id] = React.useState<string>("");

  // Invoice Form Fields
  const [clientName, setClientName] = React.useState<string>("");
  const [place, setPlace] = React.useState<string>("");

  const getTodayFormatted = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getDueDateFormatted = () => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [invoiceDate, setInvoiceDate] = React.useState<string>(getTodayFormatted());
  const [dueDate, setDueDate] = React.useState<string>(getDueDateFormatted());
  const [referenceQuotationDate, setReferenceQuotationDate] = React.useState<string>("");

  const [phase1Scope, setPhase1Scope] = React.useState<string>("");
  const [phase1Amount, setPhase1Amount] = React.useState<string>("0");

  const [phase2Scope, setPhase2Scope] = React.useState<string>("");
  const [phase2Amount, setPhase2Amount] = React.useState<string>("0");

  const [isDownloading, setIsDownloading] = React.useState<boolean>(false);

  // Fetch quotations list
  React.useEffect(() => {
    async function loadQuotations() {
      setLoadingQuotations(true);
      const res = await apiFetch("/quotations");
      setLoadingQuotations(false);
      if (res.success && res.data) {
        setAllQuotations(res.data);
      }
    }
    loadQuotations();
  }, []);

  // Filter Phase 1 and Phase 2 quotations
  const phase1Quotations = allQuotations.filter(q => !q.phase || q.phase === 'Phase 1');
  const phase2Quotations = allQuotations.filter(q => q.phase === 'Phase 2');

  // Handle Phase 1 selection
  const handlePhase1Change = (idStr: string) => {
    setSelectedPhase1Id(idStr);
    if (!idStr) return;

    const q1 = phase1Quotations.find(q => q.id === Number(idStr));
    if (q1) {
      setClientName(q1.client_name || "");
      setPlace(q1.place || "");
      setPhase1Scope(q1.project_name || "Original Quotation Scope");
      setPhase1Amount(String(q1.grand_total || 0));

      if (q1.quotation_date) {
        const parts = q1.quotation_date.split('-');
        if (parts.length === 3) {
          setReferenceQuotationDate(`${parts[2]}/${parts[1]}/${parts[0]}`);
        } else {
          setReferenceQuotationDate(q1.quotation_date);
        }
      }

      // Auto-detect linked Phase 2 quotation
      const linkedP2 = phase2Quotations.find(
        p2 => p2.parent_quotation_id === q1.id || (p2.client_name === q1.client_name && p2.project_name === q1.project_name)
      );

      if (linkedP2) {
        setSelectedPhase2Id(String(linkedP2.id));
        setPhase2Scope(linkedP2.project_name || "Additional Work Features");
        setPhase2Amount(String(linkedP2.grand_total || 0));
        toast("Found Phase 2 Quotation", `Auto-linked Phase 2 quotation for "${q1.project_name}"`, "info");
      } else {
        setSelectedPhase2Id("");
        setPhase2Scope("");
        setPhase2Amount("0");
      }
    }
  };

  // Handle Phase 2 selection override
  const handlePhase2Change = (idStr: string) => {
    setSelectedPhase2Id(idStr);
    if (!idStr) {
      setPhase2Scope("");
      setPhase2Amount("0");
      return;
    }

    const q2 = phase2Quotations.find(q => q.id === Number(idStr));
    if (q2) {
      setPhase2Scope(q2.project_name || "Additional Work Features");
      setPhase2Amount(String(q2.grand_total || 0));
    }
  };

  const amt1 = Number(phase1Amount) || 0;
  const amt2 = Number(phase2Amount) || 0;
  const subtotal = amt1 + amt2;
  const totalAmountDue = subtotal;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Handle PDF Download
  const handleDownloadPdf = async () => {
    if (!clientName.trim()) return toast("Validation Error", "Client Name is required.", "error");

    setIsDownloading(true);
    try {
      const response = await fetch("/api/invoices/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          place,
          invoiceDate,
          dueDate,
          referenceQuotationDate,
          phase1Scope,
          phase1Amount: amt1,
          phase2Scope,
          phase2Amount: amt2,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF (HTTP ${response.status})`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const cleanName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
      link.setAttribute("download", `Invoice_${cleanName}.pdf`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 200);

      toast("Success", "Invoice PDF downloaded successfully!", "success");
    } catch (err: any) {
      console.error("PDF download error:", err);
      toast("Error", err.message || "Failed to download PDF", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <DashboardLayout title="Generate Client Invoice">
      <div className="space-y-8 max-w-6xl mx-auto pb-16">
        
        {/* TOP INTRO BANNER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border/60 p-5 rounded-lg shadow-2xs">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Receipt className="h-5 w-5 text-indigo-600" />
              Phase 1 & Phase 2 Invoice Generator
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select Phase 1 and Phase 2 quotations to automatically compile and download a formatted invoice PDF.
            </p>
          </div>

          <Button
            onClick={handleDownloadPdf}
            isLoading={isDownloading}
            className="font-semibold cursor-pointer gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
          >
            <Download className="h-4.5 w-4.5" />
            Download Invoice PDF
          </Button>
        </div>

        {/* WORKSPACE GRID: Left Form Controls / Right Reference-Styled Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: SELECTION & PARAMETERS (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Step 1: Select Quotations */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4.5 w-4.5 text-indigo-600" />
                  Select Project / Quotations
                </CardTitle>
                <CardDescription className="text-xs">Pick Phase 1 and linked Phase 2 proposals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Phase 1 Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Phase 1 Quotation (Original Scope)
                  </label>
                  <Select
                    options={[
                      { label: "-- Select Phase 1 Project --", value: "" },
                      ...phase1Quotations.map(q => ({
                        label: `${q.project_name} (${q.client_name}) - ${formatCurrency(q.grand_total)}`,
                        value: String(q.id)
                      }))
                    ]}
                    value={selectedPhase1Id}
                    onChange={(e) => handlePhase1Change(e.target.value)}
                    className="text-xs"
                  />
                </div>

                {/* Phase 2 Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Phase 2 Quotation (Additional Features)
                  </label>
                  <Select
                    options={[
                      { label: "-- None / Select Phase 2 Project --", value: "" },
                      ...phase2Quotations.map(q => ({
                        label: `${q.project_name} (${q.client_name}) - ${formatCurrency(q.grand_total)}`,
                        value: String(q.id)
                      }))
                    ]}
                    value={selectedPhase2Id}
                    onChange={(e) => handlePhase2Change(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Invoice Details Form */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Invoice Parameters</CardTitle>
                <CardDescription className="text-xs">Customize client and date fields</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <Input
                  label="Client Name"
                  placeholder="e.g. Mr. XXXXX, John Doe"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="text-xs"
                />

                <Input
                  label="Place / City"
                  placeholder="e.g. Nagercoil, Bangalore"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  className="text-xs"
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Invoice Date"
                    placeholder="DD/MM/YYYY"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="text-xs"
                  />
                  <Input
                    label="Due Date"
                    placeholder="DD/MM/YYYY"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <Input
                  label="Reference Quotation Date"
                  placeholder="Dated DD/MM/YYYY"
                  value={referenceQuotationDate}
                  onChange={(e) => setReferenceQuotationDate(e.target.value)}
                  className="text-xs"
                />
              </CardContent>
            </Card>

            {/* Step 3: Amounts Override */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Line Item Scopes & Amounts</CardTitle>
                <CardDescription className="text-xs">Review or tweak items before generating PDF</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Item 1 */}
                <div className="p-3 border rounded-md space-y-2.5 bg-muted/10">
                  <span className="text-xs font-bold text-foreground">Line Item #1 (Phase 1)</span>
                  <Input
                    label="Scope Description"
                    value={phase1Scope}
                    onChange={(e) => setPhase1Scope(e.target.value)}
                    className="text-xs"
                  />
                  <Input
                    label="Amount (INR)"
                    type="number"
                    value={phase1Amount}
                    onChange={(e) => setPhase1Amount(e.target.value)}
                    className="text-xs"
                  />
                </div>

                {/* Item 2 */}
                <div className="p-3 border rounded-md space-y-2.5 bg-muted/10">
                  <span className="text-xs font-bold text-foreground">Line Item #2 (Phase 2)</span>
                  <Input
                    label="Scope Description"
                    value={phase2Scope}
                    onChange={(e) => setPhase2Scope(e.target.value)}
                    className="text-xs"
                  />
                  <Input
                    label="Amount (INR)"
                    type="number"
                    value={phase2Amount}
                    onChange={(e) => setPhase2Amount(e.target.value)}
                    className="text-xs"
                  />
                </div>

              </CardContent>
            </Card>

          </div>

          {/* RIGHT PANEL: LIVE VISUAL PREVIEW MATCHING REFERENCE IMAGE (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Live Invoice PDF Preview (Reference Design)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                isLoading={isDownloading}
                className="text-xs gap-1.5 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </Button>
            </div>

            {/* PREVIEW CONTAINER STYLED EXACTLY LIKE REFERENCE IMAGE */}
            <div className="bg-white text-slate-900 border border-slate-300 shadow-lg rounded-none p-8 font-serif leading-normal select-none">
              
              {/* HEADER SECTION */}
              <div className="flex justify-between items-start border-b-0 pb-4">
                <div className="space-y-0.5">
                  <h1 className="text-base font-bold font-serif text-black uppercase tracking-tight">
                    MATT ENGINEERING SOLUTIONS.
                  </h1>
                  <p className="text-[11px] font-bold italic font-serif text-black">
                    WE LEAD TO DIGITAL ERA
                  </p>
                  <p className="text-[10px] font-serif text-black leading-tight mt-1">
                    3rd Floor, Pillars Gate, opposite Anna Stadium, Vadasery Nagercoil,<br />
                    Kanyakumari, Tamil Nadu 629001.<br />
                    Mob: 7305197833 Web: mattengineeringsolutions.com
                  </p>
                </div>

                <div className="shrink-0">
                  <img src="/logo.png" alt="Matt Logo" className="h-16 w-16 object-contain" />
                </div>
              </div>

              {/* INVOICE TITLE */}
              <div className="text-center my-6">
                <h2 className="text-2xl font-bold font-serif text-[#1f3864] tracking-wide">
                  INVOICE
                </h2>
              </div>

              {/* BILL TO & META SECTION */}
              <div className="grid grid-cols-12 gap-4 items-start mb-8">
                
                {/* BILL TO (Left 5 cols) */}
                <div className="col-span-5 space-y-0.5">
                  <h3 className="text-xs font-bold font-serif text-[#1f3864] uppercase tracking-wider">
                    BILL TO
                  </h3>
                  <p className="text-xs font-bold font-serif text-black">
                    Mr. {clientName ? clientName.replace(/^Mr\.\s*/i, '') : 'XXXXX'}
                  </p>
                  <p className="text-xs font-serif text-black">
                    {place || 'Nagercoil'}
                  </p>
                </div>

                {/* META BOXED TABLE (Right 7 cols) */}
                <div className="col-span-7 border border-slate-600 text-xs">
                  <div className="grid grid-cols-2 border-b border-slate-600">
                    <div className="p-1.5 font-bold font-serif border-r border-slate-600 text-black">
                      Invoice Date
                    </div>
                    <div className="p-1.5 font-serif text-black">
                      {invoiceDate || 'DD/MM/YYYY'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 border-b border-slate-600">
                    <div className="p-1.5 font-bold font-serif border-r border-slate-600 text-black">
                      Due Date
                    </div>
                    <div className="p-1.5 font-serif text-black">
                      {dueDate || 'DD/MM/YYYY'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2">
                    <div className="p-1.5 font-bold font-serif border-r border-slate-600 text-black">
                      Reference Quotation
                    </div>
                    <div className="p-1.5 font-serif text-black">
                      {referenceQuotationDate ? `Dated ${referenceQuotationDate}` : 'Dated 29/09/2022'}
                    </div>
                  </div>
                </div>

              </div>

              {/* INVOICE ITEMS TABLE */}
              <div className="border border-slate-600 mb-0">
                <table className="w-full text-xs font-serif border-collapse">
                  <thead>
                    <tr className="bg-[#1f3864] text-white">
                      <th className="p-2 border-r border-slate-600 font-bold text-center w-10">#</th>
                      <th className="p-2 border-r border-slate-600 font-bold text-left">Description</th>
                      <th className="p-2 font-bold text-right w-36">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Row 1 */}
                    <tr className="border-t border-slate-600">
                      <td className="p-2.5 border-r border-slate-600 text-center font-serif align-top">1</td>
                      <td className="p-2.5 border-r border-slate-600 font-serif align-top">
                        Website Development – Original Quotation Scope ({phase1Scope || 'Koticlean – Carpet & Sofa Cleaning Service Website'})
                      </td>
                      <td className="p-2.5 font-serif text-right align-top">
                        {formatCurrency(amt1)}
                      </td>
                    </tr>

                    {/* Row 2 (if present) */}
                    {(amt2 > 0 || phase2Scope) && (
                      <tr className="border-t border-slate-600">
                        <td className="p-2.5 border-r border-slate-600 text-center font-serif align-top">2</td>
                        <td className="p-2.5 border-r border-slate-600 font-serif align-top">
                          Additional Work Features ({phase2Scope || 'Specialized Service Pages, Booking Wizards, Admin CMS Modules, Infrastructure'})
                        </td>
                        <td className="p-2.5 font-serif text-right align-top">
                          {formatCurrency(amt2)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* SUBTOTAL ROW */}
              <div className="flex justify-end border-x border-b border-slate-600 text-xs font-serif">
                <div className="p-2 font-bold text-right w-44 border-r border-slate-600">
                  Subtotal
                </div>
                <div className="p-2 font-bold text-right w-36">
                  INR {formatCurrency(subtotal)}
                </div>
              </div>

              {/* TOTAL AMOUNT DUE HIGHLIGHTED CREAM BANNER */}
              <div className="flex justify-between items-center bg-[#fffbeb] border border-slate-600 p-2.5 mt-2 text-xs font-serif">
                <div className="font-bold text-[#1f3864] text-sm uppercase tracking-wide">
                  TOTAL AMOUNT DUE
                </div>
                <div className="font-bold text-[#1f3864] text-sm">
                  INR {formatCurrency(totalAmountDue)}
                </div>
              </div>

              {/* SIGNATURE SECTION */}
              <div className="mt-12 space-y-1 text-xs font-serif">
                <p className="font-serif text-black">For MATT ENGINEERING SOLUTIONS</p>
                <div className="py-2">
                  <img src="/sign.png" alt="Signature" className="h-10 object-contain" />
                </div>
                <p className="font-bold font-serif text-black">Mr. MOHAMMED SHAHEER</p>
                <p className="font-bold font-serif text-black">Managing Director</p>
                <p className="italic font-serif text-slate-700">Authorized Signatory</p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
