import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect, { isDbConnected } from '@/lib/dbConnect';
// Teacher model not used in this route
import Upload from '@/models/upload.model';
import Log from '@/models/log.model';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        if (!(await isDbConnected())) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const classroomId = formData.get('classroomId') as string;

        if (!file || !classroomId) {
            return NextResponse.json({ error: 'File and classroom ID are required' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only PDF and PPT files are allowed.' }, { status: 400 });
        }

        // For now, we'll store the file in memory and process it
        // In production, you'd want to upload to S3 or similar storage
        // const fileBuffer = await file.arrayBuffer(); // Will be used for proper file parsing
        // const fileContent = new Uint8Array(fileBuffer); // Will be used for proper file parsing

        // Create upload record
        const upload = await Upload.create({
            teacher: session.user.id,
            classroomId,
            fileUrl: 'temp', // In production, this would be the S3 URL
            fileName: file.name,
            fileType: file.type.includes('pdf') ? 'pdf' : 'ppt',
            status: 'processing'
        });

        // Process with Gemini AI
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

        // Convert file content to text (simplified - in production you'd use proper parsers)
        let fileText = '';
        if (file.type.includes('pdf')) {
            // For PDF, you'd use pdf-parse library
            fileText = 'PDF content placeholder - implement proper PDF parsing';
        } else {
            // For PPT, you'd use proper PPT parsing library
            fileText = 'PPT content placeholder - implement proper PPT parsing';
        }

        // Generate notes using Gemini
        const notesPrompt = `Please analyze the following educational content and create comprehensive, well-structured notes that would be helpful for students. Focus on key concepts, main ideas, and important details. Format the notes in a clear, organized manner:

Content: ${fileText}

Please provide:
1. A summary of the main topic
2. Key concepts and definitions
3. Important points and examples
4. Any relevant formulas or procedures
5. A conclusion or summary`;

        const notesResult = await model.generateContent(notesPrompt);
        const notes = notesResult.response.text();

        // Generate quiz questions using Gemini
        const questionsPrompt = `Based on the following educational content, create 5 multiple-choice quiz questions that test understanding of the key concepts. Each question should have 4 options (A, B, C, D) with only one correct answer. Include explanations for why the correct answer is right.

Content: ${fileText}

Format each question as:
Question: [question text]
A) [option A]
B) [option B]
C) [option C]
D) [option D]
Correct Answer: [letter]
Explanation: [explanation]`;

        const questionsResult = await model.generateContent(questionsPrompt);
        const questionsText = questionsResult.response.text();

        // Parse questions (simplified parsing - in production you'd want more robust parsing)
        const questions = parseQuestions(questionsText);

        // Update upload record
        upload.notes = notes;
        upload.questions = questions;
        upload.status = 'completed';
        await upload.save();

        // Log successful processing
        await Log.create({
            teacher: session.user.id,
            classroomId,
            action: 'ai_processing',
            status: 'success',
            metadata: { 
                uploadId: upload._id,
                questionCount: questions.length 
            }
        });

        return NextResponse.json({
            success: true,
            uploadId: upload._id,
            notes,
            questions
        });

    } catch (error) {
        console.error('Error processing upload:', error);
        
        // Log the error
        try {
            const session = await auth();
            if (session?.user?.id) {
                await Log.create({
                    teacher: session.user.id,
                    action: 'ai_processing',
                    status: 'failure',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        } catch (logError) {
            console.error('Error logging failure:', logError);
        }

        return NextResponse.json(
            { error: 'Failed to process upload' },
            { status: 500 }
        );
    }
}

function parseQuestions(questionsText: string) {
    // Simplified parsing - in production you'd want more robust parsing
    const questions = [];
    const questionBlocks = questionsText.split(/(?=Question:)/);
    
    for (const block of questionBlocks) {
        if (!block.trim()) continue;
        
        const lines = block.split('\n').map(line => line.trim()).filter(line => line);
        if (lines.length < 6) continue;
        
        const question = lines[0].replace('Question:', '').trim();
        const options = [];
        let correctAnswer = '';
        let explanation = '';
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.match(/^[A-D]\)/)) {
                options.push(line.replace(/^[A-D]\)\s*/, ''));
            } else if (line.startsWith('Correct Answer:')) {
                correctAnswer = line.replace('Correct Answer:', '').trim();
            } else if (line.startsWith('Explanation:')) {
                explanation = line.replace('Explanation:', '').trim();
            }
        }
        
        if (question && options.length === 4 && correctAnswer && explanation) {
            questions.push({
                question,
                options,
                correctAnswer,
                explanation
            });
        }
    }
    
    return questions;
}
