'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function VerifyOTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get('email') || '';
  const { refreshUser } = useAuth();
  
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!email) {
      router.push('/sign-in');
    }
  }, [email, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.ok) {
        await refreshUser();
        router.push('/dashboard');
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setIsResending(true);

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('A new verification code has been sent to your email.');
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('An error occurred while resending the code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700 p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Check your email</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          We&apos;ve sent a 6-digit verification code to <span className="font-semibold text-gray-900 dark:text-white">{email}</span>
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{error}</div>}
        {success && <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-200">{success}</div>}

        <div className="space-y-2">
          <Label htmlFor="otp">Verification Code</Label>
          <Input
            id="otp"
            type="text"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required
            className="text-center text-2xl tracking-widest font-mono h-14"
          />
        </div>

        <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white h-12 text-lg" disabled={isLoading || otp.length < 6}>
          {isLoading ? 'Verifying...' : 'Verify Email'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
        Didn&apos;t receive the code?{' '}
        <button 
          onClick={handleResend}
          disabled={isResending}
          className="font-semibold text-violet-600 hover:text-violet-500 disabled:opacity-50 transition-colors"
        >
          {isResending ? 'Sending...' : 'Click to resend'}
        </button>
      </p>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
        <VerifyOTPForm />
      </Suspense>
    </div>
  );
}
