"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  Crown,
  Zap,
  Building2,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

interface Subscription {
  plan: string;
  status: string;
  billingCycle: string;
  amount: number;
  currency: string;
  nextBillingDate: string | null;
  cancelAtPeriodEnd: boolean;
}

interface Usage {
  documents: number;
  storage: number;
  views: number;
  limits: {
    documents: number;
    storage: number;
    views: number;
  };
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  pdfUrl: string | null;
}

export default function BillingSettingsPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const [subRes, usageRes, invoicesRes] = await Promise.all([
        fetch("/api/billing/subscription"),
        fetch("/api/billing/usage"),
        fetch("/api/billing/invoices"),
      ]);

      if (subRes.ok) {
        const data = await subRes.json();
        setSubscription(data);
      }

      if (usageRes.ok) {
        const data = await usageRes.json();
        setUsage(data);
      }

      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error("Error fetching billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: string) => {
    try {
      const response = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      }
    } catch (error) {
      console.error("Error upgrading:", error);
    }
  };

  const getPlanBadge = (plan: string) => {
    const planConfig = {
      free: { label: "Free", className: "bg-slate-100 text-slate-800", icon: null },
      pro: { label: "Pro", className: "bg-blue-100 text-blue-800", icon: Zap },
      business: { label: "Business", className: "bg-purple-100 text-purple-800", icon: Building2 },
      enterprise: { label: "Enterprise", className: "bg-orange-100 text-orange-800", icon: Crown },
    };

    const config = planConfig[plan as keyof typeof planConfig] || planConfig.free;
    const Icon = config.icon;

    return (
      <Badge className={`${config.className} text-base px-3 py-1`}>
        {Icon && <Icon className="mr-1 h-4 w-4" />}
        {config.label}
      </Badge>
    );
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount / 100);
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing & Subscription</h1>
        <p className="text-slate-600 mt-1">
          Manage your subscription, usage, and payment methods
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                {subscription?.billingCycle === "monthly" ? "Billed monthly" : "Billed annually"}
              </CardDescription>
            </div>
            {subscription && getPlanBadge(subscription.plan)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription && (
            <>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-600">Amount</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatAmount(subscription.amount, subscription.currency)}
                    <span className="text-sm text-slate-600 font-normal">
                      /{subscription.billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </p>
                </div>
                {subscription.nextBillingDate && (
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Next billing date</p>
                    <p className="font-semibold text-slate-900">
                      {format(new Date(subscription.nextBillingDate), "MMM dd, yyyy")}
                    </p>
                  </div>
                )}
              </div>

              {subscription.cancelAtPeriodEnd && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Your subscription will be cancelled at the end of the billing period.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Usage */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle>Current Usage</CardTitle>
            <CardDescription>
              Your usage for the current billing period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Documents</span>
                <span className="text-sm font-medium text-slate-900">
                  {usage.documents} / {usage.limits.documents === -1 ? "∞" : usage.limits.documents}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${usage.limits.documents === -1 ? 0 : Math.min((usage.documents / usage.limits.documents) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Storage</span>
                <span className="text-sm font-medium text-slate-900">
                  {formatBytes(usage.storage)} /{" "}
                  {usage.limits.storage === -1 ? "∞" : formatBytes(usage.limits.storage)}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${usage.limits.storage === -1 ? 0 : Math.min((usage.storage / usage.limits.storage) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Views (this month)</span>
                <span className="text-sm font-medium text-slate-900">
                  {usage.views} / {usage.limits.views === -1 ? "∞" : usage.limits.views}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{
                    width: `${usage.limits.views === -1 ? 0 : Math.min((usage.views / usage.limits.views) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      {subscription?.plan === "free" && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Your Plan</CardTitle>
            <CardDescription>
              Unlock more features and increase your limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 border-2 border-blue-200 rounded-lg bg-blue-50">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-slate-900">Pro</h3>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">$29</p>
                <p className="text-sm text-slate-600 mb-4">per month</p>
                <ul className="space-y-2 mb-6 text-sm text-slate-700">
                  <li>✓ 100 documents</li>
                  <li>✓ 50 GB storage</li>
                  <li>✓ Unlimited views</li>
                  <li>✓ Advanced analytics</li>
                  <li>✓ Priority support</li>
                </ul>
                <Button
                  onClick={() => handleUpgrade("pro")}
                  className="w-full"
                >
                  Upgrade to Pro
                </Button>
              </div>

              <div className="p-6 border-2 border-purple-200 rounded-lg bg-purple-50">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-6 w-6 text-purple-600" />
                  <h3 className="text-xl font-bold text-slate-900">Business</h3>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">$99</p>
                <p className="text-sm text-slate-600 mb-4">per month</p>
                <ul className="space-y-2 mb-6 text-sm text-slate-700">
                  <li>✓ 500 documents</li>
                  <li>✓ 200 GB storage</li>
                  <li>✓ Unlimited views</li>
                  <li>✓ Team collaboration</li>
                  <li>✓ Custom branding</li>
                  <li>✓ API access</li>
                </ul>
                <Button
                  onClick={() => handleUpgrade("business")}
                  className="w-full"
                >
                  Upgrade to Business
                </Button>
              </div>

              <div className="p-6 border-2 border-orange-200 rounded-lg bg-orange-50">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="h-6 w-6 text-orange-600" />
                  <h3 className="text-xl font-bold text-slate-900">Enterprise</h3>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">Custom</p>
                <p className="text-sm text-slate-600 mb-4">contact sales</p>
                <ul className="space-y-2 mb-6 text-sm text-slate-700">
                  <li>✓ Unlimited documents</li>
                  <li>✓ Unlimited storage</li>
                  <li>✓ Unlimited views</li>
                  <li>✓ Dedicated support</li>
                  <li>✓ Custom integrations</li>
                  <li>✓ SLA guarantee</li>
                </ul>
                <Button variant="outline" className="w-full">
                  Contact Sales
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            Download your past invoices and receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CreditCard className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No invoices yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      {format(new Date(invoice.date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(invoice.amount, invoice.currency)}
                    </TableCell>
                    <TableCell>
                      {invoice.status === "paid" ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Paid
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="mr-1 h-3 w-3" />
                          {invoice.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.pdfUrl && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={invoice.pdfUrl} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
