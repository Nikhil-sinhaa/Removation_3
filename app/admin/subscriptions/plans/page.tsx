// app/admin/subscriptions/plans/page.tsx
// Sub-route: redirects to parent /admin/subscriptions
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SubscriptionsPlansPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin/subscriptions"); }, [router]);
  return null;
}
