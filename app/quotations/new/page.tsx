"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { QuotationData } from "@/hooks/useQuotations";
import { 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Save, 
  Upload, 
  Sparkles, 
  FileText, 
  Layers, 
  Search, 
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";

interface TitleSection {
  title: string;
  points: string[];
}

function parseUploadedScopeContent(rawText: string): TitleSection[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const parsedSections: TitleSection[] = [];
  let currentSection: TitleSection | null = null;

  const bulletRegex = /^\s*[\*\-\•\+\>]\s*(.*)$/;
  const headingRegex = /^\s*(?:#+\s*)?(?:\*\*)?\s*(?:(?:Section|Module)\s+)?\d+[\.\)\:\-]\s*(.+?)(?:\*\*)?\s*$/i;

  for (const line of lines) {
    const isBullet = bulletRegex.test(line);

    if (!isBullet) {
      const headingMatch = line.match(headingRegex);
      if (headingMatch && headingMatch[1]) {
        let titleText = headingMatch[1].trim();
        titleText = titleText.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();

        if (titleText) {
          currentSection = {
            title: titleText,
            points: []
          };
          parsedSections.push(currentSection);
          continue;
        }
      }
    }

    let cleanPoint = line
      .replace(/^\s*[\*\-\•\+\>]\s*/, '')
      .replace(/^\*\*/, '')
      .replace(/\*\*$/, '')
      .trim();

    if (currentSection) {
      if (cleanPoint) {
        currentSection.points.push(cleanPoint);
      }
    } else if (cleanPoint) {
      currentSection = {
        title: cleanPoint.replace(/^\d+[\.\)\:\-]\s*/, ''),
        points: []
      };
      parsedSections.push(currentSection);
    }
  }

  return parsedSections.filter(s => s.title.trim().length > 0);
}

export default function NewQuotationPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Phase selection state
  const [selectedPhase, setSelectedPhase] = React.useState<'Phase 1' | 'Phase 2' | null>(null);
  const [phase1Quotations, setPhase1Quotations] = React.useState<QuotationData[]>([]);
  const [loadingPhase1List, setLoadingPhase1List] = React.useState<boolean>(false);
  const [selectedPhase1Quotation, setSelectedPhase1Quotation] = React.useState<QuotationData | null>(null);
  const [phase1Search, setPhase1Search] = React.useState<string>("");

  // Form Fields
  const [clientName, setClientName] = React.useState<string>("");
  const [place, setPlace] = React.useState<string>("");
  const [sirMadam, setSirMadam] = React.useState<string>("Sir / Madam");
  const [quotationTitle, setQuotationTitle] = React.useState<string>("");
  const [technology, setTechnology] = React.useState<string>("");
  const [duration, setDuration] = React.useState<string>("");
  const [amount, setAmount] = React.useState<string>("");

  const DEFAULT_PHASE_1_NOTE = "All the features mentioned in this quotation are included in Phase 1. Any new features requested after this phase will be considered Phase 2 and will be developed separately. No new features will be added during Phase 1 until all the features listed in this quotation are fully completed.";
  const DEFAULT_PHASE_2_NOTE = "All the features mentioned in this quotation are included in Phase 2. Any new features requested after this phase will be considered Phase 3 and will be developed separately. No new features will be added during Phase 2 until all the features listed in this quotation are fully completed.";
  
  const [notes, setNotes] = React.useState<string>(DEFAULT_PHASE_1_NOTE);

  // Dynamic Titles and Points
  const [sections, setSections] = React.useState<TitleSection[]>([]);
  const [isUploadOpen, setIsUploadOpen] = React.useState<boolean>(false);
  const [uploadText, setUploadText] = React.useState<string>("");

  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  // Fetch Phase 1 quotations when Phase 2 is selected
  const fetchPhase1List = React.useCallback(async () => {
    setLoadingPhase1List(true);
    const res = await apiFetch("/quotations");
    setLoadingPhase1List(false);
    if (res.success && res.data) {
      // Filter for Phase 1 quotations or all existing quotations created without Phase 2 tag
      const phase1List = (res.data as QuotationData[]).filter(q => !q.phase || q.phase === 'Phase 1');
      setPhase1Quotations(phase1List);
    } else {
      toast("Error", res.message || "Failed to load Phase 1 quotations.", "error");
    }
  }, [toast]);

  const handleSelectPhase = (phase: 'Phase 1' | 'Phase 2') => {
    setSelectedPhase(phase);
    if (phase === 'Phase 1') {
      setNotes(DEFAULT_PHASE_1_NOTE);
      setSelectedPhase1Quotation(null);
    } else {
      setNotes(DEFAULT_PHASE_2_NOTE);
      fetchPhase1List();
    }
  };

  const handlePickPhase1Quotation = (q: QuotationData) => {
    setSelectedPhase1Quotation(q);
    setClientName(q.client_name || "");
    setPlace(q.place || "");
    setSirMadam(q.sir_madam || "Sir / Madam");
    setQuotationTitle(q.project_name || "");
    setTechnology(q.technology || "");
    setNotes(DEFAULT_PHASE_2_NOTE);
    toast("Project Selected", `Selected "${q.project_name}" for Phase 2 quotation. Form fields pre-filled.`, "success");
  };

  const resetPhaseSelection = () => {
    setSelectedPhase(null);
    setSelectedPhase1Quotation(null);
    setClientName("");
    setPlace("");
    setSirMadam("Sir / Madam");
    setQuotationTitle("");
    setTechnology("");
    setDuration("");
    setAmount("");
    setSections([]);
  };

  const handleUploadParse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadText.trim()) {
      toast("Parsing Info", "Please paste or enter formatted quotation content.", "info");
      return;
    }

    const parsed = parseUploadedScopeContent(uploadText);
    if (parsed.length === 0) {
      toast("Parsing Error", "Could not detect any valid numbered sections or titles in the provided text.", "error");
      return;
    }

    setSections(parsed);
    setIsUploadOpen(false);
    setUploadText("");
    toast(
      "Success",
      `Successfully structured ${parsed.length} title sections and ${parsed.reduce((acc, s) => acc + s.points.length, 0)} description points!`,
      "success"
    );
  };

  // Dynamic Sections Logic
  const addSection = () => {
    setSections([...sections, { title: "", points: [] }]);
  };

  const removeSection = (sIdx: number) => {
    const updated = sections.filter((_, idx) => idx !== sIdx);
    setSections(updated);
  };

  const handleSectionTitleChange = (sIdx: number, val: string) => {
    const updated = [...sections];
    updated[sIdx].title = val;
    setSections(updated);
  };

  const addPoint = (sIdx: number) => {
    const updated = [...sections];
    updated[sIdx].points.push("");
    setSections(updated);
  };

  const removePoint = (sIdx: number, pIdx: number) => {
    const updated = [...sections];
    updated[sIdx].points = updated[sIdx].points.filter((_, idx) => idx !== pIdx);
    setSections(updated);
  };

  const handlePointChange = (sIdx: number, pIdx: number, val: string) => {
    const updated = [...sections];
    updated[sIdx].points[pIdx] = val;
    setSections(updated);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!clientName.trim()) return toast("Validation Error", "Client Name is required.", "error");
    if (!place.trim()) return toast("Validation Error", "Place is required.", "error");
    if (!sirMadam) return toast("Validation Error", "Salutation (Sir/Madam) is required.", "error");
    if (!quotationTitle.trim()) return toast("Validation Error", "Quotation Title is required.", "error");
    if (!technology.trim()) return toast("Validation Error", "Technology Stack is required.", "error");
    if (!duration.trim()) return toast("Validation Error", "Duration is required.", "error");
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      return toast("Validation Error", "Please enter a valid positive number for Amount.", "error");
    }

    // Dynamic fields validations
    if (sections.length === 0) {
      return toast("Validation Error", "Please add at least one Title Section in Quotation Scope.", "error");
    }

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      if (!sections[sIdx].title.trim()) {
        return toast("Validation Error", `Section Title #${sIdx + 1} is empty.`, "error");
      }
      if (sections[sIdx].points.length === 0) {
        return toast("Validation Error", `Section Title "${sections[sIdx].title}" needs at least one description.`, "error");
      }
      for (let pIdx = 0; pIdx < sections[sIdx].points.length; pIdx++) {
        if (!sections[sIdx].points[pIdx].trim()) {
          return toast(
            "Validation Error",
            `Description point #${pIdx + 1} under "${sections[sIdx].title}" is empty.`,
            "error"
          );
        }
      }
    }

    setIsSubmitting(true);

    const payload = {
      client_name: clientName,
      place,
      sir_madam: sirMadam,
      quotation_title: quotationTitle,
      technology,
      duration,
      amount: Number(amount),
      titles: sections.map(s => ({
        title: s.title,
        points: s.points
      })),
      notes: notes.trim(),
      phase: selectedPhase || 'Phase 1',
      parent_quotation_id: selectedPhase1Quotation?.id || null
    };

    const res = await apiFetch("/quotations", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    setIsSubmitting(false);

    if (res.success && res.data) {
      toast("Success", "Quotation generated successfully!", "success");
      router.push(`/quotations/${res.data.id}/preview`);
    } else {
      toast("Error", res.message || "Failed to create quotation.", "error");
    }
  };

  // Filtered Phase 1 quotations for Phase 2 selector
  const filteredPhase1Quotations = phase1Quotations.filter(q => {
    if (!phase1Search.trim()) return true;
    const term = phase1Search.toLowerCase();
    return (
      (q.project_name && q.project_name.toLowerCase().includes(term)) ||
      (q.client_name && q.client_name.toLowerCase().includes(term)) ||
      (q.quotation_number && q.quotation_number.toLowerCase().includes(term))
    );
  });

  return (
    <DashboardLayout title="Create Client Quotation">
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        
        {/* Navigation back */}
        <div className="flex items-center justify-between print:hidden">
          <Link href="/quotations" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Quotations Registry
          </Link>

          {selectedPhase && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetPhaseSelection}
              className="text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Change Phase ({selectedPhase})
            </Button>
          )}
        </div>

        {/* STEP 1: CHOOSE PHASE (Phase 1 vs Phase 2) */}
        {!selectedPhase && (
          <Card className="border-border shadow-sm max-w-2xl mx-auto my-6">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-bold text-foreground">Select Quotation Phase</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Please specify whether this quotation proposal is for Phase 1 or Phase 2 of a project.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Phase 1 Option Card */}
                <button
                  type="button"
                  onClick={() => handleSelectPhase('Phase 1')}
                  className="flex flex-col items-center justify-center p-6 border-2 border-border hover:border-primary rounded-xl bg-card hover:bg-primary/5 transition-all text-center group cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <FileText className="h-6 w-6" />
                  </div>
                  <span className="font-bold text-foreground text-base">Phase 1 Quotation</span>
                  <span className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Create a new standalone quotation proposal from scratch using the standard form.
                  </span>
                </button>

                {/* Phase 2 Option Card */}
                <button
                  type="button"
                  onClick={() => handleSelectPhase('Phase 2')}
                  className="flex flex-col items-center justify-center p-6 border-2 border-border hover:border-indigo-500 rounded-xl bg-card hover:bg-indigo-500/5 transition-all text-center group cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Layers className="h-6 w-6" />
                  </div>
                  <span className="font-bold text-foreground text-base">Phase 2 Quotation</span>
                  <span className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Select an existing Phase 1 project & create a follow-up Phase 2 quotation.
                  </span>
                </button>

              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: IF PHASE 2 IS SELECTED BUT NO PHASE 1 QUOTATION CHOSEN YET */}
        {selectedPhase === 'Phase 2' && !selectedPhase1Quotation && (
          <Card className="border-border shadow-sm max-w-3xl mx-auto my-4">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Layers className="h-5 w-5 text-indigo-600" />
                    Select Existing Phase 1 Quotation / Project
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1">
                    Choose a project created under Phase 1 to automatically pre-fill client and project details.
                  </CardDescription>
                </div>
                
                {/* Search Bar */}
                <div className="relative w-full sm:w-64 shrink-0">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search client or project..."
                    className="pl-8 h-9 text-xs"
                    value={phase1Search}
                    onChange={(e) => setPhase1Search(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPhase1List ? (
                <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">
                  Loading Phase 1 projects...
                </div>
              ) : filteredPhase1Quotations.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg bg-muted/10">
                  {phase1Quotations.length === 0 
                    ? "No Phase 1 quotations found in the database. Please create a Phase 1 quotation first."
                    : "No matching Phase 1 quotations found."}
                </div>
              ) : (
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {filteredPhase1Quotations.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => handlePickPhase1Quotation(q)}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border/80 rounded-lg hover:border-indigo-500 hover:bg-indigo-500/5 transition-all cursor-pointer group gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground group-hover:text-indigo-600 transition-colors">
                            {q.project_name}
                          </span>
                          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            {q.quotation_number}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                          <span><strong>Client:</strong> {q.client_name}</span>
                          <span><strong>Place:</strong> {q.place}</span>
                          <span><strong>Tech:</strong> {q.technology}</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 text-xs gap-1 border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Select for Phase 2
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 3: MAIN QUOTATION FORM (Show if Phase 1 OR if Phase 2 project has been selected) */}
        {(selectedPhase === 'Phase 1' || (selectedPhase === 'Phase 2' && selectedPhase1Quotation)) && (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Phase Info Banner */}
            <div className={`p-4 rounded-lg border flex items-center justify-between gap-4 ${
              selectedPhase === 'Phase 2' 
                ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 dark:bg-indigo-950/20 dark:border-indigo-900 dark:text-indigo-200' 
                : 'bg-emerald-50/50 border-emerald-200 text-emerald-950 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-200'
            }`}>
              <div className="flex items-center gap-2.5">
                {selectedPhase === 'Phase 2' ? (
                  <Layers className="h-5 w-5 text-indigo-600 shrink-0" />
                ) : (
                  <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                )}
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider block">
                    Creating {selectedPhase} Quotation
                  </span>
                  {selectedPhase === 'Phase 2' && selectedPhase1Quotation && (
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      Linked to Phase 1 Project: <strong>{selectedPhase1Quotation.project_name}</strong> ({selectedPhase1Quotation.quotation_number})
                    </span>
                  )}
                </div>
              </div>

              {selectedPhase === 'Phase 2' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPhase1Quotation(null)}
                  className="text-xs h-8 border-indigo-300 text-indigo-700 hover:bg-indigo-100 cursor-pointer shrink-0"
                >
                  Select Different Project
                </Button>
              )}
            </div>

            {/* Main form card */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Quotation Basic Details ({selectedPhase})</CardTitle>
                <CardDescription>Enter the commercial and client parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <Input
                    label="Client Name"
                    id="client-name"
                    placeholder="e.g. John Doe, Mithun Kasanmatt"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />

                  <Input
                    label="Place"
                    id="place"
                    placeholder="e.g. Bangalore, India"
                    required
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                  />

                  <Select
                    label="Sir / Madam (Salutation)"
                    id="salutation"
                    options={[
                      { label: "Sir / Madam", value: "Sir / Madam" },
                      { label: "Sir", value: "Sir" },
                      { label: "Madam", value: "Madam" }
                    ]}
                    value={sirMadam}
                    onChange={(e) => setSirMadam(e.target.value)}
                  />

                  <Input
                    label="Quotation / Project Title"
                    id="quotation-title"
                    placeholder="e.g. E-Commerce Web Application"
                    required
                    value={quotationTitle}
                    onChange={(e) => setQuotationTitle(e.target.value)}
                  />

                  <Input
                    label="Technology Stack"
                    id="technology"
                    placeholder="e.g. Next.js, PostgreSQL, Prisma"
                    required
                    value={technology}
                    onChange={(e) => setTechnology(e.target.value)}
                  />

                  <Input
                    label="Project Duration"
                    id="duration"
                    placeholder="e.g. 45 Days, 2 Months"
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />

                  <Input
                    label="Amount (INR)"
                    id="amount"
                    type="number"
                    placeholder="e.g. 150000"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <Textarea
                  label="Terms & Conditions / Custom Notes Override (Optional)"
                  id="notes"
                  placeholder="Custom terms, bank details, or overrides..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Scope Specifications Card */}
            <Card className="border-border">
              <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-3">
                <div>
                  <CardTitle>Quotation Scope & Specifications ({selectedPhase})</CardTitle>
                  <CardDescription>Define modules and deliverables dynamically</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsUploadOpen(true)}
                    className="flex items-center gap-1.5 cursor-pointer text-sky-600 border-sky-300 hover:bg-sky-50"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Content
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={addSection} className="flex items-center gap-1.5 cursor-pointer">
                    <Plus className="h-4 w-4" />
                    Add Title
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {sections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border rounded-lg space-y-3 bg-muted/5">
                    <p className="text-sm text-muted-foreground text-center">
                      Add title sections manually or paste your formatted scope content to structure titles & descriptions automatically.
                    </p>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsUploadOpen(true)}
                        className="flex items-center gap-2 cursor-pointer font-medium text-sky-600 border-sky-300 hover:bg-sky-50"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Content
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        onClick={addSection}
                        className="flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <Plus className="h-4 w-4" />
                        Add Title
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {sections.map((section, sIdx) => (
                      <div key={sIdx} className="border border-border/80 rounded-lg p-5 bg-muted/10 relative space-y-4">
                        
                        {/* Delete Section Button */}
                        <button
                          type="button"
                          onClick={() => removeSection(sIdx)}
                          className="absolute right-4 top-4 text-muted-foreground hover:text-rose-500 cursor-pointer p-1"
                          title="Remove Title Section"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>

                        {/* Section Title Input */}
                        <div className="w-4/5">
                          <Input
                            label={`Section Title #${sIdx + 1}`}
                            placeholder="e.g. TYPES OF USERS, PUBLIC WEBSITE FEATURES"
                            required
                            value={section.title}
                            onChange={(e) => handleSectionTitleChange(sIdx, e.target.value)}
                          />
                        </div>

                        {/* Add Description / Points list under section */}
                        {section.title.trim() !== "" && (
                          <div className="space-y-3.5 pl-4 border-l-2 border-primary/20">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                              Description Points / Features
                            </label>

                            {section.points.length === 0 ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addPoint(sIdx)}
                                className="flex items-center gap-1.5 text-primary border-primary/30 hover:bg-primary/5 cursor-pointer"
                              >
                                <Plus className="h-4 w-4" />
                                Add Description
                              </Button>
                            ) : (
                              section.points.map((point, pIdx) => (
                                <div key={pIdx} className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground font-mono select-none w-4">{pIdx + 1}.</span>
                                  <Input
                                    placeholder="e.g. Administrator, Home Page, Customer (B2C)"
                                    className="flex-1"
                                    required
                                    value={point}
                                    onChange={(e) => handlePointChange(sIdx, pIdx, e.target.value)}
                                  />
                                  
                                  {/* + Icon button to add more descriptions */}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addPoint(sIdx)}
                                    className="h-10 px-2.5 flex items-center justify-center cursor-pointer shrink-0"
                                    title="Add Description"
                                  >
                                    <Plus className="h-4 w-4 text-primary" />
                                  </Button>

                                  {/* Add Title button next to the + icon */}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addSection}
                                    className="h-10 px-3 flex items-center gap-1 cursor-pointer shrink-0 text-xs"
                                    title="Add Title Section"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Title
                                  </Button>

                                  {/* Remove Point Button */}
                                  <button
                                    type="button"
                                    onClick={() => removePoint(sIdx, pIdx)}
                                    className="text-muted-foreground hover:text-rose-500 cursor-pointer p-2 shrink-0"
                                    title="Remove Description"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="flex justify-start pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSection}
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        Add Title
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Action button */}
            <div className="flex justify-end gap-3 print:hidden">
              <Link href="/quotations">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" variant="default" className="gap-2" isLoading={isSubmitting}>
                <Save className="h-4.5 w-4.5" />
                Generate {selectedPhase} Proposal & Quote
              </Button>
            </div>
          </form>
        )}

        {/* UPLOAD CONTENT DIALOG */}
        <Dialog isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Upload className="h-5 w-5 text-sky-600" />
              Upload & Structure Quotation Scope
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUploadParse}>
            <DialogContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Paste your numbered quotation content below. The system will automatically convert numbered headings into <strong>Titles</strong> and bullet points into individual <strong>Descriptions</strong>.
              </p>
              <Textarea
                label="Paste Numbered Quotation Content"
                rows={10}
                required
                placeholder={`1. Customer Management\n* Add, edit, view, and manage cable customers.\n* Store customer name, mobile number, address, connection details.\n* Customer-wise payment and due history.\n\n2. Monthly Cable Amount & Due Management\n* Monthly bill generation for all active customers.`}
                value={uploadText}
                onChange={(e) => setUploadText(e.target.value)}
                className="font-mono text-xs leading-relaxed"
              />
            </DialogContent>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" className="gap-2 bg-sky-600 hover:bg-sky-700">
                <Sparkles className="h-4 w-4" />
                Parse & Structure Content
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
