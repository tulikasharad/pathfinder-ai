import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  MoreHorizontal,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  interested: { label: "Interested", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: Clock },
  preparing: { label: "Preparing Docs", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: FileText },
  started: { label: "Started", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400", icon: FileText },
  applied: { label: "Applied", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  selected: { label: "Selected", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  not_selected: { label: "Not Selected", color: "bg-red-500/10 text-red-600 dark:text-red-400", icon: XCircle },
};

const STATUS_FLOW = ["interested", "preparing", "started", "applied", "selected"];

export default function Applications() {
  const { user } = useAuth();
  const applications = useQuery(
    api.scholarships.listApplications,
    user ? { userId: user._id } : "skip"
  );
  const updateApp = useMutation(api.scholarships.updateApplication);
  const deleteApp = useMutation(api.scholarships.deleteApplication);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");

  const filtered = useMemo(() => {
    if (!applications) return [];
    let results = [...applications];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter((a) => a.name.toLowerCase().includes(q));
    }

    if (filterStatus !== "all") {
      results = results.filter((a) => a.status === filterStatus);
    }

    return results;
  }, [applications, searchQuery, filterStatus]);

  const stats = useMemo(() => {
    if (!applications) return { total: 0, byStatus: {} };
    const byStatus: Record<string, number> = {};
    for (const a of applications) {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    }
    return { total: applications.length, byStatus };
  }, [applications]);

  const handleAdvanceStatus = useCallback(
    async (app: any) => {
      const currentIdx = STATUS_FLOW.indexOf(app.status);
      if (currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1) {
        const nextStatus = STATUS_FLOW[currentIdx + 1];
        await updateApp({ id: app._id, status: nextStatus });
      }
    },
    [updateApp]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteApp({ id: id as any });
    },
    [deleteApp]
  );

  return (
    <div className="p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-6xl space-y-6"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Applications
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track all your scholarship and college applications
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-3 grid-cols-3 sm:grid-cols-6">
          {STATUS_FLOW.map((status) => {
            const config = STATUS_CONFIG[status];
            return (
              <Card
                key={status}
                className={`border-border/60 cursor-pointer transition-all hover:border-primary/30 ${
                  filterStatus === status ? "border-primary/40 ring-1 ring-primary/20" : ""
                }`}
                onClick={() =>
                  setFilterStatus(filterStatus === status ? "all" : status)
                }
              >
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-bold">{stats.byStatus[status] || 0}</p>
                  <p className="text-[10px] text-muted-foreground">{config.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search applications..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {filterStatus !== "all" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              Clear filter
              <XCircle className="ml-1.5 size-3" />
            </Button>
          )}
        </div>

        {/* Application List */}
        <div className="space-y-3">
          {filtered.map((app, idx) => {
            const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.interested;
            const Icon = config.icon;
            const daysUntil = Math.ceil(
              (new Date(app.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            const currentIdx = STATUS_FLOW.indexOf(app.status);
            const canAdvance =
              currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1;

            return (
              <motion.div
                key={app._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card className="border-border/60 transition-all hover:border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${config.color}`}>
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold">{app.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {app.type}
                            </Badge>
                            <span>Due {app.deadline}</span>
                            {daysUntil <= 7 && daysUntil > 0 && (
                              <span className="text-amber-500 font-medium">
                                {daysUntil}d left
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] ${config.color}`}>
                          {config.label}
                        </Badge>

                        {canAdvance && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleAdvanceStatus(app)}
                          >
                            Advance →
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive">
                              <Trash2 className="size-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Application?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove "{app.name}" from your tracker. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(app._id)}>
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {/* Status progress bar */}
                    <div className="mt-3 flex items-center gap-1">
                      {STATUS_FLOW.map((status, i) => (
                        <div key={status} className="flex-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              i <= currentIdx ? "bg-primary" : "bg-muted"
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <FileText className="mx-auto size-12 text-muted-foreground/30" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              No applications yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Browse scholarships and colleges to start tracking applications
            </p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.href = "/scholarships"}>
              Browse Scholarships
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
