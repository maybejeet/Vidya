import mongoose, { Document, Schema, } from 'mongoose';

export interface IUpload extends Document {
  _id: string;
  teacher: string;
  classroomId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
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
    notesPostId?: string;
    questionsPostId?: string;
  };
  status: 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema({
  question: {
    type: String,
    required: true,
  },
  options: [{
    type: String,
    required: true,
  }],
  correctAnswer: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
    required: true,
  },
});

const UploadSchema : Schema<IUpload> = new Schema<IUpload>(
    {
        teacher: {
            type: String,
            ref: 'Teacher',
            required: true,
        },
        classroomId: {
            type: String,
            required: true,
        },
        fileUrl: {
            type: String,
            required: true,
        },
        fileName: {
            type: String,
            required: true,
        },
        fileType: {
            type: String,
            required: true,
            enum: ['pdf', 'ppt', 'pptx'],
        },
        notes: {
            type: String,
            default: '',
        },
        questions: [QuestionSchema],
        postedToClassroom: {
            notes: {
                type: Boolean,
                default: false,
            },
            questions: {
                type: Boolean,
                default: false,
            },
            notesPostId: String,
            questionsPostId: String,
        },
        status: {
            type: String,
            enum: ['processing', 'completed', 'failed'],
            default: 'processing',
        },
        error: String,
    },
    {
        timestamps: true,
    }
);

// Indexes
// UploadSchema.index({ teacher: 1 });
// UploadSchema.index({ classroomId: 1 });
// UploadSchema.index({ status: 1 });
// UploadSchema.index({ createdAt: -1 });

// Use a more robust model registration pattern for Next.js
let UploadModel: mongoose.Model<IUpload>;

try {
  // Check if the model already exists
  UploadModel = mongoose.model<IUpload>("Upload");
} catch {
  // If it doesn't exist, create it
  UploadModel = mongoose.model<IUpload>("Upload", UploadSchema);
}

export default UploadModel;
