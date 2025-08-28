import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/dbConnect';
import Teacher from '@/models/user.model';
import Upload from '@/models/upload.model';
import Log from '@/models/log.model';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!(await dbConnect())) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        const { uploadId, dueDate } = await request.json();

        if (!uploadId) {
            return NextResponse.json({ error: 'Upload ID is required' }, { status: 400 });
        }

        const teacher = await Teacher.findById(session.user.id);
        if (!teacher) {
            return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
        }

        const upload = await Upload.findById(uploadId);
        if (!upload) {
            return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
        }

        if (upload.teacher.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized access to upload' }, { status: 403 });
        }

        // Post notes as material to Google Classroom
        let notesPostId = null;
        if (upload.notes && !upload.postedToClassroom.notes) {
            try {
                const materialResponse = await fetch(`https://classroom.googleapis.com/v1/courses/${upload.classroomId}/courseWorkMaterials`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${teacher.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: `Notes: ${upload.fileName}`,
                        description: upload.notes,
                        materials: [{
                            driveFile: {
                                driveFile: {
                                    id: 'placeholder', // In production, you'd upload to Google Drive first
                                    title: upload.fileName
                                },
                                shareMode: 'STUDENT_COPY'
                            }
                        }],
                        state: 'PUBLISHED'
                    })
                });

                if (materialResponse.ok) {
                    const materialData = await materialResponse.json();
                    notesPostId = materialData.id;
                    upload.postedToClassroom.notes = true;
                    upload.postedToClassroom.notesPostId = notesPostId;
                } else {
                    throw new Error(`Failed to post notes: ${materialResponse.statusText}`);
                }
            } catch (error) {
                console.error('Error posting notes:', error);
                // Continue with questions even if notes fail
            }
        }

        // Post questions as assignment to Google Classroom
        let questionsPostId = null;
        if (upload.questions && upload.questions.length > 0 && !upload.postedToClassroom.questions) {
            try {
                const assignmentResponse = await fetch(`https://classroom.googleapis.com/v1/courses/${upload.classroomId}/courseWork`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${teacher.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: `Quiz: ${upload.fileName}`,
                        description: 'AI-generated quiz questions based on the uploaded material',
                        materials: [{
                            driveFile: {
                                driveFile: {
                                    id: 'placeholder', // In production, you'd upload to Google Drive first
                                    title: upload.fileName
                                },
                                shareMode: 'STUDENT_COPY'
                            }
                        }],
                        workType: 'ASSIGNMENT',
                        state: 'PUBLISHED',
                        dueDate: dueDate ? {
                            year: new Date(dueDate).getFullYear(),
                            month: new Date(dueDate).getMonth() + 1,
                            day: new Date(dueDate).getDate()
                        } : undefined,
                        dueTime: dueDate ? {
                            hours: 23,
                            minutes: 59
                        } : undefined,
                        maxPoints: upload.questions.length * 2, // 2 points per question
                        submissionModificationMode: 'MODIFIABLE_UNTIL_TURNED_IN'
                    })
                });

                if (assignmentResponse.ok) {
                    const assignmentData = await assignmentResponse.json();
                    questionsPostId = assignmentData.id;
                    upload.postedToClassroom.questions = true;
                    upload.postedToClassroom.questionsPostId = questionsPostId;
                } else {
                    throw new Error(`Failed to post questions: ${assignmentResponse.statusText}`);
                }
            } catch (error) {
                console.error('Error posting questions:', error);
            }
        }

        // Save updated upload status
        await upload.save();

        // Log successful posting
        await Log.create({
            teacher: session.user.id,
            classroomId: upload.classroomId,
            action: 'post_notes_to_classroom',
            status: 'success',
            metadata: { 
                uploadId: upload._id,
                notesPosted: !!notesPostId,
                questionsPosted: !!questionsPostId
            }
        });

        return NextResponse.json({
            success: true,
            notesPosted: !!notesPostId,
            questionsPosted: !!questionsPostId,
            notesPostId,
            questionsPostId
        });

    } catch (error) {
        console.error('Error posting to classroom:', error);
        
        // Log the error
        try {
            const session = await auth();
            if (session?.user?.id) {
                await Log.create({
                    teacher: session.user.id,
                    action: 'post_notes_to_classroom',
                    status: 'failure',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        } catch (logError) {
            console.error('Error logging failure:', logError);
        }

        return NextResponse.json(
            { error: 'Failed to post to classroom' },
            { status: 500 }
        );
    }
}
