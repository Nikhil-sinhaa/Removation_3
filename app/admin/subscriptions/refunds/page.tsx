// app/admin/subscriptions/refunds/page.tsx
// Sub-route: redirects to parent /admin/subscriptions
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SubscriptionsRefundsPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin/subscriptions"); }, [router]);
  return null;
}
