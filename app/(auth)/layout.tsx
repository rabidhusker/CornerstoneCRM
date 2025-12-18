import { Building2 } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Background pattern */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background to-muted/20" />

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        {/* Logo and branding */}
        <Link
          href="/"
          className="flex items-center gap-2 mb-8 text-foreground hover:opacity-80 transition-opacity"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight">CSTG CRM</span>
            <span className="text-xs text-muted-foreground">Cornerstone Group</span>
          </div>
        </Link>

        {/* Auth form container */}
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Cornerstone Group. All rights reserved.</p>
      </footer>
    </div>
  );
}
