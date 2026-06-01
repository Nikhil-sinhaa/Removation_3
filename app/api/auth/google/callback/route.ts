import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { issueJwt } from '@/lib/auth/jwt';
import { isSafeRedirectPath } from '@/lib/auth/safeRedirect';

import { getFreeCreditsOnSignup } from '@/lib/ai/appMode';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(`${APP_URL}/sign-in?error=No+authorization+code+provided`);
    }

    // Exchange authorization code for access token
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const values = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: `${APP_URL}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    };

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(values).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Failed to exchange code for tokens:', errText);
      return NextResponse.redirect(`${APP_URL}/sign-in?error=Failed+to+authenticate+with+Google`);
    }

    const { access_token } = await tokenRes.json();

    // Fetch user details from Google userinfo API
    const userinfoUrl = 'https://www.googleapis.com/oauth2/v3/userinfo';
    const userinfoRes = await fetch(userinfoUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userinfoRes.ok) {
      console.error('Failed to fetch userinfo from Google');
      return NextResponse.redirect(`${APP_URL}/sign-in?error=Failed+to+retrieve+Google+profile`);
    }

    const profile = await userinfoRes.json();
    const { email, given_name, family_name, picture } = profile;

    if (!email) {
      return NextResponse.redirect(`${APP_URL}/sign-in?error=Google+profile+did+not+contain+an+email`);
    }

    await connectToDatabase();

    // Check if user exists
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const signupCredits = await getFreeCreditsOnSignup().catch(err => {
        console.error('Error fetching dynamic free credits on Google signup:', err);
        return 10;
      });

      // Create user
      user = await User.create({
        email,
        firstName: given_name || '',
        lastName: family_name || '',
        imageUrl: picture || '',
        isVerified: true,
        credits: signupCredits,
        subscription: {
          plan: 'free',
          status: 'inactive',
          credits: signupCredits,
          creditsUsed: 0,
          cancelAtPeriodEnd: false,
          paymentMethod: 'none',
        },
      });
    } else {
      // If user exists, ensure they are verified and update Google profile details if empty
      let needsSave = false;
      if (!user.isVerified) {
        user.isVerified = true;
        needsSave = true;
      }
      if (!user.imageUrl && picture) {
        user.imageUrl = picture;
        needsSave = true;
      }
      if (!user.firstName && given_name) {
        user.firstName = given_name;
        needsSave = true;
      }
      if (!user.lastName && family_name) {
        user.lastName = family_name;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    }

    // New Google OAuth users go to onboarding
    if (isNewUser) {
      const response = NextResponse.redirect(`${APP_URL}/onboarding`);
      issueJwt(response, { _id: String(user._id), email: user.email });
      return response;
    }

    // Determine where to redirect after login.
    // Default to '/dashboard' so the auth guard runs and the UI shows the logged-in state.
    // (The marketing homepage '/' has no auth check, so the cookie would be set but
    // the sidebar would still show a logged-out state until the next navigation.)
    let postLoginRedirect = '/dashboard';

    // Read and verify the OAuth state JWT (CSRF + redirect).
    // On any failure: still log the user in, just send them to '/'.
    // On success: re-validate the redirect path as defense in depth.
    const stateParam = searchParams.get('state');
    if (stateParam) {
      try {
        const payload = jwt.verify(stateParam, JWT_SECRET) as { csrf?: string; redirect?: unknown };
        // Re-validate redirect with isSafeRedirectPath (defense in depth).
        if (isSafeRedirectPath(payload.redirect)) {
          postLoginRedirect = payload.redirect;
        }
      } catch (err) {
        // Verification failed (bad signature, expired, malformed) — fall back to '/dashboard'.
        // This is expected for tampered or timed-out state params.
        console.warn('OAuth state verification failed, redirecting to /dashboard:', (err as Error).message);
      }
    }

    const response = NextResponse.redirect(`${APP_URL}${postLoginRedirect}`);
    issueJwt(response, { _id: String(user._id), email: user.email });

    return response;
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(`${APP_URL}/sign-in?error=Internal+server+error`);
  }
}
