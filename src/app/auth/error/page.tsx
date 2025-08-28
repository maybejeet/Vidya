'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'AccessDenied':
        return 'You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      case 'OAuthSignin':
        return 'Error in constructing an authorization URL.';
      case 'OAuthCallback':
        return 'Error in handling the response from an OAuth provider.';
      case 'OAuthCreateAccount':
        return 'Could not create OAuth provider user in the database.';
      case 'EmailCreateAccount':
        return 'Could not create email provider user in the database.';
      case 'Callback':
        return 'Error in the OAuth callback handler route.';
      case 'OAuthAccountNotLinked':
        return 'The email on the account is already linked, but not with this OAuth account.';
      case 'EmailSignin':
        return 'Sending the e-mail with the verification token failed.';
      case 'CredentialsSignin':
        return 'The authorize callback returned null in the Credentials provider.';
      case 'SessionRequired':
        return 'The content of this page requires you to be signed in at all times.';
      default:
        return 'An unexpected error occurred during authentication.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Authentication Error
          </CardTitle>
          <CardDescription className="text-gray-600">
            {getErrorMessage(error)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Please try signing in again. If the problem persists, contact support.
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/login">
                Try Again
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/" className="flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              <p className="text-xs text-gray-500">
                Error Code: <code className="bg-white px-1 rounded">{error}</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}