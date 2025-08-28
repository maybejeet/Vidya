# AI Classroom Assistant - Setup Guide

## Overview
The AI Classroom Assistant is a SaaS platform that integrates with Google Classroom to help teachers convert uploaded study materials (PDF/PPT) into AI-generated notes and questions, which are then posted back to their Google Classroom automatically.

## Prerequisites
- Node.js 18+ and npm
- MongoDB database
- Google Cloud Platform account
- Google Classroom API access

## Environment Variables
Create a `.env.local` file in the root directory with the following variables:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Google Gemini AI API
GOOGLE_GEMINI_API_KEY=your-gemini-api-key-here

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/ai-classroom-assistant
```

## Google Cloud Platform Setup

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Classroom API
   - Google Drive API
   - Google+ API

### 2. Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information
4. Add scopes:
   - `https://www.googleapis.com/auth/classroom.courses`
   - `https://www.googleapis.com/auth/classroom.coursework.me`
   - `https://www.googleapis.com/auth/classroom.courseworkmaterials`
   - `https://www.googleapis.com/auth/drive.file`

### 3. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)
5. Copy the Client ID and Client Secret to your `.env.local` file

### 4. Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your `.env.local` file

## Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up MongoDB
- Install MongoDB locally or use MongoDB Atlas
- Update the `MONGODB_URI` in your `.env.local` file

### 3. Run the Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Features

### Authentication
- Google OAuth sign-in for teachers
- Automatic account creation on first login
- Secure session management

### Google Classroom Integration
- Fetch teacher's Google Classroom courses
- Post AI-generated notes as course materials
- Post AI-generated questions as assignments

### AI Processing
- PDF and PowerPoint file parsing
- Google Gemini AI for content analysis
- Automatic note generation
- Quiz question creation with explanations

### Dashboard
- File upload interface
- Processing status tracking
- Google Classroom posting controls
- Activity logging and monitoring

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Google OAuth sign-in
- `POST /api/auth/signout` - Sign out

### Classroom Management
- `GET /api/classroom/list` - List teacher's Google Classrooms
- `POST /api/classroom/post` - Post content to Google Classroom

### File Processing
- `POST /api/upload/process` - Upload and process files with AI

### Logging
- `GET /api/logs` - Retrieve activity logs

## File Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/           # Authentication pages
│   ├── api/              # API routes
│   ├── dashboard/        # Main dashboard
│   └── page.tsx          # Landing page
├── components/            # React components
├── lib/                   # Utility functions
├── models/                # MongoDB models
└── types/                 # TypeScript type definitions
```

## Development Notes

### Current Limitations
- File storage is currently in-memory (implement S3 or Google Drive for production)
- PDF/PPT parsing is simplified (implement proper parsers for production)
- Error handling could be more robust

### Production Considerations
- Implement proper file storage (AWS S3, Google Drive)
- Add rate limiting and API quotas
- Implement proper PDF/PPT parsing libraries
- Add comprehensive error handling and monitoring
- Set up CI/CD pipeline
- Configure production MongoDB with proper indexes

## Troubleshooting

### Common Issues

1. **Google OAuth Error**: Ensure redirect URIs are correctly configured
2. **MongoDB Connection**: Check connection string and network access
3. **Gemini API Error**: Verify API key and quota limits
4. **Classroom API Error**: Check OAuth scopes and API enablement

### Debug Mode
Set `NODE_ENV=development` to see detailed error messages and logs.

## Support
For issues and questions, please check the logs in the dashboard or review the console output during development.
