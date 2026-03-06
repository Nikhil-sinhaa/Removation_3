// components/payment/InvoiceHistory.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  ExternalLink,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Receipt,
  IndianRupee,
  DollarSign,
  Building,
  Mail,
  Printer,
  Share2,
  MoreVertical,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  paidAt?: Date;
  amount: number;
  currency: 'INR' | 'USD';
  status: 'paid' | 'pending' | 'failed' | 'refunded' | 'cancelled';
  plan: string;
  billingPeriod: {
    start: Date;
    end: Date;
  };
  paymentMethod: {
    type: 'card' | 'upi' | 'netbanking' | 'wallet';
    last4?: string;
    brand?: string;
    upiId?: string;
  };
  customer: {
    name: string;
    email: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    gstin?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  downloadUrl: string;
  receiptUrl?: string;
}

interface InvoiceHistoryProps {
  className?: string;
  compact?: boolean;
  limit?: number;
}

const mockInvoices: Invoice[] = [
  {
    id: 'inv_1',
    invoiceNumber: 'REM-2025-001234',
    date: new Date('2025-01-15'),
    dueDate: new Date('2025-01-15'),
    paidAt: new Date('2025-01-15'),
    amount: 2900,
    currency: 'INR',
    status: 'paid',
    plan: 'Pro Monthly',
    billingPeriod: {
      start: new Date('2025-01-15'),
      end: new Date('2025-02-14'),
    },
    paymentMethod: {
      type: 'card',
      last4: '4242',
      brand: 'Visa',
    },
    customer: {
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      address: {
        line1: '123 MG Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
      },
      gstin: '27AADCB2230M1ZT',
    },
    items: [
      {
        description: 'Removation.ai Pro Plan - Monthly',
        quantity: 1,
        unitPrice: 2458,
        amount: 2458,
      },
    ],
    subtotal: 2458,
    tax: 442,
    taxRate: 18,
    total: 2900,
    downloadUrl: '#',
  },
  {
    id: 'inv_2',
    invoiceNumber: 'REM-2024-001189',
    date: new Date('2024-12-15'),
    dueDate: new Date('2024-12-15'),
    paidAt: new Date('2024-12-15'),
    amount: 2900,
    currency: 'INR',
    status: 'paid',
    plan: 'Pro Monthly',
    billingPeriod: {
      start: new Date('2024-12-15'),
      end: new Date('2025-01-14'),
    },
    paymentMethod: {
      type: 'upi',
      upiId: 'rahul@okaxis',
    },
    customer: {
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
    },
    items: [
      {
        description: 'Removation.ai Pro Plan - Monthly',
        quantity: 1,
        unitPrice: 2458,
        amount: 2458,
      },
    ],
    subtotal: 2458,
    tax: 442,
    taxRate: 18,
    total: 2900,
    downloadUrl: '#',
  },
  {
    id: 'inv_3',
    invoiceNumber: 'REM-2024-001145',
    date: new Date('2024-11-15'),
    dueDate: new Date('2024-11-15'),
    paidAt: new Date('2024-11-15'),
    amount: 2900,
    currency: 'INR',
    status: 'paid',
    plan: 'Pro Monthly',
    billingPeriod: {
      start: new Date('2024-11-15'),
      end: new Date('2024-12-14'),
    },
    paymentMethod: {
      type: 'card',
      last4: '4242',
      brand: 'Visa',
    },
    customer: {
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
    },
    items: [
      {
        description: 'Removation.ai Pro Plan - Monthly',
        quantity: 1,
        unitPrice: 2458,
        amount: 2458,
      },
    ],
    subtotal: 2458,
    tax: 442,
    taxRate: 18,
    total: 2900,
    downloadUrl: '#',
  },
  {
    id: 'inv_4',
    invoiceNumber: 'REM-2024-001098',
    date: new Date('2024-10-15'),
    dueDate: new Date('2024-10-15'),
    status: 'refunded',
    amount: 29,
    currency: 'USD',
    plan: 'Pro Monthly',
    billingPeriod: {
      start: new Date('2024-10-15'),
      end: new Date('2024-11-14'),
    },
    paymentMethod: {
      type: 'card',
      last4: '4242',
      brand: 'Visa',
    },
    customer: {
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
    },
    items: [
      {
        description: 'Removation.ai Pro Plan - Monthly',
        quantity: 1,
        unitPrice: 29,
        amount: 29,
      },
    ],
    subtotal: 29,
    tax: 0,
    taxRate: 0,
    total: 29,
    downloadUrl: '#',
  },
];

