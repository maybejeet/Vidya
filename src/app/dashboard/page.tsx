'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Classroom {
  id: string;
  name: string;
  section: string;
}

interface Upload {
  _id: string;
  fileName: string;
  fileType: string;
  classroomId: string;
  status: 'processing' | 'completed' | 'failed';
  notes: string;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;
  postedToClassroom: {
    notes: boolean;
    questions: boolean;
  };
  createdAt: string;
}

interface Log {
  _id: string;
  action: string;
  status: 'success' | 'failure';
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedClassroom, setSelectedClassroom] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchClassrooms();
      fetchUploads();
      fetchLogs();
    }
  }, [session]);

  const fetchClassrooms = async () => {
    try {
      const response = await fetch('/api/classroom/list');
      if (response.ok) {
        const responseData = await response.json();
        setClassrooms(responseData.courses || []);
      }
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    }
  };

  const fetchUploads = async () => {
    // In a real app, you'd have an API endpoint for this
    // For now, we'll use mock data
    setUploads([
      {
        _id: '1',
        fileName: 'sample.pdf',
        fileType: 'pdf',
        classroomId: 'class1',
        status: 'completed',
        notes: 'Sample notes content...',
        questions: [
          {
            question: 'What is the main topic?',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 'Option A',
            explanation: 'This is the correct answer because...'
          }
        ],
        postedToClassroom: {
          notes: true,
          questions: false
        },
        createdAt: new Date().toISOString()
      }
    ]);
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs');
      if (response.ok) {
        const responseData = await response.json();
        setLogs(responseData.logs || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedClassroom) {
      alert('Please select a file and classroom');
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('classroomId', selectedClassroom);

              const response = await fetch('/api/upload/process', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          alert('File processed successfully!');
          fetchUploads(); // Refresh uploads
          setSelectedFile(null);
          setSelectedClassroom('');
        } else {
          const error = await response.json();
          alert(`Error: ${error.error}`);
        }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePostToClassroom = async (uploadId: string) => {
    setIsPosting(true);
    try {
              const response = await fetch('/api/classroom/post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uploadId,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          }),
        });

        if (response.ok) {
          alert('Content posted to Google Classroom successfully!');
          fetchUploads(); // Refresh uploads
        } else {
          const error = await response.json();
          alert(`Error: ${error.error}`);
        }
    } catch (error) {
      console.error('Error posting to classroom:', error);
      alert('Error posting to classroom');
    } finally {
      setIsPosting(false);
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Please sign in to access the dashboard</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AI Classroom Assistant Dashboard</h1>
      <p className="text-gray-600 mb-8">Welcome back, {session.user.name}!</p>

      {/* File Upload Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upload Study Material</CardTitle>
          <CardDescription>
            Upload a PDF or PPT file to generate AI-powered notes and quiz questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.ppt,.pptx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <Label htmlFor="classroom">Select Classroom</Label>
              <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a classroom" />
                </SelectTrigger>
                <SelectContent>
                  {classrooms.map((classroom) => (
                    <SelectItem key={classroom.id} value={classroom.id}>
                      {classroom.name} {classroom.section && `(${classroom.section})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleFileUpload} 
                disabled={!selectedFile || !selectedClassroom || isProcessing}
                className="w-full"
              >
                {isProcessing ? 'Processing...' : 'Upload & Process'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploads Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Uploads</CardTitle>
          <CardDescription>
            Track the status of your uploaded materials and AI processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploads.length === 0 ? (
            <p className="text-gray-500">No uploads yet. Upload a file to get started!</p>
          ) : (
            <div className="space-y-4">
              {uploads.map((upload) => (
                <div key={upload._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{upload.fileName}</h3>
                      <p className="text-sm text-gray-600">
                        Status: <span className={`font-medium ${
                          upload.status === 'completed' ? 'text-green-600' : 
                          upload.status === 'processing' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {upload.status}
                        </span>
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(upload.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {upload.status === 'completed' && (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm">Notes:</h4>
                        <p className="text-sm text-gray-700 line-clamp-2">{upload.notes}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Posted to Classroom: {upload.postedToClassroom.notes ? '✅' : '❌'}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm">Quiz Questions: {upload.questions.length}</h4>
                        <p className="text-xs text-gray-500">
                          Posted to Classroom: {upload.postedToClassroom.questions ? '✅' : '❌'}
                        </p>
                      </div>
                      
                      {(!upload.postedToClassroom.notes || !upload.postedToClassroom.questions) && (
                        <Button
                          onClick={() => handlePostToClassroom(upload._id)}
                          disabled={isPosting}
                          size="sm"
                        >
                          {isPosting ? 'Posting...' : 'Post to Google Classroom'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs Section */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>
            Track all your actions and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-gray-500">No activity logs yet.</p>
          ) : (
            <div className="space-y-2">
              {logs.slice(0, 10).map((log) => (
                <div key={log._id} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <span className="text-gray-500">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
