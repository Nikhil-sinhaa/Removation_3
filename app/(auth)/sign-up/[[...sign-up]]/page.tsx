// app/(auth)/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from "@clerk/nextjs";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sign Up | Removation.ai",
  description: "Create your Removation.ai account and start transforming spaces with AI-powered interior design.",
  openGraph: {
    title: "Sign Up | Removation.ai",
    description: "Create your Removation.ai account and start transforming spaces with AI-powered interior design.",
    images: ["/images/og-image.png"],
  },
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-violet-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">Removation.ai</span>
          </Link>
          
          {/* Headline */}
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Transform any space
            <br />
            <span className="text-purple-200">with AI magic</span>
          </h1>
          
          <p className="text-lg text-purple-100 mb-10 max-w-md">
            Join thousands of designers, architects, and homeowners using AI to visualize and renovate spaces instantly.
          </p>
          
          {/* Features List */}
          <div className="space-y-5">
            {[
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: "AI-Powered Transformations",
                description: "Generate stunning redesigns in seconds"
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: "Real-Time Cost Calculator",
                description: "Get instant renovation estimates in ₹ & $"
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                ),
                title: "Vastu Shastra AI Engine",
                description: "Get Vastu scores & auto-fix suggestions"
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                title: "400+ Design Styles",
                description: "From Modern to Traditional Indian styles"
              }
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-purple-200">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-8 mt-12 pt-8 border-t border-white/20">
            <div>
              <div className="text-3xl font-bold text-white">50K+</div>
              <div className="text-sm text-purple-200">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">1M+</div>
              <div className="text-sm text-purple-200">Renders Created</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">4.9★</div>
              <div className="text-sm text-purple-200">User Rating</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side - Sign Up Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-12 bg-gray-50 dark:bg-gray-900">
        {/* Mobile Logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Removation.ai</span>
          </Link>
        </div>
        
        {/* Header */}
        <div className="w-full max-w-md text-center mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create your account
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Start your free trial with 5 AI renders
          </p>
        </div>
        
        {/* Clerk SignUp Component */}
        <div className="w-full max-w-md">
          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-white dark:bg-gray-800 shadow-xl rounded-2xl border-0 p-6",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: 
                  "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium py-3 rounded-xl transition-all duration-200",
                socialButtonsBlockButtonText: "font-medium",
                dividerLine: "bg-gray-200 dark:bg-gray-600",
                dividerText: "text-gray-500 dark:text-gray-400",
                formFieldLabel: 
                  "text-gray-700 dark:text-gray-300 font-medium text-sm",
                formFieldInput: 
                  "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200",
                formButtonPrimary: 
                  "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-violet-500/30",
                footerActionLink: 
                  "text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium",
                identityPreviewEditButton: 
                  "text-violet-600 dark:text-violet-400",
                formFieldSuccessText: "text-green-600 dark:text-green-400",
                formFieldErrorText: "text-red-500 dark:text-red-400",
                otpCodeFieldInput: 
                  "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl",
                formResendCodeLink: 
                  "text-violet-600 dark:text-violet-400 hover:text-violet-700",
                alert: "rounded-xl",
                alertText: "text-sm",
                logoBox: "hidden",
                footer: "hidden",
              },
              layout: {
                socialButtonsPlacement: "top",
                socialButtonsVariant: "blockButton",
                privacyPageUrl: "/privacy",
                termsPageUrl: "/terms",
              },
            }}
            redirectUrl="/dashboard"
            signInUrl="/sign-in"
          />
        </div>
        
        {/* Footer Links */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link 
              href="/sign-in" 
              className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
        
        {/* Trust Badges */}
        <div className="mt-8 flex items-center justify-center gap-6 text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-2 text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>SSL Secured</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>GDPR Compliant</span>
          </div>
        </div>
        
        {/* Terms */}
        <p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-400 max-w-sm">
          By signing up, you agree to our{" "}
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