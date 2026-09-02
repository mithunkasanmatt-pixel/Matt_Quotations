"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Building, Settings, Landmark, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState<"company" | "defaults">("company");
  const [loading, setLoading] = React.useState<boolean>(false);

  // --- COMPANY SETTINGS FIELDS STATE ---
  const [companyName, setCompanyName] = React.useState<string>("");
  const [logo, setLogo] = React.useState<string>("");
  const [address, setAddress] = React.useState<string>("");
  const [phone, setPhone] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [website, setWebsite] = React.useState<string>("");
  const [gstNumber, setGstNumber] = React.useState<string>("");
  const [panNumber, setPanNumber] = React.useState<string>("");
  const [terms, setTerms] = React.useState<string>("");
  const [paymentTerms, setPaymentTerms] = React.useState<string>("");
  const [bankDetails, setBankDetails] = React.useState<string>("");
  const [signature, setSignature] = React.useState<string>("");

  // --- DEFAULT QUOTATION SETTINGS FIELDS STATE ---
  const [prefix, setPrefix] = React.useState<string>("");
  const [startNum, setStartNum] = React.useState<number>(1001);
  const [validityDays, setValidityDays] = React.useState<number>(15);
  const [defaultTax, setDefaultTax] = React.useState<number>(18);
  const [defaultCurrency, setDefaultCurrency] = React.useState<string>("INR");

  const loadSettings = React.useCallback(async () => {
    setLoading(true);
    const [compRes, sysRes] = await Promise.all([
      apiFetch("/settings/company"),
      apiFetch("/settings/quotation")
    ]);

    if (compRes.success && compRes.data) {
      const c = compRes.data;
      setCompanyName(c.company_name);
      setLogo(c.logo || "");
      setAddress(c.address || "");
      setPhone(c.phone || "");
      setEmail(c.email || "");
      setWebsite(c.website || "");
      setGstNumber(c.gst_number || "");
      setPanNumber(c.pan_number || "");
      setTerms(c.terms || "");
      setPaymentTerms(c.payment_terms || "");
      setBankDetails(c.bank_details || "");
      setSignature(c.signature || "");
    }

    if (sysRes.success && sysRes.data) {
      const s = sysRes.data;
      setPrefix(s.quotation_prefix);
      setStartNum(s.starting_quotation_number);
      setValidityDays(s.default_validity_days);
      setDefaultTax(s.default_tax);
      setDefaultCurrency(s.default_currency);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      company_name: companyName,
      logo,
      address,
      phone,
      email,
      website,
      gst_number: gstNumber,
      pan_number: panNumber,
      terms,
      payment_terms: paymentTerms,
      bank_details: bankDetails,
      signature
    };

    const res = await apiFetch("/settings/company", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (res.success) {
      toast("Success", "Company settings saved successfully", "success");
      loadSettings();
    } else {
      toast("Error", res.message || "Failed to save company settings", "error");
    }
  };

  const handleSaveDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      quotation_prefix: prefix,
      starting_quotation_number: startNum,
      default_validity_days: validityDays,
      default_tax: defaultTax,
      default_currency: defaultCurrency
    };

    const res = await apiFetch("/settings/quotation", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (res.success) {
      toast("Success", "Quotation default parameters saved", "success");
      loadSettings();
    } else {
      toast("Error", res.message || "Failed to save default settings", "error");
    }
  };

  return (
    <DashboardLayout title="Portal Configurations">
      <div className="space-y-6">
        
        {/* TABS SELECT */}
        <div className="flex border-b border-border bg-card p-1 rounded-lg gap-1.5 w-full sm:w-fit">
          <button
            onClick={() => setActiveTab("company")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-md uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "company"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Building className="h-4 w-4" />
            Company Preferences
          </button>
          <button
            onClick={() => setActiveTab("defaults")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-md uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "defaults"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Settings className="h-4 w-4" />
            Quotation Defaults
          </button>
        </div>

        {/* TAB 1: COMPANY PREFERENCES FORM */}
        {activeTab === "company" && (
          <form onSubmit={handleSaveCompany} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              
              {/* Profile Card */}
              <Card className="border-border shadow-2xs">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building className="h-4.5 w-4.5 text-primary" />
                    Branding & Contacts
                  </CardTitle>
                  <CardDescription>Setup details visible on PDF headers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Company Legal Name"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                    <Input
                      label="Logo Text / Initials"
                      value={logo}
                      placeholder="e.g. AS"
                      onChange={(e) => setLogo(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Contact Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                      label="Contact Phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <Input
                    label="Official Website"
                    value={website}
                    placeholder="www.mycompany.com"
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                  <Textarea
                    label="Physical Address"
                    rows={4}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </CardContent>
              </Card>

              {/* Taxation & Legal Card */}
              <Card className="border-border shadow-2xs">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Landmark className="h-4.5 w-4.5 text-primary" />
                    Tax & Bank Transfer Details
                  </CardTitle>
                  <CardDescription>Legal compliance and banking details visible in invoice footers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="GST Number"
                      value={gstNumber}
                      placeholder="GSTIN Code"
                      onChange={(e) => setGstNumber(e.target.value)}
                    />
                    <Input
                      label="PAN"
                      value={panNumber}
                      placeholder="Tax Account Number"
                      onChange={(e) => setPanNumber(e.target.value)}
                    />
                  </div>
                  <Textarea
                    label="Bank Account Details"
                    rows={4}
                    placeholder="Bank Name, Account Holder Name, Acc Number, SWIFT/IFSC Code..."
                    value={bankDetails}
                    onChange={(e) => setBankDetails(e.target.value)}
                  />
                  <Input
                    label="Authorized Signature Name"
                    value={signature}
                    placeholder="e.g. CEO Name"
                    onChange={(e) => setSignature(e.target.value)}
                  />
                </CardContent>
              </Card>

              {/* Terms & Payment Conditions */}
              <Card className="md:col-span-2 border-border shadow-2xs">
                <CardHeader>
                  <CardTitle className="text-base">Default Master Terms & Legal Policy</CardTitle>
                  <CardDescription>These guidelines are appended to generated quotation footers by default</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Textarea
                      label="Project Terms & Conditions"
                      rows={6}
                      placeholder="Validity of quote, scope changes, content ownership..."
                      value={terms}
                      onChange={(e) => setTerms(e.target.value)}
                    />
                    <Textarea
                      label="Standard Milestone Payment Terms"
                      rows={6}
                      placeholder="50% Signup, 30% milestone, 20% release..."
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                    />
                  </div>
                  <Button type="submit" variant="default" className="w-full mt-4 h-11" isLoading={loading} disabled={!companyName}>
                    Save Company Profile
                  </Button>
                </CardContent>
              </Card>

            </div>
          </form>
        )}

        {/* TAB 2: QUOTATION DEFAULTS FORM */}
        {activeTab === "defaults" && (
          <Card className="max-w-2xl border-border shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4.5 w-4.5 text-primary" />
                Default Quotation Parameters
              </CardTitle>
              <CardDescription>Setup default values for automatic calculations</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveDefaults} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Quotation Number Prefix"
                    required
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                  />
                  <Input
                    label="Starting Quotation Index"
                    type="number"
                    required
                    value={startNum}
                    onChange={(e) => setStartNum(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="Default Validity (Days)"
                    type="number"
                    required
                    value={validityDays}
                    onChange={(e) => setValidityDays(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  <Input
                    label="Default GST Tax (%)"
                    type="number"
                    required
                    value={defaultTax}
                    onChange={(e) => setDefaultTax(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                  <Select
                    label="Default Currency"
                    options={[
                      { label: "INR (₹)", value: "INR" },
                      { label: "USD ($)", value: "USD" },
                      { label: "EUR (€)", value: "EUR" }
                    ]}
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2 border border-border bg-muted/20 p-3 rounded-lg text-xs text-muted-foreground mt-6">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  <span>These configurations are saved to PostgreSQL and apply instantly to new estimates.</span>
                </div>

                <Button type="submit" variant="default" className="w-full mt-6 h-11" isLoading={loading} disabled={!prefix}>
                  Save Default Parameters
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

      </div>
    </DashboardLayout>
  );
}