const translations = {
  en: {
    title: 'Invoice History',
    description: 'View and download your past invoices',
    search: 'Search invoices...',
    filter: 'Filter',
    allStatuses: 'All Statuses',
    paid: 'Paid',
    pending: 'Pending',
    failed: 'Failed',
    refunded: 'Refunded',
    cancelled: 'Cancelled',
    invoice: 'Invoice',
    date: 'Date',
    amount: 'Amount',
    status: 'Status',
    plan: 'Plan',
    actions: 'Actions',
    download: 'Download PDF',
    viewDetails: 'View Details',
    viewReceipt: 'View Receipt',
    emailInvoice: 'Email Invoice',
    print: 'Print',
    share: 'Share',
    noInvoices: 'No invoices found',
    noInvoicesDesc: 'Your billing history will appear here',
    loading: 'Loading invoices...',
    invoiceDetails: 'Invoice Details',
    billingPeriod: 'Billing Period',
    paymentMethod: 'Payment Method',
    customer: 'Customer',
    items: 'Items',
    subtotal: 'Subtotal',
    tax: 'Tax',
    total: 'Total',
    paidOn: 'Paid on',
    dueDate: 'Due Date',
    gstin: 'GSTIN',
    billingAddress: 'Billing Address',
    refresh: 'Refresh',
  },
  hi: {
    title: 'इनवॉइस इतिहास',
    description: 'अपने पिछले इनवॉइस देखें और डाउनलोड करें',
    search: 'इनवॉइस खोजें...',
    filter: 'फ़िल्टर',
    allStatuses: 'सभी स्थितियाँ',
    paid: 'भुगतान किया गया',
    pending: 'लंबित',
    failed: 'विफल',
    refunded: 'रिफंड किया गया',
    cancelled: 'रद्द',
    invoice: 'इनवॉइस',
    date: 'तारीख',
    amount: 'राशि',
    status: 'स्थिति',
    plan: 'प्लान',
    actions: 'कार्रवाई',
    download: 'PDF डाउनलोड करें',
    viewDetails: 'विवरण देखें',
    viewReceipt: 'रसीद देखें',
    emailInvoice: 'इनवॉइस ईमेल करें',
    print: 'प्रिंट करें',
    share: 'शेयर करें',
    noInvoices: 'कोई इनवॉइस नहीं मिला',
    noInvoicesDesc: 'आपका बिलिंग इतिहास यहाँ दिखाई देगा',
    loading: 'इनवॉइस लोड हो रहे हैं...',
    invoiceDetails: 'इनवॉइस विवरण',
    billingPeriod: 'बिलिंग अवधि',
    paymentMethod: 'भुगतान विधि',
    customer: 'ग्राहक',
    items: 'आइटम',
    subtotal: 'उप-योग',
    tax: 'कर',
    total: 'कुल',
    paidOn: 'भुगतान तिथि',
    dueDate: 'देय तिथि',
    gstin: 'जीएसटीआईएन',
    billingAddress: 'बिलिंग पता',
    refresh: 'रिफ्रेश',
  },
};

