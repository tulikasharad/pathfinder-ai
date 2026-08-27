import { useState, useMemo, useCallback, useRef } from "react";
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

const APP_STEPS = [
  "Not Started",
  "Application Open",
  "Documents Pending",
  "Submitted",
  "Under Review",
  "Interview",
  "Accepted",
];

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "application_open", label: "Application Open" },
  { value: "documents_pending", label: "Documents Pending" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "interview", label: "Interview" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "waitlisted", label: "Waitlisted" },
];

// Maps status value → step index (0-6) for the progress line
const STATUS_TO_STEP: Record<string, number> = {
  not_started: 0,
  interested: 0, // legacy compat
  application_open: 1,
  preparing: 2, // legacy compat
  documents_pending: 2,
  started: 3, // legacy compat
  submitted: 3,
  under_review: 4,
  applied: 4, // legacy compat
  interview: 5,
  accepted: 6,
  selected: 6, // legacy compat
};

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-muted text-muted-foreground",
  application_open: "bg-blue-500/15 text-blue-500",
  documents_pending: "bg-amber-500/15 text-amber-500",
  submitted: "bg-primary/15 text-primary",
  under_review: "bg-violet-500/15 text-violet-500",
  interview: "bg-orange-500/15 text-orange-500",
  accepted: "bg-emerald-500/15 text-emerald-500",
  rejected: "bg-red-500/15 text-red-500",
  waitlisted: "bg-yellow-500/15 text-yellow-600",
  // Legacy compat
  interested: "bg-blue-500/15 text-blue-500",
  preparing: "bg-amber-500/15 text-amber-500",
  started: "bg-primary/15 text-primary",
  applied: "bg-emerald-500/15 text-emerald-500",
  selected: "bg-emerald-500/15 text-emerald-500",
  not_selected: "bg-red-500/15 text-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  application_open: "Application Open",
  documents_pending: "Documents Pending",
  submitted: "Submitted",
  under_review: "Under Review",
  interview: "Interview",
  accepted: "Accepted",
  rejected: "Rejected",
  waitlisted: "Waitlisted",
  // Legacy compat
  interested: "Interested",
  preparing: "Preparing Documents",
  started: "Application Started",
  applied: "Applied",
  selected: "Selected",
  not_selected: "Not Selected",
};

function getCompletedSteps(status: string): number {
  const step = STATUS_TO_STEP[status];
  if (step !== undefined) return step;
  // Fallback for unknown statuses
  return 0;
}

async function fetchApps(args: { userId?: string }) {
  if (!args.userId) return [];
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("student_id", args.userId);
  if (error) {
    console.error("[fetchApps] Error:", error.message);
    return [];
  }
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
  const { data, error } = await supabase
    .from("applications")
    .update({ status: args.status })
    .eq("id", args.appId)
    .select()
    .single();
  if (error) {
    console.error("[updateAppStatus] Error:", error.message, error.details);
    throw new Error(`Failed to update status: ${error.message}`);
  }
  if (!data) {
    throw new Error("Update succeeded but no row was returned. Check RLS policies.");
  }
  return data;
}

export default function Applications() {
  const { user } = useAuth();
  const fetchVersionRef = useRef(0);
  const [fetchVersion, setFetchVersion] = useState(0);
  const applications = useQuery(fetchApps, {
    userId: user?._id,
    v: fetchVersion,
  });
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
      (a) =>
        a.name.toLowerCase().includes(q) || a.course.toLowerCase().includes(q)
    );
  }, [displayApps, searchQuery]);

  const handleStatusChange = useCallback(
    async (appId: string, newStatus: string) => {
      setUpdatingId(appId);
      try {
        await updateStatus({ appId, status: newStatus });
        // Force useQuery to re-fetch so progress line updates
        fetchVersionRef.current += 1;
        setFetchVersion(fetchVersionRef.current);
        toast.success("Application status updated.");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update.";
        toast.error(message);
      } finally {
        setUpdatingId(null);
      }
    },
    [updateStatus]
  );

  return (
    <div className="p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-6xl space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="mt-1 text-muted-foreground">
            Track and manage your college applications.
          </p>
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
            const isTerminal =
              app.status === "accepted" ||
              app.status === "rejected" ||
              app.status === "selected" ||
              app.status === "not_selected";
            const progressPercent =
              (completedSteps / (APP_STEPS.length - 1)) * 100;

            return (
              <motion.div
                key={app._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card className="border-border/60">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`${STATUS_COLORS[app.status] || STATUS_COLORS.not_started} border-0 text-[10px]`}
                          >
                            {STATUS_LABELS[app.status] || app.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {app.phase}
                          </span>
                        </div>
                        <h3 className="mt-2 text-lg font-bold">{app.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {app.course}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {app.applicationId}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">
                          {completedSteps}
                          <span className="text-lg text-muted-foreground">
                            /{APP_STEPS.length - 1}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          steps done
                        </p>
                        <p className="mt-1 text-sm font-medium text-amber-500">
                          Due: {app.deadline}
                        </p>
                      </div>
                    </div>

                    {/* Status update buttons */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {STATUS_OPTIONS.map((opt) => (
                        <Button
                          key={opt.value}
                          variant={
                            app.status === opt.value ? "default" : "outline"
                          }
                          size="sm"
                          className="h-7 text-[10px]"
                          disabled={
                            isUpdating ||
                            app.status === opt.value ||
                            isTerminal
                          }
                          onClick={() =>
                            handleStatusChange(app._id, opt.value)
                          }
                        >
                          {isUpdating && app.status !== opt.value
                            ? "..."
                            : opt.label}
                        </Button>
                      ))}
                    </div>

                    {/* Step progress line */}
                    <div className="mt-5">
                      {/* Progress bar above the steps */}
                      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted-foreground/10">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        {APP_STEPS.map((step, i) => {
                          const isCompleted = i < completedSteps;
                          const isCurrent = i === completedSteps;
                          const isRejected =
                            (app.status === "rejected" ||
                              app.status === "not_selected") &&
                            i === completedSteps;
                          return (
                            <div
                              key={step}
                              className="flex flex-1 items-center"
                            >
                              <div className="flex flex-col items-center">
                                <div
                                  className={`flex size-8 items-center justify-center rounded-full border-2 transition-all ${
                                    isCompleted
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : isCurrent
                                        ? "border-primary/50 bg-primary/10 text-primary"
                                        : isRejected
                                          ? "border-red-500/50 bg-red-500/10 text-red-500"
                                          : "border-muted-foreground/20 bg-transparent text-muted-foreground/40"
                                  }`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="size-4" />
                                  ) : (
                                    <span className="text-[10px] font-medium">
                                      {i + 1}
                                    </span>
                                  )}
                                </div>
                                <p
                                  className={`mt-1.5 text-[10px] font-medium ${
                                    isCompleted
                                      ? "text-foreground"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {step}
                                </p>
                              </div>
                              {i < APP_STEPS.length - 1 && (
                                <div className="mx-1 mt-[-20px] h-[2px] flex-1">
                                  <div
                                    className={`h-full rounded-full ${
                                      i < completedSteps
                                        ? "bg-primary"
                                        : "bg-muted-foreground/20"
                                    }`}
                                  />
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
            <p className="text-sm font-medium text-muted-foreground">
              No applications found
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Add colleges from the Discover page to start tracking
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
