import { useMemo } from "react";
import { useQuery } from "@/hooks/use-supabase-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Target } from "lucide-react";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function getDaysUntil(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getUrgencyColor(days: number) {
  if (days <= 0) return "text-red-500";
  if (days <= 3) return "text-red-500";
  if (days <= 7) return "text-amber-500";
  if (days <= 30) return "text-blue-400";
  return "text-muted-foreground";
}

function getPriorityLabel(days: number) {
  if (days <= 3) return { label: "URGENT", color: "text-red-500", borderColor: "hsl(var(--destructive))" };
  if (days <= 7) return { label: "HIGH", color: "text-amber-500", borderColor: "hsl(38, 92%, 50%)" };
  return { label: "MEDIUM", color: "text-blue-400", borderColor: "hsl(217, 91%, 60%)" };
}

// ── Query helpers ─────────────────────────────────────────────────────────────

async function fetchApplications(args: { userId?: string }) {
  if (!args.userId) return [];
  const { data } = await supabase
    .from("applications")
    .select("*")
    .eq("student_id", args.userId);
  return (data ?? []).map((r) => ({
    _id: r.id,
    userId: r.student_id,
    name: r.name,
    type: r.type,
    status: r.status,
    deadline: r.deadline,
    course: r.course_id,
  }));
}