export function InvoiceHistory({ className, compact = false, limit }: InvoiceHistoryProps) {
  const { language } = useLanguage();
  const t = translations[language];

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/invoices');
      if (!res.ok) throw new Error(`Failed to load invoices (${res.status})`);
      const data = await res.json();
      // Deserialize date strings back to Date objects
      const parsed: Invoice[] = (data.invoices ?? []).map((inv: any) => ({
        ...inv,
        date: new Date(inv.date),
        dueDate: new Date(inv.dueDate),
        paidAt: inv.paidAt ? new Date(inv.paidAt) : undefined,
        billingPeriod: {
          start: new Date(inv.billingPeriod.start),
          end: new Date(inv.billingPeriod.end),
        },
      }));
      setInvoices(parsed);
    } catch (err: any) {
      console.error('[InvoiceHistory]', err);
      setError(err.message ?? 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInvoices();
    setRefreshing(false);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.plan.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const displayedInvoices = limit ? filteredInvoices.slice(0, limit) : filteredInvoices;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatCurrency = (amount: number, currency: 'INR' | 'USD') => {
    return new Intl.NumberFormat(language === 'hi' ? 'hi-IN' : 'en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig = {
      paid: {
        variant: 'default' as const,
        icon: CheckCircle,
        className: 'bg-green-500/10 text-green-500 border-green-500/20',
      },
      pending: {
        variant: 'secondary' as const,
        icon: Clock,
        className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      },
      failed: {
        variant: 'destructive' as const,
        icon: XCircle,
        className: 'bg-red-500/10 text-red-500 border-red-500/20',
      },
      refunded: {
        variant: 'outline' as const,
        icon: RefreshCw,
        className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      },
      cancelled: {
        variant: 'outline' as const,
        icon: XCircle,
        className: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={cn('gap-1', config.className)}>
        <Icon className="w-3 h-3" />
        {t[status]}
      </Badge>
    );
  };

  const getPaymentMethodDisplay = (method: Invoice['paymentMethod']) => {
    if (method.type === 'card') {
      return (
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          <span>{method.brand} •••• {method.last4}</span>
        </div>
      );
    }
    if (method.type === 'upi') {
      return (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded text-white text-[10px] font-bold flex items-center justify-center">
            U
          </div>
          <span>{method.upiId}</span>
        </div>
      );
    }
    return method.type.toUpperCase();
  };

  const toggleRowExpansion = (invoiceId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(invoiceId)) {
      newExpanded.delete(invoiceId);
    } else {
      newExpanded.add(invoiceId);
    }
    setExpandedRows(newExpanded);
  };

  const handleDownload = (invoice: Invoice) => {
    // Open Stripe hosted invoice PDF, or the download URL
    const url = invoice.downloadUrl !== '#' ? invoice.downloadUrl : invoice.receiptUrl;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEmailInvoice = async (invoice: Invoice) => {
    try {
      // Stripe: POST /api/invoices/:id/email triggers stripe.invoices.sendInvoice
      const res = await fetch(`/api/invoices/${invoice.id}/email`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to send invoice email');
    } catch (err) {
      console.error('[InvoiceHistory] email error:', err);
    }
  };

  const handlePrint = (invoice: Invoice) => {
    // Open receipt URL in new tab which has browser print support,
    // or fall back to scoped window.print() wrapped in an iframe
    if (invoice.receiptUrl && invoice.receiptUrl !== '#') {
      window.open(invoice.receiptUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.print();
    }
  };

  if (loading) {
    return (
      <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50', className)}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50', className)}>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
          <AlertCircle className="w-12 h-12 text-destructive opacity-60" />
          <p className="text-sm">{error}</p>
          <Button size="sm" variant="outline" onClick={() => fetchInvoices()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{t.title}</CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {displayedInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t.noInvoices}</p>
              <p className="text-sm">{t.noInvoicesDesc}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedInvoices.map((invoice, index) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <Receipt className="w-5 h-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(invoice.date)}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(invoice.total, invoice.currency)}</p>
                    {getStatusBadge(invoice.status)}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setSelectedInvoice(invoice); setShowDetails(true); }}>
                        <Eye className="w-4 h-4 mr-2" />
                        {t.viewDetails}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(invoice)}>
                        <Download className="w-4 h-4 mr-2" />
                        {t.download}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEmailInvoice(invoice)}>
                        <Mail className="w-4 h-4 mr-2" />
                        {t.emailInvoice}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50', className)}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{t.title}</CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')} />
              {t.refresh}
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder={t.filter} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allStatuses}</SelectItem>
                <SelectItem value="paid">{t.paid}</SelectItem>
                <SelectItem value="pending">{t.pending}</SelectItem>
                <SelectItem value="failed">{t.failed}</SelectItem>
                <SelectItem value="refunded">{t.refunded}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {displayedInvoices.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">{t.noInvoices}</p>
              <p className="text-sm">{t.noInvoicesDesc}</p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>{t.invoice}</TableHead>
                    <TableHead>{t.date}</TableHead>
                    <TableHead>{t.plan}</TableHead>
                    <TableHead>{t.amount}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead className="text-right">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedInvoices.map((invoice, index) => (
                    <React.Fragment key={invoice.id}>
                      <TableRow
                        className={cn(
                          'cursor-pointer hover:bg-muted/50',
                          expandedRows.has(invoice.id) && 'bg-muted/30'
                        )}
                      >
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleRowExpansion(invoice.id)}
                          >
                            {expandedRows.has(invoice.id) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                              <Receipt className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{invoice.invoiceNumber}</p>
                              <p className="text-xs text-muted-foreground">
                                {getPaymentMethodDisplay(invoice.paymentMethod)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{formatDate(invoice.date)}</p>
                            {invoice.paidAt && (
                              <p className="text-xs text-muted-foreground">
                                {t.paidOn}: {formatDate(invoice.paidAt)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{invoice.plan}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-medium">
                            {invoice.currency === 'INR' ? (
                              <IndianRupee className="w-4 h-4" />
                            ) : (
                              <DollarSign className="w-4 h-4" />
                            )}
                            {formatCurrency(invoice.total, invoice.currency).replace(/[₹$]/, '')}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDownload(invoice)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setSelectedInvoice(invoice); setShowDetails(true); }}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  {t.viewDetails}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownload(invoice)}>
                                  <Download className="w-4 h-4 mr-2" />
                                  {t.download}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEmailInvoice(invoice)}>
                                  <Mail className="w-4 h-4 mr-2" />
                                  {t.emailInvoice}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePrint(invoice)}>
                                  <Printer className="w-4 h-4 mr-2" />
                                  {t.print}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Row */}
                      <AnimatePresence>
                        {expandedRows.has(invoice.id) && (
                          <TableRow>
                            <TableCell colSpan={7} className="p-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="p-6 bg-muted/20 border-t border-border/50">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Billing Period */}
                                    <div>
                                      <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {t.billingPeriod}
                                      </h4>
                                      <p className="text-sm text-muted-foreground">
                                        {formatDate(invoice.billingPeriod.start)} - {formatDate(invoice.billingPeriod.end)}
                                      </p>
                                    </div>

                                    {/* Items */}
                                    <div>
                                      <h4 className="font-medium mb-2">{t.items}</h4>
                                      {invoice.items.map((item, i) => (
                                        <div key={i} className="text-sm">
                                          <p>{item.description}</p>
                                          <p className="text-muted-foreground">
                                            {item.quantity} × {formatCurrency(item.unitPrice, invoice.currency)}
                                          </p>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Totals */}
                                    <div>
                                      <h4 className="font-medium mb-2">{t.total}</h4>
                                      <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">{t.subtotal}</span>
                                          <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">{t.tax} ({invoice.taxRate}%)</span>
                                          <span>{formatCurrency(invoice.tax, invoice.currency)}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between font-medium">
                                          <span>{t.total}</span>
                                          <span>{formatCurrency(invoice.total, invoice.currency)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </TableCell>
                          </TableRow>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Invoice Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedInvoice && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Receipt className="w-6 h-6 text-primary" />
                  {selectedInvoice.invoiceNumber}
                </DialogTitle>
                <DialogDescription>
                  {formatDate(selectedInvoice.date)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Status */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <span className="font-medium">{t.status}</span>
                  {getStatusBadge(selectedInvoice.status)}
                </div>

                {/* Customer Info */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    {t.customer}
                  </h4>
                  <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                    <p className="font-medium">{selectedInvoice.customer.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedInvoice.customer.email}</p>
                    {selectedInvoice.customer.gstin && (
                      <p className="text-sm text-muted-foreground">
                        {t.gstin}: {selectedInvoice.customer.gstin}
                      </p>
                    )}
                    {selectedInvoice.customer.address && (
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-sm font-medium mb-1">{t.billingAddress}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedInvoice.customer.address.line1}
                          {selectedInvoice.customer.address.line2 && <br />}
                          {selectedInvoice.customer.address.line2}
                          <br />
                          {selectedInvoice.customer.address.city}, {selectedInvoice.customer.address.state} {selectedInvoice.customer.address.postalCode}
                          <br />
                          {selectedInvoice.customer.address.country}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="font-medium mb-3">{t.items}</h4>
                  <div className="rounded-lg border border-border/50 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.unitPrice, selectedInvoice.currency)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.amount, selectedInvoice.currency)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Totals */}
                <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.subtotal}</span>
                    <span>{formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.tax} ({selectedInvoice.taxRate}% GST)</span>
                    <span>{formatCurrency(selectedInvoice.tax, selectedInvoice.currency)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-medium">
                    <span>{t.total}</span>
                    <span>{formatCurrency(selectedInvoice.total, selectedInvoice.currency)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => handleDownload(selectedInvoice)}>
                    <Download className="w-4 h-4 mr-2" />
                    {t.download}
                  </Button>
                  <Button variant="outline" onClick={() => handlePrint(selectedInvoice)}>
                    <Printer className="w-4 h-4 mr-2" />
                    {t.print}
                  </Button>
                  <Button variant="outline" onClick={() => handleEmailInvoice(selectedInvoice)}>
                    <Mail className="w-4 h-4 mr-2" />
                    {t.emailInvoice}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default InvoiceHistory;