// app/admin/subscriptions/transactions/page.tsx
// Sub-route: redirects to parent /admin/subscriptions
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SubscriptionsTransactionsPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin/subscriptions"); }, [router]);
  return null;
}
