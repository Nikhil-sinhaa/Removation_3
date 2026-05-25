import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { issueJwt } from '@/lib/auth/jwt';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sign-in?error=No+authorization+code+provided`);
    }

    // Exchange authorization code for access token
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const values = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`,
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
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sign-in?error=Failed+to+authenticate+with+Google`);
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
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sign-in?error=Failed+to+retrieve+Google+profile`);
    }

    const profile = await userinfoRes.json();
    const { email, given_name, family_name, picture } = profile;

    if (!email) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sign-in?error=Google+profile+did+not+contain+an+email`);
    }

    await connectToDatabase();

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create user
      user = await User.create({
        email,
        firstName: given_name || '',
        lastName: family_name || '',
        imageUrl: picture || '',
        isVerified: true,
        credits: 10,
        subscription: {
          plan: 'free',
          status: 'inactive',
          credits: 10,
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

    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/`);
    issueJwt(response, user);

    return response;
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sign-in?error=Internal+server+error`);
  }
}
