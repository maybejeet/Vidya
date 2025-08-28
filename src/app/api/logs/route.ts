import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect, { isDbConnected } from '@/lib/dbConnect';
import Log from '@/models/log.model';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        if (!(await isDbConnected())) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');
        const page = parseInt(searchParams.get('page') || '1');

        // Build query
        const query: Record<string, unknown> = { teacher: session.user.id };
        
        if (action) {
            query.action = action;
        }
        
        if (status) {
            query.status = status;
        }

        // Get logs with pagination
        const logs = await Log.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .lean();

        // Get total count for pagination
        const total = await Log.countDocuments(query);

        return NextResponse.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching logs:', error);
        
        return NextResponse.json(
            { error: 'Failed to fetch logs' },
            { status: 500 }
        );
    }
}
