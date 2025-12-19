"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  User,
  Mail,
  Phone,
  Building2,
  ExternalLink,
  Clock,
  DollarSign,
  Tag,
  Activity,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversation } from "@/lib/hooks/use-conversations";

interface ConversationSidebarProps {
  conversationId: string;
}

export function ConversationSidebar({
  conversationId,
}: ConversationSidebarProps) {
  const { data: conversation, isLoading } = useConversation(conversationId);

  if (isLoading) {
    return (
      <div className="w-72 border-l bg-muted/30 p-4">
        <div className="flex flex-col items-center mb-6">
          <Skeleton className="h-16 w-16 rounded-full mb-3" />
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  const contact = conversation.contact;

  if (!contact) {
    return (
      <div className="w-72 border-l bg-muted/30 p-4">
        <div className="text-center py-8">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Contact not found</p>
        </div>
      </div>
    );
  }

  const contactName = `${contact.first_name} ${contact.last_name}`;
  const contactInitials = `${contact.first_name[0]}${contact.last_name[0]}`.toUpperCase();

  return (
    <ScrollArea className="w-72 border-l bg-muted/30">
      <div className="p-4">
        {/* Contact Info */}
        <div className="flex flex-col items-center text-center mb-6">
          <Avatar className="h-16 w-16 mb-3">
            <AvatarImage src={contact.avatar_url || undefined} />
            <AvatarFallback className="text-lg">{contactInitials}</AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-lg">{contactName}</h3>
          {contact.company_name && (
            <p className="text-sm text-muted-foreground">{contact.company_name}</p>
          )}
          <Button variant="outline" size="sm" className="mt-3" asChild>
            <Link href={`/dashboard/contacts/${contact.id}`}>
              <ExternalLink className="h-3 w-3 mr-2" />
              View Profile
            </Link>
          </Button>
        </div>

        <Separator className="my-4" />

        {/* Contact Details */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            Contact Details
          </h4>

          {contact.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <a
                href={`mailto:${contact.email}`}
                className="text-sm text-primary hover:underline truncate"
              >
                {contact.email}
              </a>
            </div>
          )}

          {contact.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <a
                href={`tel:${contact.phone}`}
                className="text-sm text-primary hover:underline"
              >
                {contact.phone}
              </a>
            </div>
          )}

          {contact.company_name && (
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">{contact.company_name}</span>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Conversation Info */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            Conversation Info
          </h4>

          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="text-sm">
              <p className="text-muted-foreground">Started</p>
              <p>{format(new Date(conversation.created_at), "MMM d, yyyy")}</p>
            </div>
          </div>

          {conversation.assigned_user && (
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="text-sm">
                <p className="text-muted-foreground">Assigned to</p>
                <p>{conversation.assigned_user.full_name || "Unassigned"}</p>
              </div>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Quick Actions
          </h4>

          <Button variant="outline" size="sm" className="w-full justify-start" asChild>
            <Link href={`/dashboard/contacts/${contact.id}`}>
              <User className="h-4 w-4 mr-2" />
              View Contact
            </Link>
          </Button>

          <Button variant="outline" size="sm" className="w-full justify-start" asChild>
            <Link href={`/dashboard/deals/new?contact_id=${contact.id}`}>
              <DollarSign className="h-4 w-4 mr-2" />
              Create Deal
            </Link>
          </Button>

          <Button variant="outline" size="sm" className="w-full justify-start" asChild>
            <Link href={`/dashboard/contacts/${contact.id}?tab=activities`}>
              <Activity className="h-4 w-4 mr-2" />
              View Activities
            </Link>
          </Button>
        </div>

        {/* Tags placeholder */}
        {/* This could be expanded to show and manage tags */}
        {/*
        <Separator className="my-4" />
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Tags
          </h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Lead</Badge>
            <Badge variant="secondary">Hot</Badge>
          </div>
        </div>
        */}
      </div>
    </ScrollArea>
  );
}
