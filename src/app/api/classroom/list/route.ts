import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect, { isDbConnected } from '@/lib/dbConnect';
import Teacher from '@/models/user.model';
import Log from '@/models/log.model';

export async function GET() {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        if (!(await isDbConnected())) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        const teacher = await Teacher.findById(session.user.id);
        if (!teacher) {
            return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
        }

        // Fetch Google Classroom courses using the access token
        const response = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
            headers: {
                'Authorization': `Bearer ${teacher.accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Google Classroom API error: ${response.statusText}`);
        }

        const data = await response.json();
        const courses = data.courses || [];

        // Log successful fetch
        await Log.create({
            teacher: teacher._id,
            action: 'classroom_fetch',
            status: 'success',
            metadata: { courseCount: courses.length }
        });

        return NextResponse.json({ courses });

    } catch (error) {
        console.error('Error fetching classrooms:', error);
        
        // Log the error
        try {
            const session = await auth();
            if (session?.user?.id) {
                await Log.create({
                    teacher: session.user.id,
                    action: 'classroom_fetch',
                    status: 'failure',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        } catch (logError) {
            console.error('Error logging failure:', logError);
        }

        return NextResponse.json(
            { error: 'Failed to fetch classrooms' },
            { status: 500 }
        );
    }
}
