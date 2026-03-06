// app/(auth)/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign In | Removation.ai",
  description: "Sign in to your Removation.ai account and continue transforming spaces with AI-powered interior design.",
  openGraph: {
    title: "Sign In | Removation.ai",
    description: "Sign in to your Removation.ai account and continue transforming spaces with AI-powered interior design.",
    images: ["/images/og-image.png"],
  },
};

export default async function SignInPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Showcase */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="diagonal" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="20" stroke="white" strokeWidth="2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diagonal)" />
          </svg>
        </div>

        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-purple-400/15 rounded-full blur-2xl animate-pulse delay-1000" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/20">
              <svg className="w-7 h-7 text-violet-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">Removation.ai</span>
          </Link>

          {/* Welcome Back Message */}
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            Welcome back!
          </h1>
          <p className="text-xl text-violet-100 mb-12 max-w-md">
            Your AI-powered design studio awaits. Continue creating stunning spaces.
          </p>

          {/* Before/After Showcase */}
          <div className="relative max-w-lg">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 border-2 border-white/50" />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 border-2 border-white/50" />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 border-2 border-white/50" />
                </div>
                <span className="text-white/80 text-sm">+2,847 designers online now</span>
              </div>

              {/* Mock Before/After */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative aspect-[4/3] rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-8 h-8 text-white/60 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-white/60">Before</span>
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/40 rounded-md text-xs text-white">
                    Original
                  </div>
                </div>
                <div className="relative aspect-[4/3] rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-8 h-8 text-white/80 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      <span className="text-xs text-white/80">AI Styled</span>
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 px-2 py-1 bg-white/20 backdrop-blur rounded-md text-xs text-white flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    Modern
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>~8 seconds</span>
                </div>
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <span>Vastu Score: 87</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Ticker */}
          <div className="mt-12 flex items-center gap-3 text-white/60 text-sm">
            <div className="flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>Rahul from Mumbai just redesigned their living room</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-12 bg-white dark:bg-gray-900">
        {/* Mobile Logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Removation.ai</span>
          </Link>
        </div>

        {/* Header */}
        <div className="w-full max-w-md text-center mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Sign in to your account
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Please enter your details.
          </p>
        </div>

        {/* Clerk SignIn Component */}
        <div className="w-full max-w-md">
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700 p-6",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200 font-medium py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow",
                socialButtonsBlockButtonText: "font-medium",
                socialButtonsBlockButtonArrow: "text-gray-400",
                dividerLine: "bg-gray-200 dark:bg-gray-600",
                dividerText: "text-gray-500 dark:text-gray-400 text-sm",
                formFieldLabel:
                  "text-gray-700 dark:text-gray-300 font-medium text-sm mb-1.5",
                formFieldInput:
                  "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200",
                formFieldInputShowPasswordButton:
                  "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                formButtonPrimary:
                  "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5",
                footerActionLink:
                  "text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium transition-colors",
                identityPreviewEditButton:
                  "text-violet-600 dark:text-violet-400 hover:text-violet-700",
                identityPreviewText: "text-gray-700 dark:text-gray-300",
                formFieldSuccessText: "text-green-600 dark:text-green-400",
                formFieldErrorText: "text-red-500 dark:text-red-400 text-sm",
                formFieldWarningText: "text-amber-500 dark:text-amber-400",
                otpCodeFieldInput:
                  "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl text-center text-lg font-semibold",
                formResendCodeLink:
                  "text-violet-600 dark:text-violet-400 hover:text-violet-700 font-medium",
                alert: "rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800",
                alertText: "text-sm text-red-600 dark:text-red-400",
                logoBox: "hidden",
                footer: "hidden",
                alternativeMethodsBlockButton:
                  "border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors",
                backLink: "text-violet-600 dark:text-violet-400 hover:text-violet-700",
              },
              layout: {
                socialButtonsPlacement: "top",
                socialButtonsVariant: "blockButton",
                privacyPageUrl: "/privacy",
                termsPageUrl: "/terms",
              },
            }}
            fallbackRedirectUrl="/dashboard"
            signUpUrl="/sign-up"
          />
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold transition-colors"
            >
              Sign up for free
            </Link>
          </p>
        </div>

        {/* Help Section */}
        <div className="mt-8 w-full max-w-md">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Need help signing in?
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Contact our support team for assistance with your account.
                </p>
                <a
                  href="mailto:support@removation.ai"
                  className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 font-medium inline-flex items-center gap-1 transition-colors"
                >
                  support@removation.ai
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-2 text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>256-bit SSL</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>SOC 2 Compliant</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>GDPR Ready</span>
          </div>
        </div>

        {/* Language Toggle */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
            English
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
            हिंदी
          </button>
        </div>

        {/* Terms */}
        <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400 max-w-sm">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="text-violet-600 dark:text-violet-400 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-violet-600 dark:text-violet-400 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}