async function fetchDeadlines(args: { userId?: string }) {
  if (!args.userId) return [];
  const { data } = await supabase
    .from("deadlines")
    .select("*")
    .eq("student_id", args.userId);
  return (data ?? []).map((r) => ({
    _id: r.id,
    userId: r.student_id,
    title: r.title,
    date: r.date,
    type: r.type,
    priority: r.priority,
    isCompleted: r.is_completed,
  }));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const applications = useQuery(fetchApplications, { userId: user?._id });
  const deadlines = useQuery(fetchDeadlines, { userId: user?._id });

  const appStats = useMemo(() => {
    if (!applications) return { total: 0, applied: 0, inProgress: 0 };
    return {
      total: applications.length,
      applied: applications.filter((a) => a.status === "applied").length,
      inProgress: applications.filter(
        (a) =>
          a.status !== "applied" &&
          a.status !== "selected" &&
          a.status !== "not_selected"
      ).length,
    };
  }, [applications]);

  const urgentCount = useMemo(() => {
    if (!deadlines) return 0;
    return deadlines.filter((d) => {
      if (d.isCompleted) return false;
      const days = getDaysUntil(d.date);
      return days <= 7 && days >= 0;
    }).length;
  }, [deadlines]);

  // ── Action Center: built from LIVE deadlines data ──────────────────────────
  const actionItems = useMemo(() => {
    if (!deadlines || deadlines.length === 0) return [];
    return deadlines
      .filter((d) => !d.isCompleted)
      .map((d) => {
        const days = getDaysUntil(d.date);
        const urgency = getPriorityLabel(days);
        const typeLabel =
          d.type === "exam" ? "Entrance exam" :
          d.type === "application" ? "Application" :
          d.type === "document" ? "Document upload" : "Action";
        const path =
          d.type === "exam" ? "/deadlines" :
          d.type === "application" ? "/applications" : "/applications";
        return {
          priority: urgency.label,
          priorityColor: urgency.color,
          borderColor: urgency.borderColor,
          title: d.title,
          subtitle: typeLabel,
          timeLeft: days <= 0 ? "Overdue" : `${days}d left`,
          actionLabel: days <= 0 ? "Overdue →" : "View →",
          actionPath: path,
        };
      })
      .sort((a, b) => {
        const order = { URGENT: 0, HIGH: 1, MEDIUM: 2 };
        return (order[a.priority as keyof typeof order] ?? 3) - (order[b.priority as keyof typeof order] ?? 3);
      });
  }, [deadlines]);

  // ── Deadline Corner: built from LIVE deadlines data ────────────────────────
  const deadlineCornerItems = useMemo(() => {
    if (!deadlines || deadlines.length === 0) return [];
    return deadlines
      .filter((d) => !d.isCompleted && getDaysUntil(d.date) >= 0)
      .sort((a, b) => getDaysUntil(a.date) - getDaysUntil(b.date))
      .slice(0, 3)
      .map((d) => ({
        name: d.title,
        course: d.type || "Application",
        daysLeft: `${Math.max(0, getDaysUntil(d.date))}d left`,
        daysNum: Math.max(0, getDaysUntil(d.date)),
      }));
  }, [deadlines]);

  // ── Upcoming deadlines count ───────────────────────────────────────────────
  const upcomingCount = useMemo(() => {
    if (!deadlines) return 0;
    return deadlines.filter((d) => !d.isCompleted && getDaysUntil(d.date) >= 0).length;
  }, [deadlines]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="p-6 md:p-8">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-6xl space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeUp}>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {greeting}, {firstName} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here's what needs your attention today.
          </p>
        </motion.div>

        {/* Stat Cards */}
        <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/60">
            <CardContent className="p-5">
              <p className="text-4xl font-bold text-primary">{appStats.inProgress}</p>
              <p className="mt-1 text-sm font-medium">Active applications</p>
              <p className="text-xs text-muted-foreground">in progress</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-5">
              <p className="text-4xl font-bold text-amber-500">{urgentCount}</p>
              <p className="mt-1 text-sm font-medium">Urgent actions</p>
              <p className="text-xs text-muted-foreground">need your attention</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-5">
              <p className="text-4xl font-bold text-blue-400">{upcomingCount}</p>
              <p className="mt-1 text-sm font-medium">Upcoming deadlines</p>
              <p className="text-xs text-muted-foreground">across your journey</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-5">
              <p className="text-4xl font-bold text-emerald-400">{appStats.total || 0}</p>
              <p className="mt-1 text-sm font-medium">Total applications</p>
              <p className="text-xs text-muted-foreground">being tracked</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Action Center */}
          <motion.div variants={fadeUp} className="lg:col-span-2">
            <Card className="border-border/60">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-primary">
                      Action Center
                    </p>
                    <p className="mt-1 text-lg font-bold">Your next right steps</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{urgentCount} urgent</span>
                </div>

                <div className="space-y-1">
                  {actionItems.length > 0 ? actionItems.map((action, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 rounded-lg border-l-2 border-l-border px-4 py-3 transition-colors hover:bg-accent/30"
                      style={{ borderLeftColor: action.borderColor }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-[10px] font-bold uppercase tracking-wider ${action.priorityColor}`}>
                            {action.priority}
                          </span>
                          <span className="text-xs text-muted-foreground">· {action.timeLeft}</span>
                        </div>
                        <p className="mt-0.5 text-sm font-medium">{action.title}</p>
                        <p className="text-xs text-muted-foreground">{action.subtitle}</p>
                      </div>
                      <button
                        onClick={() => navigate(action.actionPath)}
                        className="shrink-0 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
                      >
                        {action.actionLabel}
                      </button>
                    </div>
                  )) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">No urgent actions</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column */}
          <motion.div variants={fadeUp} className="space-y-6">
            {/* AI Recommendation */}
            <Card className="border-border/60">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded bg-primary/20">
                    <Target className="size-3.5 text-primary" />
                  </div>
                  <p className="font-mono text-xs uppercase tracking-widest text-primary">
                    AI Recommendation
                  </p>
                </div>
                <p className="text-base font-bold">Start with the prerequisite.</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Register for JEE Main first. It is required for your strongest profile match and closes before the college application deadline.
                </p>
                <button
                  onClick={() => navigate("/discover")}
                  className="mt-3 text-sm text-primary hover:underline"
                >
                  View matching colleges →
                </button>
              </CardContent>
            </Card>

            {/* Deadline Corner — now LIVE from database */}
            <Card className="border-border/60">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-primary">
                      Deadline Corner
                    </p>
                    <p className="mt-1 text-base font-bold">Your saved dates</p>
                  </div>
                  <button
                    onClick={() => navigate("/deadlines")}
                    className="text-xs text-primary hover:underline"
                  >
                    View all →
                  </button>
                </div>

                <div className="space-y-3">
                  {deadlineCornerItems.length > 0 ? deadlineCornerItems.map((d, i) => {
                    const color = getUrgencyColor(d.daysNum);
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.course}</p>
                        </div>
                        <span className={`shrink-0 text-right text-sm font-bold ${color}`}>
                          {d.daysLeft}
                        </span>
                      </div>
                    );
                  }) : (
                    <p className="py-2 text-center text-sm text-muted-foreground">No upcoming deadlines</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
