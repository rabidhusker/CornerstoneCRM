"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Check,
  ExternalLink,
  Settings,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import type {
  IntegrationDefinition,
  ConnectedIntegration,
  IntegrationStatus,
} from "@/types/integration";

interface IntegrationCardProps {
  integration: IntegrationDefinition;
  connection?: ConnectedIntegration;
  onConnect?: (provider: string) => Promise<void>;
  onDisconnect?: (provider: string) => Promise<void>;
  isConnecting?: boolean;
  isDisconnecting?: boolean;
}

export function IntegrationCard({
  integration,
  connection,
  onConnect,
  onDisconnect,
  isConnecting = false,
  isDisconnecting = false,
}: IntegrationCardProps) {
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const isConnected = connection?.status === "connected";
  const hasError = connection?.status === "error";
  const isPending = connection?.status === "pending";
  const isComingSoon = integration.comingSoon;

  const getStatusBadge = () => {
    if (isComingSoon) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Coming Soon
        </Badge>
      );
    }
    if (hasError) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Error
        </Badge>
      );
    }
    if (isPending) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Pending
        </Badge>
      );
    }
    if (isConnected) {
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <Check className="h-3 w-3" />
          Connected
        </Badge>
      );
    }
    return null;
  };

  const handleConnect = async () => {
    if (onConnect && !isComingSoon) {
      await onConnect(integration.id);
    }
  };

  const handleDisconnect = async () => {
    if (onDisconnect) {
      await onDisconnect(integration.id);
      setShowDisconnectDialog(false);
    }
  };

  const getSettingsLink = () => {
    switch (integration.id) {
      case "google":
        return "/settings/integrations/google";
      case "twilio":
        return "/settings/integrations/twilio";
      case "resend":
      case "sendgrid":
        return "/settings/integrations/email";
      default:
        return `/settings/integrations/${integration.id}`;
    }
  };

  return (
    <>
      <Card className={isComingSoon ? "opacity-60" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-lg border bg-muted">
                <Image
                  src={integration.logo}
                  alt={integration.name}
                  fill
                  className="object-contain p-1"
                  onError={(e) => {
                    // Fallback if logo doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
                {/* Fallback icon */}
                <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-muted-foreground">
                  {integration.name.charAt(0)}
                </div>
              </div>
              <div>
                <CardTitle className="text-base">{integration.name}</CardTitle>
                <CardDescription className="text-xs">
                  {integration.category.charAt(0).toUpperCase() +
                    integration.category.slice(1)}
                </CardDescription>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground mb-3">
            {integration.description}
          </p>
          <div className="space-y-1">
            {integration.features.slice(0, 3).map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <Check className="h-3 w-3 text-green-500" />
                {feature}
              </div>
            ))}
            {integration.features.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{integration.features.length - 3} more features
              </p>
            )}
          </div>
          {hasError && connection?.error_message && (
            <div className="mt-3 rounded-md bg-destructive/10 p-2">
              <p className="text-xs text-destructive">
                {connection.error_message}
              </p>
            </div>
          )}
          {isConnected && connection?.last_sync_at && (
            <p className="mt-3 text-xs text-muted-foreground">
              Last synced:{" "}
              {new Date(connection.last_sync_at).toLocaleDateString()}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex gap-2 pt-0">
          {isComingSoon ? (
            <Button variant="secondary" disabled className="flex-1">
              Coming Soon
            </Button>
          ) : isConnected ? (
            <>
              <Button variant="outline" size="sm" asChild className="flex-1">
                <Link href={getSettingsLink()}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDisconnectDialog(true)}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Disconnect"
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex-1"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect"
                )}
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a
                  href={integration.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

      <AlertDialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {integration.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the connection to {integration.name}. Any synced
              data will remain, but automatic syncing will stop. You can
              reconnect at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDisconnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Compact version for lists
export function IntegrationCardCompact({
  integration,
  connection,
  onConnect,
  isConnecting,
}: IntegrationCardProps) {
  const isConnected = connection?.status === "connected";
  const isComingSoon = integration.comingSoon;

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className="relative h-8 w-8 overflow-hidden rounded border bg-muted">
          <Image
            src={integration.logo}
            alt={integration.name}
            fill
            className="object-contain p-1"
          />
        </div>
        <div>
          <h4 className="text-sm font-medium">{integration.name}</h4>
          <p className="text-xs text-muted-foreground">
            {integration.description.substring(0, 50)}...
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isConnected && (
          <Badge variant="default" className="bg-green-600 text-xs">
            Connected
          </Badge>
        )}
        {isComingSoon ? (
          <Badge variant="secondary" className="text-xs">
            Coming Soon
          </Badge>
        ) : !isConnected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onConnect?.(integration.id)}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Connect"
            )}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/settings/integrations/${integration.id}`}>
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
