import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/user.model";
import { signupSchema } from "@/lib/validations/auth";
import { z } from "zod";
//User
type MongoDuplicateKeyError = {
    code: number;
    keyPattern?: Record<string, number>;
};

function isMongoDuplicateKeyError(error: unknown): error is MongoDuplicateKeyError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000
    );
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request body with Zod
        let validatedData;
        try {
        validatedData = signupSchema.parse(body);
        } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
            { 
                error: "Validation failed", 
                details: error!.issues.map(err => ({
                field: err.path.join('.'),
                message: err.message
                }))
            },
            { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Invalid request data" },
            { status: 400 }
        );
        }

        const { email, name, password } = validatedData;

        await dbConnect();

        // Check for existing users by email
        const existing = await UserModel.findOne({ email });
        if (existing) {
            return NextResponse.json(
            { error: "A user with this email already exists" },
            { status: 409 }
            );
        }

        // Hash password with salt rounds = 10
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user data object
        const userData = {
            email,
            name,
            password: hashedPassword,
        } as const;

        // Create new user
        const newUser = new UserModel(userData);
        await newUser.save();

        // Return success response (exclude password hash)
        const userResponse = {
            id: newUser._id,
            email: newUser.email,
            name: newUser.name,
        };

        return NextResponse.json(
        { message: "User created successfully", user: userResponse },
        { status: 201 }
        );
    } catch (error: unknown) {
        console.error("Signup error:", error);

        // Handle duplicate key errors
        if (isMongoDuplicateKeyError(error)) {
        const field = Object.keys(error.keyPattern ?? {})[0];
        return NextResponse.json(
            { error: `A user with this ${field} already exists` },
            { status: 409 }
        );
        }

        return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
        );
    }
}