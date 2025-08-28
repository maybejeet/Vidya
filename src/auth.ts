import NextAuth, { type DefaultSession } from "next-auth"
import Google from "next-auth/providers/google"
import dbConnect, { isDbConnected } from "./lib/dbConnect"
import Teacher from "./models/user.model"
import Log from "./models/log.model"

declare module "next-auth" {
    interface Session {
        user: {
            id: string,
            email: string,
            name: string,
            googleId: string,
            accessToken: string,
        } & DefaultSession["user"]
    }
    interface JWT {
        accessToken?: string
        refreshToken?: string
        googleId?: string
        userId?: string
    }
}





export const { handlers, signIn, signOut, auth } = NextAuth({
    trustHost: true,
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: 'openid email profile https://www.googleapis.com/auth/classroom.courses https://www.googleapis.com/auth/classroom.coursework.me https://www.googleapis.com/auth/classroom.courseworkmaterials'
                }
            }
        })
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            console.log('SignIn callback triggered:', { 
                provider: account?.provider, 
                hasProfile: !!profile?.sub,
                userEmail: user?.email 
            });

            if (account?.provider === "google" && profile?.sub && user.email) {
                try {
                    // Ensure database connection
                    if (!(await isDbConnected())) {
                        await dbConnect();
                    }

                    // Check if teacher exists
                    let teacher = await Teacher.findOne({ googleId: profile.sub });
                    
                    if (!teacher) {
                        // Create new teacher
                        teacher = await Teacher.create({
                            name: user.name || '',
                            email: user.email,
                            googleId: profile.sub,
                            accessToken: account.access_token || '',
                            refreshToken: account.refresh_token || '',
                            classrooms: [],
                        });
                        console.log('New teacher created:', teacher.email);

                        // Log successful signup
                        await Log.create({
                            teacher: teacher._id,
                            action: 'auth_signup',
                            status: 'success',
                            metadata: { isNewUser: true, provider: 'google' }
                        });
                    } else {
                        // Update existing teacher's tokens
                        await Teacher.findByIdAndUpdate(teacher._id, {
                            accessToken: account.access_token || '',
                            refreshToken: account.refresh_token || '',
                            name: user.name || teacher.name, // Update name if changed
                        });
                        console.log('Existing teacher updated:', teacher.email);

                        // Log successful login
                        await Log.create({
                            teacher: teacher._id,
                            action: 'auth_login',
                            status: 'success',
                            metadata: { isNewUser: false, provider: 'google' }
                        });
                    }

                    return true;
                } catch (error) {
                    console.error("Sign in error:", error);
                    
                    // Log failed authentication attempt
                    try {
                        await Log.create({
                            teacher: null,
                            action: 'auth_failed',
                            status: 'error',
                            metadata: { 
                                error: error instanceof Error ? error.message : 'Unknown error',
                                email: user.email,
                                provider: 'google'
                            }
                        });
                    } catch (logError) {
                        console.error("Failed to log authentication error:", logError);
                    }
                    
                    return false;
                }
            }
            
            console.log('SignIn failed - invalid provider or missing data');
            return false;
        },

        async jwt({ token, account, profile }) {
            console.log('JWT callback triggered');

            // On first sign in (when account exists)
            if (account?.provider === "google" && profile?.sub) {
                try {
                    // Ensure database connection
                    if (!(await isDbConnected())) {
                        await dbConnect();
                    }

                    // Get the teacher from database to get the MongoDB _id
                    const teacher = await Teacher.findOne({ googleId: profile.sub });
                    
                    if (teacher) {
                        token.accessToken = account.access_token;
                        token.refreshToken = account.refresh_token;
                        token.googleId = profile.sub;
                        token.userId = teacher._id.toString();
                        console.log('JWT token updated with user data');
                    }
                } catch (error) {
                    console.error("JWT callback error:", error);
                }
            }

            return token;
        },

        async session({ token, session }) {
            console.log('Session callback triggered');
            console.log('Token data:', { 
                hasGoogleId: !!token.googleId, 
                hasUserId: !!token.userId,
                hasAccessToken: !!token.accessToken 
            });

            // Only create session if we have valid token data
            if (token.googleId && token.userId && token.accessToken) {
                try {
                    // Ensure database connection
                    if (!(await isDbConnected())) {
                        await dbConnect();
                    }

                    const teacher = await Teacher.findById(token.userId);
                    
                    if (teacher && teacher.accessToken) {
                        session.user.id = teacher._id.toString();
                        session.user.email = teacher.email;
                        session.user.name = teacher.name;
                        session.user.googleId = teacher.googleId;
                        session.user.accessToken = teacher.accessToken;
                        
                        console.log(`Valid session created for: ${teacher.email}`);
                        return session;
                    } else {
                        console.log('Teacher not found or no access token');
                    }
                } catch (error) {
                    console.error("Session callback error:", error);
                }
            } else {
                console.log('Missing token data:', {
                    googleId: !!token.googleId,
                    userId: !!token.userId,
                    accessToken: !!token.accessToken
                });
            }

            // For invalid sessions, return null to indicate no session
            console.log('Invalid session - returning null');
            return null as any;
        }
    },
    pages: {
        signIn: "/login",
        error: "/auth/error"
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60 // 30 days
    },
    debug: process.env.NODE_ENV === 'development',
    secret: process.env.NEXTAUTH_SECRET
})