import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@/hooks/use-supabase-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

function getDaysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getUrgency(days: number) {
  if (days < 0) return { label: "Closed", color: "bg-red-500/15 text-red-500", barColor: "bg-red-500", numColor: "text-red-500" };
  if (days <= 3) return { label: "Urgent", color: "bg-red-500/15 text-red-500", barColor: "bg-red-500", numColor: "text-red-500" };
  if (days <= 7) return { label: "Closing Soon", color: "bg-amber-500/15 text-amber-500", barColor: "bg-amber-500", numColor: "text-amber-500" };
  if (days <= 30) return { label: "Upcoming", color: "bg-blue-500/15 text-blue-500", barColor: "bg-blue-500", numColor: "" };
  return { label: "Upcoming", color: "bg-blue-500/15 text-blue-500", barColor: "bg-muted-foreground/20", numColor: "" };
}

async function fetchDeadlines(args: { userId?: string }) {
  if (!args.userId) return [];
  const { data } = await supabase.from("deadlines").select("*").eq("student_id", args.userId);
  return (data ?? []).map((d) => ({
    _id: d.id,
    name: d.title,
    type: d.type || "Application",
    deadline: d.date,
    priority: d.priority,
    isCompleted: d.is_completed,
  }));
}

async function toggleDeadlineCompleteOp(args: { deadlineId: string; isCompleted: boolean }) {
  const { error } = await supabase
    .from("deadlines")
    .update({ is_completed: args.isCompleted })
    .eq("id", args.deadlineId);
  if (error) {
    console.error("[toggleDeadlineComplete] Error:", error.message);
    throw new Error(`Failed to update: ${error.message}`);
  }
  return { updated: true };
}

export default function Deadlines() {
  const { user } = useAuth();
  const deadlines = useQuery(fetchDeadlines, { userId: user?._id });
  const toggleComplete = useMutation(toggleDeadlineCompleteOp);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    if (!deadlines) return [];
    return [...deadlines]
      .map((d) => ({ ...d, daysUntil: getDaysUntil(d.deadline) }))
      .sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        return a.daysUntil - b.daysUntil;
      });
  }, [deadlines]);

  const alerts = useMemo(() => {
    if (!sorted.length) return [];
    return sorted
      .filter((d) => !d.isCompleted && d.daysUntil <= 7 && d.daysUntil >= 0)
      .map((d) => ({
        type: d.daysUntil <= 3 ? "urgent" : "closing",
        title: d.name,
        message: d.daysUntil <= 0 ? "is overdue" : `closes in ${d.daysUntil} day${d.daysUntil !== 1 ? "s" : ""}`,
      }));
  }, [sorted]);

  const handleToggleComplete = useCallback(
    async (deadlineId: string, currentState: boolean) => {
      setTogglingId(deadlineId);
      try {
        await toggleComplete({ deadlineId, isCompleted: !currentState });
        toast.success(currentState ? "Marked as incomplete" : "Marked as complete");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update.");
      } finally {
        setTogglingId(null);
      }
    },
    [toggleComplete]
  );

  return (
    <div className="p-6 md:p-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deadlines</h1>
          <p className="mt-1 text-muted-foreground">Your upcoming college application and exam deadlines.</p>
        </div>

        {/* Dynamic Alert Banners */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3 ${alert.type === "urgent" ? "bg-red-500/5" : "bg-accent/30"}`}>
                <Badge className={`${alert.type === "urgent" ? "bg-red-500/15 text-red-500" : "bg-amber-500/15 text-amber-500"} border-0 font-mono text-[10px] uppercase`}>
                  {alert.type === "urgent" ? "Urgent" : "Closing Soon"}
                </Badge>
                <p className="text-sm">
                  <span className="font-bold">{alert.title}</span> {alert.message}.
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Deadline Cards */}
        <div className="space-y-3">
          {sorted.map((d, idx) => {
            const daysUntil = d.daysUntil;
            const urgency = getUrgency(daysUntil);
            const isToggling = togglingId === d._id;
            return (
              <motion.div key={d._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                <Card className={`border-border/60 ${d.isCompleted ? "opacity-60" : ""}`}>
                  <CardContent className="flex items-center gap-5 p-5">
                    <div className={`h-14 w-1 shrink-0 rounded-full ${urgency.barColor}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold">{d.name}</h3>
                        <Badge className={`${urgency.color} border-0 text-[10px]`}>{urgency.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{d.type}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-4 text-xs">
                        <span>
                          <span className="text-muted-foreground">DEADLINE: </span>
                          <span className={`font-medium ${urgency.numColor}`}>{d.deadline}</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-3xl font-bold ${urgency.numColor}`}>{Math.max(0, daysUntil)}</p>
                      <p className="text-xs text-muted-foreground">days left</p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        variant={d.isCompleted ? "default" : "outline"}
                        size="sm"
                        className="gap-1 text-xs"
                        disabled={isToggling}
                        onClick={() => handleToggleComplete(d._id, d.isCompleted)}
                      >
                        <CheckCircle2 className="size-3" />
                        {isToggling ? "..." : d.isCompleted ? "Completed" : "Mark Done"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {sorted.length === 0 && (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <Calendar className="mx-auto size-10 text-muted-foreground/30" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">No upcoming deadlines</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
