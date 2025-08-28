"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import Link from "next/link";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";

export default function SignupPage() {
    const router = useRouter();
    const { status } = useSession();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (status === "authenticated") {
            router.replace("/dashboard");
        }
    }, [status, router]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(""); // Clear error when user types
        setFieldErrors(prev => ({ ...prev, [field]: "" })); // Clear field-specific error
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clear previous errors
        setError("");
        setFieldErrors({});

        // Prepare data for validation
        const dataToValidate: SignupInput = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
        };

        // Validate with Zod
        try {
        signupSchema.parse(dataToValidate);
        } catch (error) {
        if (error instanceof z.ZodError) {
            const errors: Record<string, string> = {};
            error!.issues.forEach((err) => {
            const field = err.path.join('.');
            errors[field] = err.message;
            });
            setFieldErrors(errors);
            setError("Please fix the errors below");
            return;
        }
        }

        setIsLoading(true);

        try {
        const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify(dataToValidate),
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.details && Array.isArray(data.details)) {
            const errors: Record<string, string> = {};
            data.details.forEach((detail: any) => {
                errors[detail.field] = detail.message;
            });
            setFieldErrors(errors);
            }
            throw new Error(data.error || "Signup failed");
        }

        setSuccess("Account created successfully! Redirecting to login...");
        setTimeout(() => {
            router.push("/login");
        }, 2000);
        } catch (error: any) {
        setError(error.message || "An error occurred during signup");
        } finally {
        setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>
                Sign up as a student or teacher to get started
            </CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Role Selection */}
                

                {/* Email Field */}
                <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`transition-all duration-200 ${fieldErrors.email ? 'border-red-500' : ''}`}
                    />
                    {fieldErrors.email && (
                    <p className="text-sm text-red-500">{fieldErrors.email}</p>
                    )}
                </div>

                {/* Name Field */}
                <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={fieldErrors.name ? 'border-red-500' : ''}
                />
                {fieldErrors.name && (
                    <p className="text-sm text-red-500">{fieldErrors.name}</p>
                )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                    <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={`pr-10 ${fieldErrors.password ? 'border-red-500' : ''}`}
                    />
                    <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    >
                    {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                    </Button>
                </div>
                {fieldErrors.password && (
                    <p className="text-sm text-red-500">{fieldErrors.password}</p>
                )}
                <p className="text-sm text-muted-foreground">
                    Minimum 6 characters
                </p>
                </div>

                

                {/* Error Alert */}
                {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                )}

                {/* Success Alert */}
                {success && (
                <Alert className="border-green-200 bg-green-50 text-green-900">
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
                )}

                {/* Submit Button */}
                <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                >
                {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                    Sign in
                </Link>
                </p>
            </div>
            </CardContent>
        </Card>
        </div>
    );
}