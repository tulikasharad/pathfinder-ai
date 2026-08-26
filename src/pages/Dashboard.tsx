import { useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  Calendar,
  GraduationCap,
  Target,
  TrendingUp,
} from "lucide-react";

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

const ACTIONS_DATA = [
  {
    priority: "URGENT",
    priorityColor: "text-red-500",
    title: "JEE Main registration",
    subtitle: "Northstar Institute of Technology · Entrance exam",
    timeLeft: "7d left",
    actionLabel: "Register now →",
    actionPath: "/deadlines",
  },
  {
    priority: "HIGH",
    priorityColor: "text-amber-500",
    title: "Pay application fee",
    subtitle: "Northstar Institute of Technology · Payment",
    timeLeft: "7d left",
    actionLabel: "Pay now →",
    actionPath: "/applications",
  },
  {
    priority: "MEDIUM",
    priorityColor: "text-blue-400",
    title: "Upload 12th marksheet",
    subtitle: "VIT University Vellore · Document upload",
    timeLeft: "2d left",
    actionLabel: "Upload →",
    actionPath: "/applications",
  },
  {
    priority: "MEDIUM",
    priorityColor: "text-blue-400",
    title: "Complete JEE application form",
    subtitle: "JEE Main · Application",
    timeLeft: "13d left",
    actionLabel: "Start →",
    actionPath: "/applications",
  },
];

const DEADLINES_DATA = [
  { name: "Northstar Institute of Technology", course: "Phase 1 · B.Tech CSE", daysLeft: "7d left" },
  { name: "VIT University Vellore", course: "VITEEE · Phase 1", daysLeft: "0d left" },
  { name: "BITS Pilani", course: "Phase 1 · B.E. CSE", daysLeft: "3d left" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const applications = useQuery(
    api.scholarships.listApplications,
    user ? { userId: user._id } : "skip"
  );
  const deadlines = useQuery(
    api.scholarships.listDeadlines,
    user ? { userId: user._id } : "skip"
  );
  const seedDemo = useMutation(api.scholarships.seedDemoData);

  useEffect(() => {
    seedDemo();
  }, [seedDemo]);

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

  const upcomingDeadlines = useMemo(() => {
    if (!deadlines) return [];
    return deadlines
      .filter((d) => !d.isCompleted && getDaysUntil(d.date) >= 0)
      .sort((a, b) => getDaysUntil(a.date) - getDaysUntil(b.date))
      .slice(0, 3);
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
              <p className="text-4xl font-bold text-blue-400">{upcomingDeadlines.length || 7}</p>
              <p className="mt-1 text-sm font-medium">Upcoming deadlines</p>
              <p className="text-xs text-muted-foreground">across your journey</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-5">
              <p className="text-4xl font-bold text-emerald-400">18</p>
              <p className="mt-1 text-sm font-medium">Eligible opportunities</p>
              <p className="text-xs text-muted-foreground">matched to you</p>
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
                  <span className="text-sm text-muted-foreground">2 urgent</span>
                </div>

                <div className="space-y-1">
                  {ACTIONS_DATA.map((action, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 rounded-lg border-l-2 border-l-border px-4 py-3 transition-colors hover:bg-accent/30"
                      style={{
                        borderLeftColor:
                          action.priority === "URGENT"
                            ? "hsl(var(--destructive))"
                            : action.priority === "HIGH"
                            ? "hsl(38, 92%, 50%)"
                            : "hsl(217, 91%, 60%)",
                      }}
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 text-xs"
                        onClick={() => navigate(action.actionPath)}
                      >
                        {action.actionLabel}
                      </Button>
                    </div>
                  ))}
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
                  Register for JEE Main first. It is required for your strongest profile match and closes before the college application deadline at Northstar Institute of Technology.
                </p>
                <button
                  onClick={() => navigate("/discover")}
                  className="mt-3 text-sm text-primary hover:underline"
                >
                  View matching colleges →
                </button>
              </CardContent>
            </Card>

            {/* Deadline Corner */}
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
                  {DEADLINES_DATA.map((d, i) => {
                    const daysNum = parseInt(d.daysLeft);
                    const color =
                      daysNum <= 1 ? "text-red-500" : daysNum <= 5 ? "text-amber-500" : "text-muted-foreground";
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
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
