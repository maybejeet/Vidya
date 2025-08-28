"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LogoutPage() {
  useEffect(() => {
    // Trigger sign out on mount and redirect to home
    signOut({ redirect: true, callbackUrl: "/" });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Signing you out…</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Please wait while we securely log you out.</p>
        </CardContent>
      </Card>
    </div>
  );
}


