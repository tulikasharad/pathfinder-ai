import { useState, useMemo } from "react";
import { useQuery } from "@/hooks/use-supabase-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const APP_STEPS = ["Eligibility", "Application", "Payment", "Exam", "Result", "Counselling", "Admission"];

const DEMO_APPLICATIONS = [
  { _id: "demo1", name: "Northstar Institute of Technology", course: "B.Tech CSE", applicationId: "NIT2026CS001247", phase: "Phase 1", status: "started", deadline: "30 Aug 2026", completedSteps: 2 },
  { _id: "demo2", name: "VIT University Vellore", course: "B.Tech CSE (AI & ML)", applicationId: "VITEEE2026AI004512", phase: "Phase 1", status: "started", deadline: "25 Aug 2026", completedSteps: 3 },
];

async function fetchApps(args: { userId?: string }) {
  if (!args.userId) return [];
  const { data } = await supabase.from("applications").select("*").eq("student_id", args.userId);
  return (data ?? []).map((r) => ({
    _id: r.id, name: r.name, status: r.status, deadline: r.deadline, course: r.course_id || "—", phase: r.phase || "Phase 1", applicationId: r.application_id || "—",
    completedSteps: r.status === "applied" ? 5 : r.status === "started" ? 3 : r.status === "preparing" ? 2 : r.status === "interested" ? 1 : 0,
  }));
}

export default function Applications() {
  const { user } = useAuth();
  const applications = useQuery(fetchApps, { userId: user?._id });
  const [searchQuery, setSearchQuery] = useState("");

  const displayApps = useMemo(() => {
    if (applications && applications.length > 0) return applications;
    return DEMO_APPLICATIONS;
  }, [applications]);

  const filtered = useMemo(() => {
    if (!searchQuery) return displayApps;
    const q = searchQuery.toLowerCase();
    return displayApps.filter((a) => a.name.toLowerCase().includes(q) || a.course.toLowerCase().includes(q));
  }, [displayApps, searchQuery]);

  return (
    <div className="p-6 md:p-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="mt-1 text-muted-foreground">Track and manage your college applications.</p>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search applications..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="space-y-4">
          {filtered.map((app, idx) => {
            const completedSteps = typeof app.completedSteps === "number" ? app.completedSteps : 0;
            return (
              <motion.div key={app._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                <Card className="border-border/60">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary/15 text-primary border-0 text-[10px]">In Progress</Badge>
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
                              {i < APP_STEPS.length - 1 && <div className="mx-1 mt-[-20px] h-[2px] flex-1"><div className={`h-full rounded-full ${i < completedSteps ? "bg-primary" : "bg-muted-foreground/20"}`} /></div>}
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
        {filtered.length === 0 && <div className="rounded-xl border border-dashed p-12 text-center"><p className="text-sm font-medium text-muted-foreground">No applications found</p></div>}
      </motion.div>
    </div>
  );
}
