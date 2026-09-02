"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { 
  FileText, 
  DollarSign, 
  ArrowUpRight, 
  Activity,
  CheckCircle,
  Clock,
  Send
} from "lucide-react";
import Link from "next/link";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";

interface DashboardStats {
  totalQuotations: number;
  draftQuotations: number;
  sentQuotations: number;
  acceptedQuotations: number;
  rejectedQuotations: number;
  totalQuotationValue: number;
}

export default function DashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats>({
    totalQuotations: 0,
    draftQuotations: 0,
    sentQuotations: 0,
    acceptedQuotations: 0,
    rejectedQuotations: 0,
    totalQuotationValue: 0
  });

  const [recentQuotations, setRecentQuotations] = React.useState<any[]>([]);
  const [activities, setActivities] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      const [quotationsRes, activitiesRes] = await Promise.all([
        apiFetch("/quotations"),
        apiFetch("/activities")
      ]);

      const quotationsList = quotationsRes.success && quotationsRes.data ? quotationsRes.data : [];
      const activitiesList = activitiesRes.success && activitiesRes.data ? activitiesRes.data : [];

      const totalQuotations = quotationsList.length;
      const draftQuotations = quotationsList.filter((q: any) => q.status === 'Draft').length;
      const sentQuotations = quotationsList.filter((q: any) => q.status === 'Sent' || q.status === 'Viewed').length;
      const acceptedQuotations = quotationsList.filter((q: any) => q.status === 'Accepted').length;
      const rejectedQuotations = quotationsList.filter((q: any) => q.status === 'Rejected').length;
      
      const totalQuotationValue = quotationsList
        .filter((q: any) => q.status !== 'Rejected' && q.status !== 'Expired')
        .reduce((sum: number, q: any) => sum + (q.grand_total || 0), 0);

      setStats({
        totalQuotations,
        draftQuotations,
        sentQuotations,
        acceptedQuotations,
        rejectedQuotations,
        totalQuotationValue
      });

      setRecentQuotations(quotationsList.slice(0, 5));
      setActivities(activitiesList.slice(0, 5));
      setLoading(false);
    }

    loadDashboardData();
  }, []);

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Setup pie chart data
  const statusData = [
    { name: "Draft", value: stats.draftQuotations, color: "#94a3b8" },
    { name: "Sent", value: stats.sentQuotations, color: "#0ea5e9" },
    { name: "Accepted", value: stats.acceptedQuotations, color: "#10b981" },
    { name: "Rejected", value: stats.rejectedQuotations, color: "#f43f5e" }
  ].filter(d => d.value > 0);

  const finalStatusData = statusData.length > 0 ? statusData : [
    { name: "No Data", value: 1, color: "#e2e8f0" }
  ];

  // Bar chart data for quotations by status
  const quotationBarData = [
    { status: "Draft", count: stats.draftQuotations },
    { status: "Sent", count: stats.sentQuotations },
    { status: "Accepted", count: stats.acceptedQuotations },
    { status: "Rejected", count: stats.rejectedQuotations },
  ];

  return (
    <DashboardLayout title="Quotations Dashboard">
      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-80 rounded-lg bg-muted animate-pulse" />
            <div className="h-80 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* WELCOME & ACTION BAR */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border/60 p-5 rounded-lg">
            <div>
              <h2 className="text-lg font-bold text-foreground">Quotation Management Workspace</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Generate, track, and manage client quotation proposals.</p>
            </div>
            <Link href="/quotations/new">
              <Button className="font-semibold shadow-xs cursor-pointer flex items-center gap-2">
                <FileText className="h-4.5 w-4.5" />
                New Quotation
              </Button>
            </Link>
          </div>

          {/* STATS CARDS GRID */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* CARD 1: Total Value */}
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Pipeline</span>
                <DollarSign className="h-4.5 w-4.5 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalQuotationValue)}</div>
                <p className="text-xs text-muted-foreground mt-1">Excludes rejected/expired drafts</p>
              </CardContent>
            </Card>

            {/* CARD 2: Total Quotations */}
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Quotations</span>
                <FileText className="h-4.5 w-4.5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.totalQuotations}</div>
                <p className="text-xs text-muted-foreground mt-1">Generated proposals in registry</p>
              </CardContent>
            </Card>

            {/* CARD 3: Draft Quotations */}
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Draft Quotations</span>
                <Clock className="h-4.5 w-4.5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.draftQuotations}</div>
                <p className="text-xs text-muted-foreground mt-1">Pending review & dispatch</p>
              </CardContent>
            </Card>

            {/* CARD 4: Accepted rate */}
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quotations Sent</span>
                <Send className="h-4.5 w-4.5 text-sky-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stats.sentQuotations + stats.acceptedQuotations}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.acceptedQuotations} accepted ({stats.sentQuotations + stats.acceptedQuotations > 0 ? Math.round((stats.acceptedQuotations / (stats.sentQuotations + stats.acceptedQuotations)) * 100) : 0}% conversion)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CHARTS GRAPH SECTION */}
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Chart 1: Revenue breakdown */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">Quotation Pipeline Values</CardTitle>
                <CardDescription>Estimated value distributions by current status</CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={finalStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {finalStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Quotations`, 'Volume']} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 2: Quotation Volume by Status */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">Quotation Volume by Status</CardTitle>
                <CardDescription>Overview of proposals across workflow stages</CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={quotationBarData}>
                    <XAxis dataKey="status" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                    <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* LOWER GRID: RECENT QUOTATIONS & ACTIVITIES */}
          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* Recent Quotations table */}
            <Card className="lg:col-span-2 border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-0.5">
                  <CardTitle className="text-base">Recent Quotations</CardTitle>
                  <CardDescription>Manage and track latest proposals</CardDescription>
                </div>
                <Link href="/quotations">
                  <Button variant="outline" size="sm">
                    View All
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentQuotations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quote Number</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Grand Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentQuotations.map((q) => (
                        <TableRow key={q.id}>
                          <TableCell className="font-semibold text-primary">
                            <Link href={`/quotations/${q.id}/preview`} className="hover:underline">
                              {q.quotation_number}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-foreground">{q.client_name}</span>
                          </TableCell>
                          <TableCell>{formatCurrency(q.grand_total)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                q.status === "Accepted" ? "success" :
                                q.status === "Sent" ? "info" :
                                q.status === "Draft" ? "default" : "warning"
                              }
                            >
                              {q.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <span className="text-sm text-muted-foreground mb-4">No quotations created yet.</span>
                    <Link href="/quotations/new">
                      <Button variant="default" size="sm">Create First Quotation</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent activity feed */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">System Activities</CardTitle>
                <CardDescription>Recent actions logged in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {activities.length > 0 ? (
                  <div className="space-y-4.5">
                    {activities.map((a) => (
                      <div key={a.id} className="flex gap-3 text-xs leading-normal">
                        <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/15 mt-0.5">
                          <Activity className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-foreground">{a.action}</span>
                          <span className="text-muted-foreground mt-0.5 text-[11px]">{a.description}</span>
                          <span className="text-[9px] text-muted-foreground/60 mt-1.5">
                            {new Date(a.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })} | by {a.user_name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No activity recorded yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      )}
    </DashboardLayout>
  );
}