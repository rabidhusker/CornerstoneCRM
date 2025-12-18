import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layouts/sidebar";
import { Header } from "@/components/layouts/header";
import { CommandMenu } from "@/components/layouts/command-menu";
import { QueryProvider } from "@/components/providers/query-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user metadata
  const userMetadata = user.user_metadata || {};
  const userData = {
    id: user.id,
    email: user.email || "",
    firstName: userMetadata.first_name as string | undefined,
    lastName: userMetadata.last_name as string | undefined,
    avatarUrl: userMetadata.avatar_url as string | undefined,
  };

  // Get user's workspace(s)
  // For now, we'll use a placeholder - this will be populated after workspace setup
  let workspace: { id: string; name: string } | undefined;

  try {
    const { data: workspaceMember } = await supabase
      .from("workspace_members")
      .select("workspace:workspaces(id, name)")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (workspaceMember) {
      // Type assertion for the joined workspace data
      const memberData = workspaceMember as unknown as {
        workspace: { id: string; name: string } | null;
      };
      if (memberData.workspace) {
        workspace = {
          id: memberData.workspace.id,
          name: memberData.workspace.name,
        };
      }
    }
  } catch {
    // No workspace found - user may need to create one
    // This is expected for new users
  }

  // If no workspace exists, check user metadata for workspace name from registration
  if (!workspace && userMetadata.workspace_name) {
    workspace = {
      id: "pending",
      name: userMetadata.workspace_name as string,
    };
  }

  return (
    <QueryProvider>
      <div className="min-h-screen bg-background">
        <Sidebar user={userData} workspace={workspace} />
        <Header workspace={workspace} />
        <CommandMenu />
        {children}
      </div>
    </QueryProvider>
  );
}
