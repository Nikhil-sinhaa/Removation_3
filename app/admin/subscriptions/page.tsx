// app/admin/subscriptions/page.tsx
"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  RefreshCw,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Sparkles,
  Crown,
  Zap,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ───────────────────────────────────────────────────────────────────
interface SubStats {
  totalSubscribers: number;
  activeSubscribers: number;
  proSubscribers: number;
  teamSubscribers: number;
  freeSubscribers: number;
  newThisMonth: number;
  revenueGrowth: number;
  totalRevenue: number;
  monthRevenue: number;
  lastMonthRevenue: number;
  byPlan: Record<string, number>;
  byStatus: Record<string, number>;
}

interface Subscriber {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  imageUrl?: string;
  subscription?: {
    plan?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  };
  createdAt: string;
}

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  paymentMethod: string;
}

interface ApiData {
  stats: SubStats;
  subscribers: Subscriber[];
  subTotal: number;
  page: number;
  totalPages: number;
  transactions: Transaction[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatCurrency = (n: number) =>
  `₹${n.toLocaleString("en-IN")}`;

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatTime = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── Sub-components ──────────────────────────────────────────────────────────
const StatCard = ({
  title,
  value,
  sub,
  icon,
  color,
  change,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  change?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2 }}
    className="relative"
  >
    <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-1 ${color}`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
          </div>
          <div className={`p-3 rounded-xl bg-opacity-20 ${color.replace("bg-", "bg-").replace("-500", "-500/20")}`}>
            {icon}
          </div>
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change)}% vs last month
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

const PlanBadge = ({ plan }: { plan?: string }) => {
  const p = plan ?? "free";
  const cfg: Record<string, string> = {
    free: "bg-neutral-500/10 text-neutral-400 border-neutral-500/30",
    pro: "bg-violet-500/10 text-violet-400 border-violet-500/30",
    team: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  };
  return (
    <Badge variant="outline" className={cfg[p] ?? cfg.free}>
      {p.charAt(0).toUpperCase() + p.slice(1)}
    </Badge>
  );
};

const StatusBadge = ({ status }: { status?: string }) => {
  const s = status ?? "unknown";
  const cfg: Record<string, { cls: string; icon: React.ReactNode }> = {
    active:   { cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", icon: <CheckCircle2 className="w-3 h-3" /> },
    inactive: { cls: "bg-neutral-500/10 text-neutral-400 border-neutral-500/30",  icon: <Clock className="w-3 h-3" /> },
    canceled: { cls: "bg-red-500/10 text-red-400 border-red-500/30",              icon: <XCircle className="w-3 h-3" /> },
    trial:    { cls: "bg-amber-500/10 text-amber-400 border-amber-500/30",         icon: <AlertTriangle className="w-3 h-3" /> },
    unknown:  { cls: "bg-neutral-500/10 text-neutral-400 border-neutral-500/30",  icon: <Clock className="w-3 h-3" /> },
  };
  const { cls, icon } = cfg[s] ?? cfg.unknown;
  return (
    <Badge variant="outline" className={`${cls} flex items-center gap-1`}>
      {icon}
      <span className="capitalize">{s}</span>
    </Badge>
  );
};

const TxStatusBadge = ({ status }: { status: string }) => {
  const isPaid = ["completed", "succeeded", "paid", "captured"].includes(status);
  const isRefund = status === "refunded";
  const cls = isPaid
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
    : isRefund
    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
    : "bg-red-500/10 text-red-400 border-red-500/30";
  return <Badge variant="outline" className={`${cls} capitalize`}>{status}</Badge>;
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SubscriptionsPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  // 'plans' sub-page redirects here; closest tab is 'subscribers'
  const [activeSubTab, setActiveSubTab] = useState(
    tabParam === 'transactions' ? 'transactions' : 'subscribers'
  );

  const [data, setData]       = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState("");
  const [plan,   setPlan]   = useState("all");
  const [status, setStatus] = useState("all");

  const [searchInput, setSearchInput] = useState("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page:   String(page),
        limit:  "20",
        search,
        plan,
        status,
      });
      const res = await fetch(`/api/admin/subscriptions?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [page, search, plan, status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Skeleton ─────────────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-neutral-800 bg-neutral-900/50">
              <CardContent className="p-5">
                <Skeleton className="h-4 w-24 mb-3 bg-neutral-800" />
                <Skeleton className="h-8 w-32 bg-neutral-800" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardContent className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-12 bg-neutral-800" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Manage plans, payments, and subscriber accounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400"
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <Button variant="ghost" size="sm" className="ml-auto text-red-400 hover:text-red-300" onClick={fetchData}>
            Retry
          </Button>
        </motion.div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Subscribers"
          value={stats ? stats.totalSubscribers.toLocaleString() : "—"}
          sub={`${stats?.newThisMonth ?? 0} new this month`}
          icon={<Users className="w-5 h-5 text-violet-400" />}
          color="bg-violet-500"
          change={stats?.revenueGrowth}
        />
        <StatCard
          title="Active"
          value={stats ? stats.activeSubscribers.toLocaleString() : "—"}
          sub={`${stats ? Math.round((stats.activeSubscribers / Math.max(stats.totalSubscribers, 1)) * 100) : 0}% of total`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          color="bg-emerald-500"
        />
        <StatCard
          title="Monthly Revenue"
          value={stats ? formatCurrency(stats.monthRevenue) : "—"}
          sub={`Total: ${stats ? formatCurrency(stats.totalRevenue) : "—"}`}
          icon={<IndianRupee className="w-5 h-5 text-amber-400" />}
          color="bg-amber-500"
          change={stats?.revenueGrowth}
        />
        <StatCard
          title="Pro / Teams"
          value={stats ? `${stats.proSubscribers} / ${stats.teamSubscribers}` : "—"}
          sub="Plan distribution"
          icon={<Crown className="w-5 h-5 text-blue-400" />}
          color="bg-blue-500"
        />
      </div>

      {/* ── Plan distribution bar ── */}
      {stats && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-neutral-800 bg-neutral-900/50">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300">Plan Distribution</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              {[
                { label: "Free",  count: stats.freeSubscribers,  color: "bg-neutral-500" },
                { label: "Pro",   count: stats.proSubscribers,   color: "bg-violet-500" },
                { label: "Teams", count: stats.teamSubscribers,  color: "bg-blue-500" },
              ].map((item) => {
                const total = stats.freeSubscribers + stats.proSubscribers + stats.teamSubscribers || 1;
                const pct   = Math.round((item.count / total) * 100);
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-neutral-400">{item.label}</span>
                      <span className="text-white font-medium">{item.count.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${item.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Tabs: Subscribers / Transactions ── */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="bg-neutral-900 border border-neutral-800">
          <TabsTrigger value="subscribers" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400">
            <Users className="w-4 h-4 mr-2" />
            Subscribers
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400">
            <Receipt className="w-4 h-4 mr-2" />
            Transactions
          </TabsTrigger>
        </TabsList>

        {/* ── Subscribers tab ── */}
        <TabsContent value="subscribers" className="mt-4">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <Input
                placeholder="Search by name or email…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"
              />
            </div>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger className="w-36 bg-neutral-900 border-neutral-700 text-neutral-300">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-700">
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="team">Teams</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-36 bg-neutral-900 border-neutral-700 text-neutral-300">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card className="border-neutral-800 bg-neutral-900/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800">
                    {["User", "Plan", "Status", "Started", "Renewal"].map((h) => (
                      <th key={h} className="p-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {loading ? (
                      [...Array(6)].map((_, i) => (
                        <tr key={i} className="border-b border-neutral-800">
                          {[...Array(5)].map((_, j) => (
                            <td key={j} className="p-4">
                              <Skeleton className="h-5 w-full bg-neutral-800" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : data?.subscribers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-10 text-center text-neutral-500">
                          No subscribers found
                        </td>
                      </tr>
                    ) : (
                      data?.subscribers.map((sub) => {
                        const name = [sub.firstName, sub.lastName].filter(Boolean).join(" ") || sub.email;
                        const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                        return (
                          <motion.tr
                            key={sub._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="border-b border-neutral-800 hover:bg-neutral-800/30 transition-colors"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={sub.imageUrl} />
                                  <AvatarFallback className="text-xs bg-gradient-to-br from-violet-600 to-blue-600 text-white">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium text-white">{name}</p>
                                  <p className="text-xs text-neutral-500">{sub.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4"><PlanBadge plan={sub.subscription?.plan} /></td>
                            <td className="p-4"><StatusBadge status={sub.subscription?.status} /></td>
                            <td className="p-4">
                              <span className="text-sm text-neutral-400">
                                {sub.subscription?.startDate ? formatDate(sub.subscription.startDate) : "—"}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="text-sm text-neutral-400">
                                {sub.subscription?.endDate ? formatDate(sub.subscription.endDate) : "—"}
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-neutral-800 p-4">
                <span className="text-xs text-neutral-500">
                  {data.subTotal.toLocaleString()} subscribers
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-neutral-700 text-neutral-300"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-neutral-400">
                    {page} / {data.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-neutral-700 text-neutral-300"
                    disabled={page >= data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── Transactions tab ── */}
        <TabsContent value="transactions" className="mt-4">
          <Card className="border-neutral-800 bg-neutral-900/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800">
                    {["User", "Plan", "Amount", "Method", "Status", "Date"].map((h) => (
                      <th key={h} className="p-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="border-b border-neutral-800">
                        {[...Array(6)].map((_, j) => (
                          <td key={j} className="p-4">
                            <Skeleton className="h-5 w-full bg-neutral-800" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : !data?.transactions.length ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-neutral-500">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    data.transactions.slice(0, 50).map((tx) => (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-neutral-800 hover:bg-neutral-800/30 transition-colors"
                      >
                        <td className="p-4">
                          <div>
                            <p className="text-sm font-medium text-white">{tx.userName}</p>
                            <p className="text-xs text-neutral-500">{tx.userEmail}</p>
                          </div>
                        </td>
                        <td className="p-4"><PlanBadge plan={tx.plan} /></td>
                        <td className="p-4">
                          <span className="text-sm font-medium text-emerald-400">
                            {formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-neutral-400 capitalize">{tx.paymentMethod}</span>
                        </td>
                        <td className="p-4"><TxStatusBadge status={tx.status} /></td>
                        <td className="p-4">
                          <span className="text-sm text-neutral-400">{formatTime(tx.createdAt)}</span>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
