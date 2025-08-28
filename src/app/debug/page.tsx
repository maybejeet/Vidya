'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugPage() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Session Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <strong>Status:</strong> {status}
              </div>
              
              <div>
                <strong>Has Session:</strong> {session ? 'Yes' : 'No'}
              </div>
              
              {session && (
                <div>
                  <strong>Session Data:</strong>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
                    {JSON.stringify(session, null, 2)}
                  </pre>
                </div>
              )}
              
              {session?.user && (
                <div>
                  <strong>User Object Keys:</strong>
                  <ul className="list-disc pl-5 mt-2">
                    {Object.keys(session.user).map(key => (
                      <li key={key}>
                        {key}: {typeof (session.user as any)[key]} 
                        {(session.user as any)[key] ? ` (${String((session.user as any)[key]).substring(0, 50)})` : ' (empty/null)'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <strong>Authentication Check Results:</strong>
                <ul className="list-disc pl-5 mt-2">
                  <li>Has user: {session?.user ? 'Yes' : 'No'}</li>
                  <li>Has user.id: {session?.user?.id ? 'Yes' : 'No'}</li>
                  <li>Has user.email: {session?.user?.email ? 'Yes' : 'No'}</li>
                  <li>Has user.googleId: {(session?.user as any)?.googleId ? 'Yes' : 'No'}</li>
                  <li>
                    Would pass middleware check: {
                      (session?.user?.id && session?.user?.email && (session?.user as any)?.googleId) ? 'Yes' : 'No'
                    }
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}