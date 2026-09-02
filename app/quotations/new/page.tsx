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
import { Plus, Trash2, ArrowLeft, Save, HelpCircle } from "lucide-react";
import Link from "next/link";

interface TitleSection {
  title: string;
  points: string[];
}

export default function NewQuotationPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Form Fields
  const [clientName, setClientName] = React.useState<string>("");
  const [place, setPlace] = React.useState<string>("");
  const [sirMadam, setSirMadam] = React.useState<string>("Sir / Madam");
  const [quotationTitle, setQuotationTitle] = React.useState<string>("");
  const [technology, setTechnology] = React.useState<string>("");
  const [duration, setDuration] = React.useState<string>("");
  const [amount, setAmount] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");

  // Dynamic Titles and Points
  const [sections, setSections] = React.useState<TitleSection[]>([
    { title: "Core Features", points: ["User authentication and profile management", "Admin dashboard panel"] }
  ]);

  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  // Dynamic Sections Logic
  const addSection = () => {
    setSections([...sections, { title: "", points: [""] }]);
  };

  const removeSection = (sIdx: number) => {
    if (sections.length === 1) {
      toast("Action Restricted", "You must include at least one title section.", "info");
      return;
    }
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
    if (sections[sIdx].points.length === 1) {
      toast("Action Restricted", "You must include at least one point under each section.", "info");
      return;
    }
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
    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      if (!sections[sIdx].title.trim()) {
        return toast("Validation Error", `Section Title #${sIdx + 1} is empty.`, "error");
      }
      for (let pIdx = 0; pIdx < sections[sIdx].points.length; pIdx++) {
        if (!sections[sIdx].points[pIdx].trim()) {
          return toast(
            "Validation Error",
            `Point #${pIdx + 1} under section "${sections[sIdx].title || `Section ${sIdx + 1}`}" is empty.`,
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
      notes: notes.trim()
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

  return (
    <DashboardLayout title="Create Client Quotation">
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        {/* Navigation back */}
        <div className="flex items-center justify-between print:hidden">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Main form card */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Quotation Basic Details</CardTitle>
              <CardDescription>Enter the general commercial and client parameters</CardDescription>
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
                <CardTitle>Quotation Scope & Specifications</CardTitle>
                <CardDescription>Define modules and deliverables dynamically</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addSection} className="flex items-center gap-1.5 cursor-pointer">
                <Plus className="h-4 w-4" />
                Add Title Section
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
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
                      placeholder="e.g. Authentication Module, Admin Panel"
                      required
                      value={section.title}
                      onChange={(e) => handleSectionTitleChange(sIdx, e.target.value)}
                    />
                  </div>

                  {/* Points list under section */}
                  <div className="space-y-3.5 pl-4 border-l-2 border-primary/20">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Description Points / Features</label>
                    {section.points.map((point, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono select-none w-4">{pIdx + 1}.</span>
                        <Input
                          placeholder="e.g. Support sign-in with Google OAuth and standard email credentials"
                          className="flex-1"
                          required
                          value={point}
                          onChange={(e) => handlePointChange(sIdx, pIdx, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removePoint(sIdx, pIdx)}
                          className="text-muted-foreground hover:text-rose-500 cursor-pointer p-2 shrink-0"
                          title="Remove Point"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addPoint(sIdx)}
                      className="text-primary hover:text-primary-foreground text-xs p-0 h-8 flex items-center gap-1.5 cursor-pointer mt-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Point / Feature
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action button */}
          <div className="flex justify-end gap-3 print:hidden">
            <Link href="/dashboard">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" variant="default" className="gap-2" isLoading={isSubmitting}>
              <Save className="h-4.5 w-4.5" />
              Generate Proposal & Quote
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
