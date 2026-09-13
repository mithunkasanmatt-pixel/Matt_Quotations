"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useQuotations, QuotationData } from "@/hooks/useQuotations";
import { useToast } from "@/components/ui/toast";
import { ArrowLeft, Download, Mail, Printer, Edit, Copy, Check, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

export default function QuotationPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const quotationId = parseInt(id);
  const router = useRouter();

  const { toast } = useToast();
  const { getQuotation, updateQuotation, downloadQuotationPdf, sendQuotationEmail, loading } = useQuotations();
  const [quote, setQuote] = React.useState<QuotationData | null>(null);
  const [downloading, setDownloading] = React.useState<boolean>(false);

  // Status edit state
  const [isStatusOpen, setIsStatusOpen] = React.useState<boolean>(false);
  const [statusVal, setStatusVal] = React.useState<string>("");
  const [validUntilVal, setValidUntilVal] = React.useState<string>("");
  const [notesVal, setNotesVal] = React.useState<string>("");

  // Email Send Form state
  const [isEmailOpen, setIsEmailOpen] = React.useState<boolean>(false);
  const [emailTo, setEmailTo] = React.useState<string>("");
  const [emailSubject, setEmailSubject] = React.useState<string>("");
  const [emailBody, setEmailBody] = React.useState<string>("");

  const handleDownloadPdf = async () => {
    const element = document.getElementById("quotation-print-container");
    if (!element) return;

    setDownloading(true);
    try {
      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2.5,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const elementWidth = element.offsetWidth || 800;
      const elementHeight = element.offsetHeight || 1050;
      const imgHeight = (elementHeight * pdfWidth) / elementWidth;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(dataUrl, "PNG", 0, position, pdfWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, position, pdfWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }

      pdf.save(`Quotation_${quote?.quotation_number || id}.pdf`);
      toast("Success", "PDF downloaded successfully", "success");
    } catch (error: any) {
      console.error("PDF download error:", error);
      toast("Error", error.message || "Failed to generate PDF download", "error");
    } finally {
      setDownloading(false);
    }
  };

  const loadQuotationData = React.useCallback(async () => {
    if (quotationId) {
      const data = await getQuotation(quotationId);
      if (data) {
        setQuote(data);
        setStatusVal(data.status || "Draft");
        setValidUntilVal(data.valid_until || "");
        setNotesVal(data.notes || "");
      }
    }
  }, [quotationId, getQuotation]);

  React.useEffect(() => {
    loadQuotationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotationId]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quote) {
      const res = await updateQuotation(quotationId, {
        status: statusVal,
        valid_until: validUntilVal,
        notes: notesVal
      });
      if (res) {
        setIsStatusOpen(false);
        loadQuotationData();
      }
    }
  };

  const handleOpenEmail = () => {
    if (quote) {
      setEmailTo(quote.client_email || "");
      setEmailSubject(`Project Proposal & Quotation - ${quote.quotation_number}`);
      
      const greeting = quote.client_name ? `Dear ${quote.client_name},` : "Hello,";
      const body = `${greeting}\n\nPlease find attached our official project proposal and quotation (${quote.quotation_number}) for the "${quote.project_name || 'Project'}" development effort.\n\nWe have outlined the complete scope, module breakdown, effort estimates, and payment milestones in the attached document. Please review it and feel free to reach out if you have any questions or feedback.\n\nLooking forward to working with you!\n\nBest regards,\nAntigravity Software Solutions team`;
      
      setEmailBody(body);
      setIsEmailOpen(true);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo || !emailSubject || !emailBody) return;

    const ok = await sendQuotationEmail(quotationId, {
      email: emailTo,
      subject: emailSubject,
      message: emailBody
    });

    if (ok) {
      setIsEmailOpen(false);
      loadQuotationData();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !quote) {
    return (
      <DashboardLayout title="Quotation Proposal">
        <div className="text-center py-12 text-muted-foreground animate-pulse">
          Loading proposal preview...
        </div>
      </DashboardLayout>
    );
  }

  if (!quote) {
    return (
      <DashboardLayout title="Quotation Proposal">
        <div className="text-center py-12 text-rose-500">
          Quotation not found.
        </div>
      </DashboardLayout>
    );
  }

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: quote.currency || 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const groupedItems = (quote.items || []).reduce((acc: any, item) => {
    const sec = item.section || "General Details";
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(item);
    return acc;
  }, {});

  const leftSections = Object.keys(groupedItems).filter((_, idx) => idx % 2 === 0);
  const rightSections = Object.keys(groupedItems).filter((_, idx) => idx % 2 !== 0);

  return (
    <DashboardLayout title={`Quotation Preview: ${quote.quotation_number}`}>
      <div className="space-y-6 print:space-y-0 print:p-0">
        
        {/* ACTION COMMAND BAR */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-card border border-border/60 p-4 rounded-lg print:hidden">
          <Link href="/quotations" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Registry
          </Link>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setIsStatusOpen(true)} variant="outline" size="sm" className="h-9">
              <Edit className="h-4 w-4" />
              Update Status
            </Button>
            <Button onClick={handlePrint} variant="outline" size="sm" className="h-9">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button
              onClick={handleDownloadPdf}
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              isLoading={downloading}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button onClick={handleOpenEmail} variant="default" size="sm" className="h-9 gap-1.5" isLoading={loading}>
              <Mail className="h-4 w-4" />
              Send to Client
            </Button>
          </div>
        </div>

        {/* HIGH-FIDELITY PREVIEW CANVAS (A4 ASPECT LAYOUT) */}
        <div className="flex justify-center bg-muted/20 border border-border/40 py-8 rounded-lg shadow-2xs print:bg-transparent print:border-none print:shadow-none print:p-0">
          <div
            id="quotation-print-container"
            className="w-full max-w-[800px] min-h-[1050px] bg-white text-slate-800 p-12 border border-slate-200 shadow-lg rounded-sm print:shadow-none print:border-none print:p-0 print:w-full print:min-h-0"
          >
            
            {/* 1. BRANDING HEADER */}
            <div className="flex justify-between items-start border-b-2 border-sky-600 pb-5">
              <div className="flex gap-4 items-center">
                <img src="/logo.png" alt="Matt Engineering Solutions Logo" className="h-14 w-auto object-contain" />
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">MATT ENGINEERING SOLUTIONS.</h1>
                  <span className="text-xs font-semibold text-sky-600 uppercase tracking-widest block mt-0.5">WE LEAD TO DIGITAL ERA</span>
                </div>
              </div>
              <div className="text-right text-[10px] leading-normal text-slate-500">
                <p>3rd Floor, Pillars Gate, opposite Anna Stadium,</p>
                <p>Vadasery Nagercoil, Kanyakumari,</p>
                <p>Tamil Nadu 629001.</p>
              </div>
            </div>

            {/* 2. PROPOSAL METADATA */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 border border-slate-200 p-6 rounded-md my-6 text-xs leading-relaxed">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 block mb-1">PROPOSAL PREPARED FOR:</span>
                <p className="font-semibold text-slate-800 text-sm">{quote.client_name}</p>
                <p className="font-medium text-slate-700">{quote.place}</p>
              </div>
              
              <div className="space-y-1 text-right sm:text-left sm:pl-12">
                <span className="font-bold text-slate-900 block mb-1">QUOTATION DOCUMENT:</span>
                <p><span className="font-semibold text-slate-700">Quote Number:</span> <span className="font-bold text-primary">{quote.quotation_number}</span></p>
                <p><span className="font-semibold text-slate-700">Date Issued:</span> {quote.quotation_date ? new Date(quote.quotation_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ""}</p>
                <p><span className="font-semibold text-slate-700">Valid Until:</span> {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ""}</p>
              </div>
            </div>

            {/* 3. PROJECT SCOPE BRIEF */}
            <div className="my-6 text-xs space-y-4">
              <p className="text-slate-800">Dear {quote.sir_madam},</p>
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1 uppercase">
                Sub: Quotation for {quote.project_name} Development
              </h3>
              <p className="text-slate-600 leading-relaxed font-medium">
                As per our discussion through meeting and phone call, here-with we have mentioned all the Deliverables based on your requirement:
              </p>
            </div>

            {/* 4. TWO-COLUMN GRID */}
            <div className="grid grid-cols-2 border border-slate-300 divide-x divide-slate-300 rounded-sm my-6 bg-white overflow-hidden">
              {/* Left Column */}
              <div className="p-4 space-y-5">
                {leftSections.map((sectionName) => (
                  <div key={sectionName} className="text-xs">
                    <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wide border-b border-slate-100 pb-0.5">
                      {sectionName}
                    </h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-slate-600 leading-relaxed">
                      {groupedItems[sectionName].map((item: any, idx: number) => (
                        <li key={idx}>
                          {item.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {/* Right Column */}
              <div className="p-4 space-y-5">
                {rightSections.map((sectionName) => (
                  <div key={sectionName} className="text-xs">
                    <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wide border-b border-slate-100 pb-0.5">
                      {sectionName}
                    </h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-slate-600 leading-relaxed">
                      {groupedItems[sectionName].map((item: any, idx: number) => (
                        <li key={idx}>
                          {item.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. COMMERCIAL SUMMARY BOX */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-md my-6 text-xs">
              <h4 className="font-bold text-slate-900 mb-3 border-b border-slate-200 pb-1">TECHNICAL & COMMERCIAL DETAILS</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="font-bold text-slate-500 block uppercase tracking-wider text-[9px]">Web-Application platform</span>
                  <span className="font-semibold text-slate-800 text-sm">{quote.technology}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block uppercase tracking-wider text-[9px]">Duration</span>
                  <span className="font-semibold text-slate-800 text-sm">{quote.duration}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block uppercase tracking-wider text-[9px]">Development charges</span>
                  <span className="font-bold text-sky-600 text-sm">{formatCurrency(quote.grand_total)}</span>
                </div>
              </div>
            </div>

            {/* 6. CONDITIONS & PAYMENT DETAILS */}
            <div className="my-6 space-y-4 text-xs border-t border-slate-200 pt-4">
              <div>
                <h4 className="font-bold text-slate-950">Support:</h4>
                <p className="text-slate-600 mt-0.5">3 months support will be provided free of cost.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-950">Project duration and delivery:</h4>
                <p className="text-slate-600 mt-0.5 leading-relaxed">
                  The above delivery time is only applicable for the requirements mentioned in the table.<br />
                  Additional development charge and duration will be applicable for future modifications and changes.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-950">Payment terms:</h4>
                <p className="text-slate-600 mt-0.5">
                  {quote.notes || "50% advance - 20% while testing - 30% when launch."}
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-950">Phase Scope & Milestones:</h4>
                <p className="text-slate-600 mt-0.5 leading-relaxed">
                  All the features mentioned in this quotation are included in <strong className="text-slate-900 font-semibold">Phase 1</strong>. Any new features requested after this phase will be considered <strong className="text-slate-900 font-semibold">Phase 2</strong> and will be developed separately. No new features will be added during Phase 1 until all the features listed in this quotation are fully completed.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-950">NDA:</h4>
                <p className="text-slate-600 mt-0.5">Non-disclosure agreement can be signed for confidentiality.</p>
              </div>
            </div>

            {/* 7. SIGNATURE LAYOUT */}
            <div className="mt-12 text-xs flex justify-between border-t border-dashed border-slate-200 pt-6">
              <div className="text-left w-1/2">
                <p className="font-bold text-slate-800">For CLIENT Approval:</p>
                <div className="h-16" />
                <p>_____________________________________</p>
                <p className="text-[10px] text-slate-500 mt-1">Authorized Signatory (Date)</p>
              </div>
              <div className="text-right flex flex-col items-end w-1/2">
                <p className="font-bold text-slate-800">For MATT ENGINEERING SOLUTIONS</p>
                <div className="h-16 flex items-center justify-center py-1">
                  <img src="/sign.png" alt="Mohammed Shaheer Signature" className="h-12 w-auto object-contain" />
                </div>
                <p className="font-bold text-slate-800">Mr. MOHAMMED SHAHEER</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Managing Director</p>
              </div>
            </div>

            {/* 8. FOOTER */}
            <div className="mt-10 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
              Date: {quote.quotation_date ? new Date(quote.quotation_date).toLocaleDateString('en-GB') : ""} | Place: {quote.place} | Mob: 7305197833 | Web: mattengineeringsolutions.com
            </div>

          </div>
        </div>

        {/* DIALOG 1: STATUS & VALIDITY OVERRIDES */}
        <Dialog isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)}>
          <DialogHeader>
            <DialogTitle>Update Quotation Status</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateStatus}>
            <DialogContent className="space-y-4">
              <Select
                label="Quotation Status"
                options={[
                  { label: "Draft", value: "Draft" },
                  { label: "Generated", value: "Generated" },
                  { label: "Sent", value: "Sent" },
                  { label: "Viewed", value: "Viewed" },
                  { label: "Accepted", value: "Accepted" },
                  { label: "Rejected", value: "Rejected" },
                  { label: "Expired", value: "Expired" }
                ]}
                value={statusVal}
                onChange={(e) => setStatusVal(e.target.value)}
              />
              <Input
                label="Valid Until"
                type="date"
                value={validUntilVal}
                onChange={(e) => setValidUntilVal(e.target.value)}
              />
              <Textarea
                label="Quotation Notes / Terms Overrides"
                rows={4}
                value={notesVal}
                onChange={(e) => setNotesVal(e.target.value)}
              />
            </DialogContent>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsStatusOpen(false)}>Cancel</Button>
              <Button type="submit" variant="default">Save Overrides</Button>
            </DialogFooter>
          </form>
        </Dialog>

        {/* DIALOG 2: EMAIL DELIVER MODAL */}
        <Dialog isOpen={isEmailOpen} onClose={() => setIsEmailOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-500" />
              Email Proposal PDF to Client
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendEmail}>
            <DialogContent className="space-y-4 max-h-[65vh]">
              <Input
                label="Client Email Address"
                type="email"
                required
                placeholder="client@acme.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
              />
              
              <Input
                label="Email Subject"
                required
                placeholder="Project Quotation"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />

              <Textarea
                label="Message Body"
                required
                rows={7}
                placeholder="Type your message to the client here..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
              
              <div className="flex items-center gap-2 border border-border bg-muted/30 p-3 rounded-lg text-xs text-muted-foreground">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 border border-primary/20 shrink-0 font-bold text-[10px] text-primary">
                  PDF
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-foreground truncate block">
                    Quotation_{quote.quotation_number}.pdf
                  </span>
                  <span>Automatic attachment generated on delivery.</span>
                </div>
              </div>
            </DialogContent>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEmailOpen(false)}>Cancel</Button>
              <Button type="submit" variant="default" disabled={!emailTo || !emailSubject || !emailBody} isLoading={loading}>
                <Send className="h-4 w-4" />
                Send Email
              </Button>
            </DialogFooter>
          </form>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
