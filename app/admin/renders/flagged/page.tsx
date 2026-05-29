// app/admin/renders/flagged/page.tsx – redirects to parent
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function Page() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin/renders"); }, [router]);
  return null;
}
