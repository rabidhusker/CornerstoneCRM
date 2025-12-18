"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import {
  updatePasswordSchema,
  type UpdatePasswordFormData,
  getPasswordStrength,
} from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");
  const passwordStrength = getPasswordStrength(password || "");

  // Check if user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // User should have a session from the recovery link
      setIsValidSession(!!session);
    };

    checkSession();
  }, []);

  async function onSubmit(data: UpdatePasswordFormData) {
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setSuccess(true);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 3000);
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Invalid or expired session
  if (!isValidSession) {
    return (
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-semibold">
            Invalid or expired link
          </CardTitle>
          <CardDescription className="text-base">
            This password reset link is invalid or has expired
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Password reset links expire after 1 hour for security reasons.
            Please request a new password reset link.
          </p>
          <Link href="/reset-password" className="block">
            <Button className="w-full">Request new link</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (success) {
    return (
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <CheckCircle2 className="h-6 w-6 text-accent" />
          </div>
          <CardTitle className="text-2xl font-semibold">
            Password updated
          </CardTitle>
          <CardDescription className="text-base">
            Your password has been successfully updated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            You will be redirected to the dashboard in a few seconds...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold">
          Set new password
        </CardTitle>
        <CardDescription>
          Enter your new password below. Make sure it&apos;s strong and unique.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                autoComplete="new-password"
                disabled={isLoading}
                {...register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {/* Password strength indicator */}
            {password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors",
                        index <= passwordStrength.score
                          ? passwordStrength.color
                          : "bg-muted"
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Password strength: {passwordStrength.label}
                </p>
              </div>
            )}
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                autoComplete="new-password"
                disabled={isLoading}
                {...register("confirmPassword")}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Password requirements */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs font-medium mb-2">Password requirements:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li
                className={cn(
                  password && password.length >= 8 && "text-accent"
                )}
              >
                {password && password.length >= 8 ? "✓" : "○"} At least 8
                characters
              </li>
              <li
                className={cn(password && /[A-Z]/.test(password) && "text-accent")}
              >
                {password && /[A-Z]/.test(password) ? "✓" : "○"} One uppercase
                letter
              </li>
              <li
                className={cn(password && /[a-z]/.test(password) && "text-accent")}
              >
                {password && /[a-z]/.test(password) ? "✓" : "○"} One lowercase
                letter
              </li>
              <li
                className={cn(password && /\d/.test(password) && "text-accent")}
              >
                {password && /\d/.test(password) ? "✓" : "○"} One number
              </li>
            </ul>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
