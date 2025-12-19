"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { IntegrationCard } from "@/components/features/settings/integration-card";
import {
  Search,
  ArrowLeft,
  Mail,
  Calendar,
  MessageSquare,
  Zap,
  CreditCard,
  Users,
  Megaphone,
  Grid,
} from "lucide-react";
import {
  availableIntegrations,
  categoryLabels,
  type IntegrationCategory,
  type ConnectedIntegration,
  type IntegrationProvider,
} from "@/types/integration";
import Link from "next/link";

const categoryIcons: Record<IntegrationCategory | "all", React.ReactNode> = {
  all: <Grid className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
  communication: <MessageSquare className="h-4 w-4" />,
  productivity: <Zap className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  crm: <Users className="h-4 w-4" />,
  marketing: <Megaphone className="h-4 w-4" />,
};

async function fetchConnections(): Promise<ConnectedIntegration[]> {
  const res = await fetch("/api/v1/settings/integrations");
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error("Failed to fetch connections");
  }
  const data = await res.json();
  return data.integrations || [];
}

async function connectIntegration(
  provider: IntegrationProvider,
  config?: Record<string, any>
): Promise<ConnectedIntegration> {
  const res = await fetch("/api/v1/settings/integrations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, config }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to connect");
  }
  return res.json();
}

async function disconnectIntegration(provider: IntegrationProvider): Promise<void> {
  const res = await fetch(`/api/v1/settings/integrations/${provider}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to disconnect");
  }
}

export default function IntegrationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    IntegrationCategory | "all"
  >("all");
  const [connectingProvider, setConnectingProvider] = useState<string | null>(
    null
  );
  const [disconnectingProvider, setDisconnectingProvider] = useState<
    string | null
  >(null);

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: fetchConnections,
  });

  const connectMutation = useMutation({
    mutationFn: ({ provider }: { provider: IntegrationProvider }) =>
      connectIntegration(provider),
    onMutate: ({ provider }) => {
      setConnectingProvider(provider);
    },
    onSuccess: (_, { provider }) => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      const integration = availableIntegrations.find((i) => i.id === provider);

      // For OAuth integrations, redirect to the OAuth flow
      if (integration?.requiresOAuth) {
        router.push(`/api/auth/${provider}`);
      } else if (integration?.configFields) {
        // For config-based integrations, redirect to settings page
        router.push(`/settings/integrations/${provider}`);
      } else {
        toast({ title: `${integration?.name} connected successfully` });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setConnectingProvider(null);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectIntegration,
    onMutate: (provider) => {
      setDisconnectingProvider(provider);
    },
    onSuccess: (_, provider) => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      const integration = availableIntegrations.find((i) => i.id === provider);
      toast({ title: `${integration?.name} disconnected` });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to disconnect",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setDisconnectingProvider(null);
    },
  });

  const getConnectionForProvider = (provider: IntegrationProvider) => {
    return connections.find((c) => c.provider === provider);
  };

  const filteredIntegrations = availableIntegrations.filter((integration) => {
    const matchesSearch =
      searchQuery === "" ||
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || integration.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const connectedCount = connections.filter(
    (c) => c.status === "connected"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Connect your favorite tools and services
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Connected</CardDescription>
            <CardTitle className="text-3xl">{connectedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available</CardDescription>
            <CardTitle className="text-3xl">
              {availableIntegrations.filter((i) => !i.comingSoon).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Coming Soon</CardDescription>
            <CardTitle className="text-3xl">
              {availableIntegrations.filter((i) => i.comingSoon).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs
        value={selectedCategory}
        onValueChange={(value) =>
          setSelectedCategory(value as IntegrationCategory | "all")
        }
      >
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="gap-2">
            {categoryIcons.all}
            All
          </TabsTrigger>
          {(Object.keys(categoryLabels) as IntegrationCategory[]).map(
            (category) => (
              <TabsTrigger key={category} value={category} className="gap-2">
                {categoryIcons[category]}
                {categoryLabels[category]}
              </TabsTrigger>
            )
          )}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredIntegrations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">
                  No integrations found
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                >
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredIntegrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  connection={getConnectionForProvider(integration.id)}
                  onConnect={async (provider) => {
                    connectMutation.mutate({
                      provider: provider as IntegrationProvider,
                    });
                  }}
                  onDisconnect={async (provider) => {
                    disconnectMutation.mutate(provider as IntegrationProvider);
                  }}
                  isConnecting={connectingProvider === integration.id}
                  isDisconnecting={disconnectingProvider === integration.id}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Connected Integrations Summary */}
      {connectedCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Integrations</CardTitle>
            <CardDescription>
              Manage your active integration connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connections
                .filter((c) => c.status === "connected")
                .map((connection) => {
                  const integration = availableIntegrations.find(
                    (i) => i.id === connection.provider
                  );
                  if (!integration) return null;

                  return (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-sm font-semibold">
                          {integration.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">
                            {integration.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Connected{" "}
                            {new Date(
                              connection.connected_at
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/settings/integrations/${connection.provider}`}
                        >
                          Manage
                        </Link>
                      </Button>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
