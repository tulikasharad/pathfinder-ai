import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@/hooks/use-supabase-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const APP_STEPS = ["Eligibility", "Application", "Payment", "Exam", "Result", "Counselling", "Admission"];

const STATUS_OPTIONS = [
  { value: "interested", label: "Interested" },
  { value: "preparing", label: "Preparing Documents" },
  { value: "started", label: "Application Started" },
  { value: "applied", label: "Applied" },
  { value: "selected", label: "Selected" },
  { value: "not_selected", label: "Not Selected" },
];

const STATUS_COLORS: Record<string, string> = {
  interested: "bg-blue-500/15 text-blue-500",
  preparing: "bg-amber-500/15 text-amber-500",
  started: "bg-primary/15 text-primary",
  applied: "bg-emerald-500/15 text-emerald-500",
  selected: "bg-emerald-500/15 text-emerald-500",
  not_selected: "bg-red-500/15 text-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  interested: "Interested",
  preparing: "Preparing",
  started: "In Progress",
  applied: "Applied",
  selected: "Selected",
  not_selected: "Rejected",
};

function getCompletedSteps(status: string) {
  switch (status) {
    case "applied": return 5;
    case "started": return 3;
    case "preparing": return 2;
    case "interested": return 1;
    default: return 0;
  }
}

async function fetchApps(args: { userId?: string }) {
  if (!args.userId) return [];
  const { data } = await supabase.from("applications").select("*").eq("student_id", args.userId);
  return (data ?? []).map((r) => ({
    _id: r.id,
    name: r.name,
    status: r.status,
    deadline: r.deadline,
    course: r.course_id || "—",
    phase: r.phase || "Phase 1",
    applicationId: r.application_id || "—",
  }));
}

async function updateAppStatus(args: { appId: string; status: string }) {
  const { error } = await supabase
    .from("applications")
    .update({ status: args.status })
    .eq("id", args.appId);
  if (error) {
    console.error("[updateAppStatus] Error:", error.message, error.details);
    throw new Error(`Failed to update status: ${error.message}`);
  }
  return { updated: true };
}

export default function Applications() {
  const { user } = useAuth();
  const applications = useQuery(fetchApps, { userId: user?._id });
  const updateStatus = useMutation(updateAppStatus);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const displayApps = useMemo(() => {
    if (applications && applications.length > 0) return applications;
    return [];
  }, [applications]);

  const filtered = useMemo(() => {
    if (!searchQuery) return displayApps;
    const q = searchQuery.toLowerCase();
    return displayApps.filter(
      (a) => a.name.toLowerCase().includes(q) || a.course.toLowerCase().includes(q)
    );
  }, [displayApps, searchQuery]);

  const handleStatusChange = useCallback(
    async (appId: string, newStatus: string) => {
      setUpdatingId(appId);
      try {
        await updateStatus({ appId, status: newStatus });
        toast.success("Application status updated.");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update.";
        toast.error(message);
      } finally {
        setUpdatingId(null);
      }
    },
    [updateStatus]
  );

  return (
    <div className="p-6 md:p-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="mt-1 text-muted-foreground">Track and manage your college applications.</p>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="space-y-4">
          {filtered.map((app, idx) => {
            const completedSteps = getCompletedSteps(app.status);
            const isUpdating = updatingId === app._id;
            return (
              <motion.div key={app._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                <Card className="border-border/60">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${STATUS_COLORS[app.status] || STATUS_COLORS.started} border-0 text-[10px]`}>
                            {STATUS_LABELS[app.status] || "In Progress"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{app.phase}</span>
                        </div>
                        <h3 className="mt-2 text-lg font-bold">{app.name}</h3>
                        <p className="text-sm text-muted-foreground">{app.course}</p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{app.applicationId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">{completedSteps}<span className="text-lg text-muted-foreground">/7</span></p>
                        <p className="text-xs text-muted-foreground">steps done</p>
                        <p className="mt-1 text-sm font-medium text-amber-500">Due: {app.deadline}</p>
                      </div>
                    </div>

                    {/* Status update buttons */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {STATUS_OPTIONS.map((opt) => (
                        <Button
                          key={opt.value}
                          variant={app.status === opt.value ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-[10px]"
                          disabled={isUpdating || app.status === opt.value}
                          onClick={() => handleStatusChange(app._id, opt.value)}
                        >
                          {isUpdating && app.status !== opt.value ? "..." : opt.label}
                        </Button>
                      ))}
                    </div>

                    {/* Step progress */}
                    <div className="mt-5">
                      <div className="flex items-center justify-between">
                        {APP_STEPS.map((step, i) => {
                          const isCompleted = i < completedSteps;
                          const isCurrent = i === completedSteps;
                          return (
                            <div key={step} className="flex flex-1 items-center">
                              <div className="flex flex-col items-center">
                                <div className={`flex size-8 items-center justify-center rounded-full border-2 transition-all ${isCompleted ? "border-primary bg-primary text-primary-foreground" : isCurrent ? "border-primary/50 bg-primary/10 text-primary" : "border-muted-foreground/20 bg-transparent text-muted-foreground/40"}`}>
                                  {isCompleted ? <CheckCircle2 className="size-4" /> : <span className="text-[10px] font-medium">{i + 1}</span>}
                                </div>
                                <p className={`mt-1.5 text-[10px] font-medium ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>{step}</p>
                              </div>
                              {i < APP_STEPS.length - 1 && (
                                <div className="mx-1 mt-[-20px] h-[2px] flex-1">
                                  <div className={`h-full rounded-full ${i < completedSteps ? "bg-primary" : "bg-muted-foreground/20"}`} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">No applications found</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Add colleges from the Discover page to start tracking</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
