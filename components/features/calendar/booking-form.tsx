"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface BookingFormProps {
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    notes?: string;
  }) => Promise<void>;
  isLoading: boolean;
  requirePhone?: boolean;
  collectNotes?: boolean;
  primaryColor?: string;
}

// Create schema based on requirements
const createSchema = (requirePhone: boolean, collectNotes: boolean) =>
  z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email"),
    phone: requirePhone
      ? z.string().min(1, "Phone number is required")
      : z.string().optional(),
    notes: collectNotes ? z.string().optional() : z.string().optional(),
  });

type FormData = z.infer<ReturnType<typeof createSchema>>;

export function BookingForm({
  onSubmit,
  isLoading,
  requirePhone = false,
  collectNotes = true,
  primaryColor = "#3b82f6",
}: BookingFormProps) {
  const schema = createSchema(requirePhone, collectNotes);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      notes: "",
    },
  });

  const onFormSubmit = async (data: FormData) => {
    await onSubmit({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || undefined,
      notes: data.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Your Information</h3>

        {/* Name fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              placeholder="John"
              {...register("firstName")}
              className={errors.firstName ? "border-red-500" : ""}
            />
            {errors.firstName && (
              <p className="text-sm text-red-500">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              placeholder="Doe"
              {...register("lastName")}
              className={errors.lastName ? "border-red-500" : ""}
            />
            {errors.lastName && (
              <p className="text-sm text-red-500">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            {...register("email")}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">
            Phone Number {requirePhone && "*"}
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            {...register("phone")}
            className={errors.phone ? "border-red-500" : ""}
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        {/* Notes */}
        {collectNotes && (
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes / Reason for Meeting
            </Label>
            <Textarea
              id="notes"
              placeholder="Please share anything that will help prepare for our meeting..."
              rows={3}
              {...register("notes")}
            />
          </div>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
        style={{ backgroundColor: primaryColor }}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Booking...
          </>
        ) : (
          "Confirm Booking"
        )}
      </Button>

      <p className="text-xs text-center text-gray-500">
        By booking, you agree to our terms and conditions
      </p>
    </form>
  );
}
