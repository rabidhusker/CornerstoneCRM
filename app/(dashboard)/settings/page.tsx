"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Building2,
  Users,
  Plug,
  CreditCard,
  Key,
  ChevronRight,
  Shield,
  Bell,
  Palette,
} from "lucide-react";

interface SettingsSection {
  title: string;
  description: string;
  href: string;
  icon: typeof Settings;
  badge?: string;
  disabled?: boolean;
}

const settingsSections: SettingsSection[] = [
  {
    title: "Organization",
    description: "Manage your organization profile, branding, and preferences",
    href: "/settings/organization",
    icon: Building2,
  },
  {
    title: "Users & Teams",
    description: "Invite users, manage teams, and assign roles",
    href: "/settings/users",
    icon: Users,
  },
  {
    title: "Roles & Permissions",
    description: "Configure access levels and custom roles",
    href: "/settings/users/roles",
    icon: Shield,
  },
  {
    title: "Integrations",
    description: "Connect third-party apps and services",
    href: "/settings/integrations",
    icon: Plug,
    badge: "Coming Soon",
    disabled: true,
  },
  {
    title: "Billing & Plans",
    description: "Manage subscription, invoices, and payment methods",
    href: "/settings/billing",
    icon: CreditCard,
    badge: "Coming Soon",
    disabled: true,
  },
  {
    title: "API Keys",
    description: "Generate and manage API keys for integrations",
    href: "/settings/api",
    icon: Key,
    badge: "Coming Soon",
    disabled: true,
  },
  {
    title: "Notifications",
    description: "Configure email and in-app notification preferences",
    href: "/settings/notifications",
    icon: Bell,
    badge: "Coming Soon",
    disabled: true,
  },
  {
    title: "Appearance",
    description: "Customize the look and feel of your workspace",
    href: "/settings/appearance",
    icon: Palette,
    badge: "Coming Soon",
    disabled: true,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your organization settings and preferences
        </p>
      </div>

      {/* Settings grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          const content = (
            <Card
              className={`transition-colors ${
                section.disabled
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:border-gray-300 cursor-pointer"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {section.title}
                        {section.badge && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            {section.badge}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                  {!section.disabled && (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </Card>
          );

          if (section.disabled) {
            return <div key={section.href}>{content}</div>;
          }

          return (
            <Link key={section.href} href={section.href}>
              {content}
            </Link>
          );
        })}
      </div>

      {/* Account section */}
      <div className="pt-6 border-t">
        <h2 className="text-lg font-semibold mb-4">Your Account</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/settings/profile">
            <Card className="hover:border-gray-300 cursor-pointer transition-colors">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Profile Settings</p>
                    <p className="text-sm text-muted-foreground">
                      Update your personal information
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/settings/security">
            <Card className="hover:border-gray-300 cursor-pointer transition-colors">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Security</p>
                    <p className="text-sm text-muted-foreground">
                      Password and authentication settings
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
