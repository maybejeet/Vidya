import mongoose, { Document, Schema, } from 'mongoose';

export interface ILog extends Document {
  _id: string;
  teacher: string;
  classroomId?: string;
  action: string;
  status: 'success' | 'failure';
  error?: string;
          metadata?: Record<string, unknown>;
  createdAt: Date;
}

const LogSchema : Schema<ILog> = new Schema<ILog>(
    {
        teacher: {
            type: String,
            ref: 'Teacher',
            required: true,
        },
        classroomId: {
            type: String,
            required: false,
        },
        action: {
            type: String,
            required: true,
            enum: [
                'file_upload',
                'ai_processing',
                'post_notes_to_classroom',
                'post_questions_to_classroom',
                'classroom_link',
                'classroom_fetch',
                'auth_login',
                'auth_logout'
            ],
        },
        status: {
            type: String,
            enum: ['success', 'failure'],
            required: true,
        },
        error: String,
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
// LogSchema.index({ teacher: 1 });
// LogSchema.index({ action: 1 });
// LogSchema.index({ status: 1 });
// LogSchema.index({ createdAt: -1 });

// Use a more robust model registration pattern for Next.js
let LogModel: mongoose.Model<ILog>;

try {
  // Check if the model already exists
  LogModel = mongoose.model<ILog>("Log");
} catch {
  // If it doesn't exist, create it
  LogModel = mongoose.model<ILog>("Log", LogSchema);
}

export default LogModel;
