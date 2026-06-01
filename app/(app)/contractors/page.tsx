'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContractorsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/marketplace?tab=contractors');
  }, [router]);
  return null;
}
