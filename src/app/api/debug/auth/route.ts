import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        
        return NextResponse.json({
            hasSession: !!session,
            sessionData: session,
            user: session?.user,
            timestamp: new Date().toISOString(),
            headers: Object.fromEntries(request.headers.entries())
        });
    } catch (error) {
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

