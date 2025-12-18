import { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  Handshake,
  DollarSign,
  CheckSquare,
  UserPlus,
  CalendarPlus,
  FileEdit,
  Phone,
  ArrowRight,
  Clock,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Shell, ShellHeader, ShellContent } from "@/components/layouts/shell";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const firstName = user?.user_metadata?.first_name || "there";

  // Get current hour to determine greeting
  const hour = new Date().getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) {
    greeting = "Good afternoon";
  } else if (hour >= 17) {
    greeting = "Good evening";
  }

  return (
    <Shell>
      <ShellHeader>
        <PageHeader
          title={`${greeting}, ${firstName}!`}
          description="Here's what's happening with your CRM today."
        />
      </ShellHeader>

      <ShellContent>
        {/* Quick Stats */}
        <StatCardGrid columns={4}>
          <StatCard
            label="Total Contacts"
            value="1,284"
            icon={Users}
            trend={{ value: 12, label: "vs last month" }}
            variant="primary"
          />
          <StatCard
            label="Open Deals"
            value="23"
            icon={Handshake}
            trend={{ value: 8, label: "vs last month" }}
            variant="success"
          />
          <StatCard
            label="Deal Value"
            value="$284,500"
            icon={DollarSign}
            trend={{ value: -3, label: "vs last month" }}
            variant="warning"
          />
          <StatCard
            label="Tasks Due"
            value="7"
            icon={CheckSquare}
            description="Due today"
            variant="danger"
          />
        </StatCardGrid>

        {/* Main content grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/analytics">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ActivityItem
                  icon={UserPlus}
                  iconColor="text-blue-500"
                  title="New contact added"
                  description="Sarah Johnson was added to your contacts"
                  time="2 hours ago"
                />
                <ActivityItem
                  icon={Handshake}
                  iconColor="text-green-500"
                  title="Deal moved to Negotiation"
                  description="Acme Corp deal updated by you"
                  time="4 hours ago"
                />
                <ActivityItem
                  icon={Phone}
                  iconColor="text-purple-500"
                  title="Call completed"
                  description="15 min call with Mike Johnson"
                  time="Yesterday"
                />
                <ActivityItem
                  icon={FileEdit}
                  iconColor="text-orange-500"
                  title="Campaign launched"
                  description="Q4 Email Campaign is now live"
                  time="2 days ago"
                />
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upcoming</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/calendar">
                  View calendar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <AppointmentItem
                  title="Call with John Smith"
                  time="Today, 2:00 PM"
                  type="Call"
                />
                <AppointmentItem
                  title="Property showing - 123 Main St"
                  time="Today, 4:30 PM"
                  type="Meeting"
                />
                <AppointmentItem
                  title="Team sync"
                  time="Tomorrow, 10:00 AM"
                  type="Meeting"
                />
                <AppointmentItem
                  title="Follow up with Sarah"
                  time="Tomorrow, 3:00 PM"
                  type="Task"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <QuickActionButton
                icon={UserPlus}
                label="New Contact"
                href="/dashboard/contacts/new"
              />
              <QuickActionButton
                icon={Handshake}
                label="New Deal"
                href="/dashboard/pipelines/deals/new"
              />
              <QuickActionButton
                icon={CalendarPlus}
                label="Schedule Appointment"
                href="/dashboard/calendar/new"
              />
              <QuickActionButton
                icon={FileEdit}
                label="Create Campaign"
                href="/dashboard/campaigns/new"
              />
            </div>
          </CardContent>
        </Card>
      </ShellContent>
    </Shell>
  );
}

function ActivityItem({
  icon: Icon,
  iconColor,
  title,
  description,
  time,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className={`rounded-full bg-muted p-2 ${iconColor}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <p className="text-xs text-muted-foreground whitespace-nowrap">{time}</p>
    </div>
  );
}

function AppointmentItem({
  title,
  time,
  type,
}: {
  title: string;
  time: string;
  type: "Call" | "Meeting" | "Task";
}) {
  const badgeVariant =
    type === "Call" ? "default" : type === "Meeting" ? "secondary" : "outline";

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
        <Clock className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">{time}</p>
          <Badge variant={badgeVariant} className="text-xs">
            {type}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
}) {
  return (
    <Button
      variant="outline"
      className="h-auto flex-col gap-2 p-4"
      asChild
    >
      <Link href={href}>
        <Icon className="h-6 w-6" />
        <span className="text-sm">{label}</span>
      </Link>
    </Button>
  );
}
