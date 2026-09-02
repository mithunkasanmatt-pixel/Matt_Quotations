"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

export interface QuotationItemData {
  id?: number;
  section: string;
  title: string;
  description?: string;
  hours: number;
  rate: number;
  amount: number;
}

export interface EmailLogData {
  id: number;
  recipient_email: string;
  subject: string;
  message?: string;
  status: string;
  error_message?: string;
  sent_at: string;
}

export interface QuotationData {
  id?: number;
  project_id?: number;
  project_name?: string;
  client_name?: string;
  place?: string;
  sir_madam?: string;
  technology?: string;
  duration?: string;
  client_company?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  client_city?: string;
  client_state?: string;
  client_country?: string;
  quotation_number?: string;
  quotation_date?: string;
  valid_until: string;
  subtotal: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_amount?: number;
  tax_percentage: number;
  tax_amount?: number;
  additional_charges?: number;
  grand_total: number;
  currency: string;
  status?: string;
  notes?: string;
  created_by?: number;
  created_by_name?: string;
  created_at?: string;
  items?: QuotationItemData[];
  emails?: EmailLogData[];
}

export function useQuotations() {
  const [quotations, setQuotations] = React.useState<QuotationData[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const { toast } = useToast();

  const fetchQuotations = React.useCallback(async (filters: { search?: string; status?: string; client_id?: string } = {}) => {
    setLoading(true);
    const { search = "", status = "", client_id = "" } = filters;
    const queryParams = new URLSearchParams();
    if (search) queryParams.append("search", search);
    if (status) queryParams.append("status", status);
    if (client_id) queryParams.append("client_id", client_id);

    const res = await apiFetch(`/quotations?${queryParams.toString()}`);
    if (res.success && res.data) {
      setQuotations(res.data);
    } else {
      toast("Error", res.message || "Failed to load quotations", "error");
    }
    setLoading(false);
  }, [toast]);

  const getQuotation = React.useCallback(async (id: number) => {
    setLoading(true);
    const res = await apiFetch(`/quotations/${id}`);
    setLoading(false);
    if (res.success && res.data) {
      return res.data as QuotationData;
    } else {
      toast("Error", res.message || "Failed to load quotation details", "error");
      return null;
    }
  }, [toast]);

  const createQuotation = async (projectId: number, overrides: Partial<QuotationData> = {}) => {
    setLoading(true);
    const res = await apiFetch("/quotations", {
      method: "POST",
      body: JSON.stringify({ project_id: projectId, ...overrides }),
    });
    setLoading(false);
    if (res.success && res.data) {
      toast("Success", "Quotation generated successfully", "success");
      return res.data;
    } else {
      toast("Error", res.message || "Failed to generate quotation", "error");
      return null;
    }
  };

  const updateQuotation = async (id: number, data: Partial<QuotationData>) => {
    setLoading(true);
    const res = await apiFetch(`/quotations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    setLoading(false);
    if (res.success && res.data) {
      toast("Success", "Quotation updated successfully", "success");
      return res.data;
    } else {
      toast("Error", res.message || "Failed to update quotation", "error");
      return null;
    }
  };

  const deleteQuotation = async (id: number) => {
    setLoading(true);
    const res = await apiFetch(`/quotations/${id}`, {
      method: "DELETE",
    });
    setLoading(false);
    if (res.success) {
      toast("Success", "Quotation deleted successfully", "success");
      return true;
    } else {
      toast("Error", res.message || "Failed to delete quotation", "error");
      return false;
    }
  };

  const duplicateQuotation = async (id: number) => {
    setLoading(true);
    const res = await apiFetch(`/quotations/${id}/duplicate`, {
      method: "POST",
    });
    setLoading(false);
    if (res.success && res.data) {
      toast("Success", "Quotation duplicated successfully", "success");
      return res.data;
    } else {
      toast("Error", res.message || "Failed to duplicate quotation", "error");
      return null;
    }
  };

  const downloadQuotationPdf = async (id: number, quotationNumber: string) => {
    setLoading(true);
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") : null;
      
      const response = await fetch(`${BASE_URL}/quotations/${id}/generate-pdf`, {
        method: "GET",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(errText || `Failed to download PDF (HTTP ${response.status})`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Quotation_${quotationNumber || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 200);
      toast("Success", "PDF downloaded successfully", "success");
      setLoading(false);
      return true;
    } catch (error: any) {
      console.error("PDF download error:", error);
      toast("Error", error.message || "Failed to download PDF", "error");
      setLoading(false);
      return false;
    }
  };

  const sendQuotationEmail = async (
    id: number,
    payload: { email: string; subject: string; message: string }
  ) => {
    setLoading(true);
    const res = await apiFetch(`/quotations/${id}/send`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (res.success) {
      toast("Success", "Email sent to client successfully", "success");
      return true;
    } else {
      toast("Error", res.message || "Failed to send quotation email", "error");
      return false;
    }
  };

  return {
    quotations,
    loading,
    fetchQuotations,
    getQuotation,
    createQuotation,
    updateQuotation,
    deleteQuotation,
    duplicateQuotation,
    downloadQuotationPdf,
    sendQuotationEmail,
  };
}
