import mongoose, { Document, Schema, } from 'mongoose';

export interface ITeacher extends Document {
  _id: string;
  name: string;
  email: string;
  googleId: string;
  accessToken: string;
  refreshToken: string;
  classrooms: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema : Schema<ITeacher> = new Schema<ITeacher>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
        },
        googleId: {
            type: String,
            required: [true, 'Google ID is required'],
            unique: true,
        },
        accessToken: {
            type: String,
            required: [true, 'Access token is required'],
        },
        refreshToken: {
            type: String,
            required: [true, 'Refresh token is required'],
        },
        classrooms: [{
            type: String,
            ref: 'Classroom'
        }],
    },
    {
        timestamps: true,
    }
);

// // Indexes
// TeacherSchema.index({ email: 1 });
// TeacherSchema.index({ googleId: 1 });

// Use a more robust model registration pattern for Next.js
let TeacherModel: mongoose.Model<ITeacher>;

try {
  // Check if the model already exists
  TeacherModel = mongoose.model<ITeacher>("Teacher");
} catch {
  // If it doesn't exist, create it
  TeacherModel = mongoose.model<ITeacher>("Teacher", TeacherSchema);
}

export default TeacherModel;