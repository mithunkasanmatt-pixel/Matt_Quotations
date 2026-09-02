"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuotations, QuotationData } from "@/hooks/useQuotations";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, Copy, Download, Trash2, Calendar, FileText, Plus } from "lucide-react";
import Link from "next/link";

export default function QuotationsPage() {
  const { quotations, loading, fetchQuotations, duplicateQuotation, downloadQuotationPdf, deleteQuotation } = useQuotations();
  const { isAdmin } = useAuth();

  const [search, setSearch] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("");

  const [isDeleteOpen, setIsDeleteOpen] = React.useState<boolean>(false);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);

  React.useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuotations({
      search,
      status: statusFilter,
    });
  };

  const handleDuplicate = async (id: number) => {
    const res = await duplicateQuotation(id);
    if (res) {
      fetchQuotations({ search, status: statusFilter });
    }
  };

  const triggerDelete = (id: number) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      const ok = await deleteQuotation(deleteId);
      if (ok) {
        setIsDeleteOpen(false);
        fetchQuotations({ search, status: statusFilter });
      }
    }
  };

  const statuses = [
    { label: "Draft", value: "Draft" },
    { label: "Generated", value: "Generated" },
    { label: "Sent", value: "Sent" },
    { label: "Viewed", value: "Viewed" },
    { label: "Accepted", value: "Accepted" },
    { label: "Rejected", value: "Rejected" },
    { label: "Expired", value: "Expired" }
  ];

  const formatCurrency = (val: number, curr: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: curr || 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <DashboardLayout title="Quotations Registry">
      <div className="space-y-6">
        
        {/* FILTERS & ACTION PANEL */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-card border border-border/60 p-4.5 rounded-lg">
          <form onSubmit={handleFilterSubmit} className="flex-1 flex flex-col sm:flex-row gap-3 items-end sm:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search quote number, client, project..."
                className="pl-8.5 h-10 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="w-full sm:w-48">
              <Select
                options={[{ label: "All Statuses", value: "" }, ...statuses]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10"
              />
            </div>

            <Button type="submit" variant="outline" className="h-10 shrink-0">Apply Filter</Button>
          </form>

          <Link href="/quotations/new" className="shrink-0">
            <Button variant="default" className="h-10 gap-1.5 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              New Quotation
            </Button>
          </Link>
        </div>

        {/* QUOTATIONS LIST TABLE */}
        <Card className="border-border">
          <CardContent className="p-0">
            {loading && quotations.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground animate-pulse">Loading quotations...</div>
            ) : quotations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote Number</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Project Title</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-semibold text-primary">
                        <Link href={`/quotations/${q.id}/preview`} className="hover:underline flex items-center gap-2">
                          <FileText className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                          {q.quotation_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-foreground text-xs">{q.client_name}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">{q.project_name}</TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {formatCurrency(q.grand_total, q.currency)}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(q.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            q.status === "Accepted" ? "success" :
                            q.status === "Sent" || q.status === "Viewed" ? "info" :
                            q.status === "Draft" ? "default" : "warning"
                          }
                        >
                          {q.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Link href={`/quotations/${q.id}/preview`}>
                            <Button variant="ghost" size="sm" title="Preview quotation" className="h-8.5 w-8.5 p-0">
                              <Eye className="h-4.5 w-4.5 text-muted-foreground hover:text-foreground" />
                            </Button>
                          </Link>
                          
                          <Button 
                            onClick={() => handleDuplicate(q.id!)} 
                            variant="ghost" 
                            size="sm" 
                            title="Duplicate" 
                            className="h-8.5 w-8.5 p-0 cursor-pointer"
                          >
                            <Copy className="h-4.5 w-4.5 text-indigo-500 hover:text-indigo-600" />
                          </Button>

                          <a 
                            href={`/api/quotations/${q.id}/generate-pdf`}
                            download={`Quotation_${q.quotation_number}.pdf`}
                            title="Download PDF" 
                            className="inline-flex items-center justify-center h-8.5 w-8.5 p-0 rounded-md hover:bg-muted text-secondary hover:text-secondary-foreground transition-colors cursor-pointer"
                          >
                            <Download className="h-4.5 w-4.5" />
                          </a>

                          {isAdmin && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Delete" 
                              onClick={() => triggerDelete(q.id!)} 
                              className="h-8.5 w-8.5 p-0 cursor-pointer"
                            >
                              <Trash2 className="h-4.5 w-4.5 text-rose-500 hover:text-rose-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <span className="text-sm text-muted-foreground mb-4">No quotations match your filters.</span>
                <Link href="/quotations/new">
                  <Button variant="outline" size="sm">Create Quotation</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* DIALOG: DELETE CONFIRMATION */}
        <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
          <DialogHeader>
            <DialogTitle>Confirm Quotation Deletion</DialogTitle>
          </DialogHeader>
          <DialogContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to delete this quotation? This action is irreversible. The historical PDF details and email logs will be removed.
            </p>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Permanently Delete</Button>
          </DialogFooter>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}