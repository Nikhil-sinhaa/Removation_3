// hooks/i18n/auth_pages.ts
import type { Language } from '../useLanguage';

export const authPagesTranslations: Record<string, Record<Language, string>> = {
  // Sign In
  'signin_title': { en: 'Welcome Back', hi: 'वापसी पर स्वागत है' },
  'signin_subtitle': { en: 'Sign in to your Removation account', hi: 'अपने Removation अकाउंट में साइन इन करें' },
  'signin_email': { en: 'Email', hi: 'ईमेल' },
  'signin_email_placeholder': { en: 'Enter your email', hi: 'अपना ईमेल दर्ज करें' },
  'signin_password': { en: 'Password', hi: 'पासवर्ड' },
  'signin_password_placeholder': { en: 'Enter your password', hi: 'अपना पासवर्ड दर्ज करें' },
  'signin_forgot_password': { en: 'Forgot password?', hi: 'पासवर्ड भूल गए?' },
  'signin_btn': { en: 'Sign In', hi: 'साइन इन करें' },
  'signin_signing_in': { en: 'Signing in...', hi: 'साइन इन हो रहा है...' },
  'signin_no_account': { en: "Don't have an account?", hi: 'अकाउंट नहीं है?' },
  'signin_signup_link': { en: 'Sign up', hi: 'साइन अप करें' },
  'signin_or': { en: 'Or continue with', hi: 'या जारी रखें' },
  'signin_google': { en: 'Continue with Google', hi: 'Google से जारी रखें' },

  // Sign Up
  'signup_title': { en: 'Create Account', hi: 'अकाउंट बनाएं' },
  'signup_subtitle': { en: 'Start transforming spaces with AI', hi: 'AI से जगहों को बदलना शुरू करें' },
  'signup_first_name': { en: 'First Name', hi: 'पहला नाम' },
  'signup_last_name': { en: 'Last Name', hi: 'अंतिम नाम' },
  'signup_email': { en: 'Email', hi: 'ईमेल' },
  'signup_email_placeholder': { en: 'Enter your email', hi: 'अपना ईमेल दर्ज करें' },
  'signup_password': { en: 'Password', hi: 'पासवर्ड' },
  'signup_confirm_password': { en: 'Confirm Password', hi: 'पासवर्ड की पुष्टि करें' },
  'signup_btn': { en: 'Create Account', hi: 'अकाउंट बनाएं' },
  'signup_creating': { en: 'Creating account...', hi: 'अकाउंट बन रहा है...' },
  'signup_have_account': { en: 'Already have an account?', hi: 'पहले से अकाउंट है?' },
  'signup_signin_link': { en: 'Sign in', hi: 'साइन इन करें' },
  'signup_terms': { en: 'By signing up, you agree to our', hi: 'साइन अप करके, आप हमारी' },
  'signup_terms_link': { en: 'Terms of Service', hi: 'सेवा शर्तों' },
  'signup_privacy_link': { en: 'Privacy Policy', hi: 'गोपनीयता नीति' },
  'signup_and': { en: 'and', hi: 'और' },
  'signup_agree': { en: 'agree to', hi: 'से सहमत हैं' },

  // Forgot Password
  'forgot_title': { en: 'Forgot Password', hi: 'पासवर्ड भूल गए' },
  'forgot_subtitle': { en: "Enter your email and we'll send you a reset link", hi: 'अपना ईमेल दर्ज करें, हम रीसेट लिंक भेजेंगे' },
  'forgot_email': { en: 'Email', hi: 'ईमेल' },
  'forgot_email_placeholder': { en: 'Enter your email', hi: 'अपना ईमेल दर्ज करें' },
  'forgot_btn': { en: 'Send Reset Link', hi: 'रीसेट लिंक भेजें' },
  'forgot_sending': { en: 'Sending...', hi: 'भेज रहे हैं...' },
  'forgot_back_signin': { en: 'Back to sign in', hi: 'साइन इन पर वापस' },
  'forgot_success': { en: 'Check your email for a reset link', hi: 'रीसेट लिंक के लिए अपना ईमेल देखें' },

  // Reset Password
  'reset_title': { en: 'Reset Password', hi: 'पासवर्ड रीसेट करें' },
  'reset_subtitle': { en: 'Enter your new password below', hi: 'नीचे अपना नया पासवर्ड दर्ज करें' },
  'reset_new_password': { en: 'New Password', hi: 'नया पासवर्ड' },
  'reset_confirm_password': { en: 'Confirm New Password', hi: 'नए पासवर्ड की पुष्टि करें' },
  'reset_btn': { en: 'Reset Password', hi: 'पासवर्ड रीसेट करें' },
  'reset_resetting': { en: 'Resetting...', hi: 'रीसेट हो रहा है...' },

  // OTP Verify
  'otp_title': { en: 'Verify Your Email', hi: 'ईमेल सत्यापित करें' },
  'otp_subtitle': { en: "We've sent a 6-digit code to your email", hi: 'हमने आपके ईमेल पर 6 अंकों का कोड भेजा है' },
  'otp_label': { en: 'Verification Code', hi: 'सत्यापन कोड' },
  'otp_placeholder': { en: 'Enter 6-digit code', hi: '6 अंकों का कोड दर्ज करें' },
  'otp_btn': { en: 'Verify Email', hi: 'ईमेल सत्यापित करें' },
  'otp_verifying': { en: 'Verifying...', hi: 'सत्यापित हो रहा है...' },
  'otp_resend': { en: 'Resend code', hi: 'कोड फिर भेजें' },
  'otp_no_code': { en: "Didn't receive a code?", hi: 'कोड नहीं मिला?' },
};
