'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Check your email for a reset link.');
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to send reset email.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <div className="w-12 h-12 mx-auto bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">Forgot password?</h2>
        <p className="text-gray-600 dark:text-gray-400">No worries, we&apos;ll send you reset instructions.</p>
      </div>

      {status === 'success' ? (
        <div className="space-y-6">
          <div className="p-4 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
            {message}
          </div>
          <Button asChild className="w-full bg-violet-600 hover:bg-violet-700 text-white">
            <Link href="/sign-in">Return to log in</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {status === 'error' && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{message}</div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
              autoComplete="email"
            />
          </div>

          <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white" disabled={status === 'loading'}>
            {status === 'loading' ? 'Sending...' : 'Reset password'}
          </Button>
        </form>
      )}

      <div className="mt-8 text-center">
        <Link href="/sign-in" className="text-sm font-semibold text-violet-600 hover:text-violet-500 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to log in
        </Link>
      </div>
    </>
  );
}
