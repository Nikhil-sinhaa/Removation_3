'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function SignUpForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Show errors passed back from the Google OAuth callback
  const urlError = searchParams?.get('error') ?? '';
  const [error, setError] = useState(urlError ? decodeURIComponent(urlError) : '');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(data.redirectTo || '/onboarding');
        router.refresh();
      } else {
        setError(data.message || 'Error creating account');
      }
    } catch (err) {
      setError('An error occurred during sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create an account</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Enter your details to get started.</p>
      </div>

      {/* OAuth Google Sign In */}
      <div className="mb-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.href = '/api/auth/google'}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 shadow-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] font-medium"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 1.68 14.96 1 12 1 7.35 1 3.37 3.68 1.39 7.56l3.77 2.92c.9-2.7 3.42-4.44 6.84-4.44z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.99 3.7-8.62z"
            />
            <path
              fill="#FBBC05"
              d="M5.16 14.44c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.39 6.96C.5 8.74 0 10.74 0 12s.5 3.26 1.39 5.04l3.77-3.04z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.73-2.89c-1.04.7-2.38 1.11-4.23 1.11-3.42 0-5.94-2.14-6.84-4.44l-3.77 3.04C3.37 20.32 7.35 23 12 23z"
            />
          </svg>
          Continue with Google
        </Button>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white dark:bg-gray-900 px-3 text-gray-500 dark:text-gray-400">or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleSignUp} className="space-y-4">
        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name (optional)</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name (optional)</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
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

        <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Sign up'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link href="/sign-in" className="font-semibold text-violet-600 hover:text-violet-500">
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
      <SignUpForm />
    </Suspense>
  );
}

