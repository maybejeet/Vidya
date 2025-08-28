'use client';

import { signIn, useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');

  useEffect(() => {
    console.log('Login page - Session status:', status);
    console.log('Login page - Session data:', session);
    console.log('Login page - User ID:', session?.user?.id);
    
    // If we have a session but no valid user data, clear it
    if (status === 'authenticated' && session && (!session.user || !session.user.id)) {
      console.log('Invalid session detected, signing out');
      signOut({ redirect: false });
      return;
    }
    
    // Only redirect if we have a valid session with all required data
    if (status === 'authenticated' && 
        session?.user?.id && 
        session?.user?.email && 
        (session?.user as any)?.googleId) {
      console.log('Valid session found, redirecting to:', callbackUrl);
      router.push(callbackUrl);
    }
  }, [session, status, router, callbackUrl]);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signIn('google', { 
        callbackUrl,
        redirect: true 
      });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsSigningIn(false);
    }
  };

  const getErrorMessage = (errorType: string) => {
    switch (errorType) {
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
        return 'There was an error with Google authentication. Please try again.';
      case 'AccessDenied':
        return 'Access was denied. Please make sure you have the necessary permissions.';
      default:
        return 'An error occurred during sign in. Please try again.';
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if already authenticated
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome to AI Classroom Assistant
          </CardTitle>
          <CardDescription className="text-gray-600">
            Sign in with your Google account to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {getErrorMessage(error)}
              </AlertDescription>
            </Alert>
          )}

          {/* Debug: Show clear session button if we have invalid session */}
          {status === 'authenticated' && (!session?.user?.id || !session?.user?.email) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Invalid session detected</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => signOut({ redirect: false })}
                >
                  Clear Session
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            size="lg"
          >
            {isSigningIn ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </>
            )}
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              By signing in, you agree to our{' '}
              <a href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>

          {callbackUrl !== '/dashboard' && (
            <div className="text-center">
              <p className="text-xs text-gray-500">
                You will be redirected to: {callbackUrl}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}