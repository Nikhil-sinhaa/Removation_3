// app/admin/analytics/revenue/page.tsx – redirects to parent
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function Page() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin/analytics"); }, [router]);
  return null;
}
