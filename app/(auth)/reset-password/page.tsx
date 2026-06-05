'use client';
export const dynamic = 'force-dynamic';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center p-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-xl rounded-2xl border border-red-200 p-6">
        <h2 className="text-xl font-bold text-red-600 mb-2">Invalid Access</h2>
        <p className="text-gray-600 mb-6 font-medium">No reset token provided. Please request a new password reset link.</p>
        <Button asChild className="bg-violet-600 hover:bg-violet-700 text-white">
          <Link href="/forgot-password">Request Reset Link</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">Set new password</h2>
        <p className="text-gray-600 dark:text-gray-400">Please enter your new password below.</p>
      </div>

      {success ? (
        <div className="space-y-6">
          <div className="p-4 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
            Your password has been reset successfully. You can now log in with your new password.
          </div>
          <Button asChild className="w-full bg-violet-600 hover:bg-violet-700 text-white">
            <Link href="/sign-in">Go to Login</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full"
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white" disabled={isLoading}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
