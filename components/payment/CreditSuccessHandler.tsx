'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

function CreditSuccessLogic() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get('credits') === 'success') {
      toast({
        title: 'Payment Successful',
        description: 'Your credits have been successfully added to your account.',
      });
      
      // Remove the query parameter to avoid showing the toast again on reload
      const params = new URLSearchParams(searchParams.toString());
      params.delete('credits');
      const newQuery = params.toString();
      const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, pathname, router, toast]);

  return null;
}

export function CreditSuccessHandler() {
  return (
    <Suspense fallback={null}>
      <CreditSuccessLogic />
    </Suspense>
  );
}
