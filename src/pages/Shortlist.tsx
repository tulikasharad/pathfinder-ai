import { useState, useMemo } from "react";
import { useQuery } from "@/hooks/use-supabase-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Search, ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";

const DEMO_COLLEGES = [
  { _id: "demo-c1", name: "Northstar Institute of Technology", course: "B.Tech CSE", status: "In Progress", statusColor: "bg-primary/15 text-primary", match: 94, deadline: "30 Aug", annualFee: "₹2.2L", scholarship: "Available", eligibility: "Eligible" },
  { _id: "demo-c2", name: "VIT University Vellore", course: "B.Tech CSE (AI & ML)", status: "In Progress", statusColor: "bg-primary/15 text-primary", match: 88, deadline: "25 Aug", annualFee: "₹1.9L", scholarship: "Available", eligibility: "Eligible" },
  { _id: "demo-c3", name: "SRM Institute of Science and Technology", course: "B.Tech CSE (AI & ML)", status: "Not Started", statusColor: "bg-muted text-muted-foreground", match: 82, deadline: "10 Sept", annualFee: "₹2.4L", scholarship: "Available", eligibility: "Eligible" },
  { _id: "demo-c4", name: "BITS Pilani", course: "B.E. CSE", status: "In Progress", statusColor: "bg-primary/15 text-primary", match: 79, deadline: "28 Aug", annualFee: "₹2.8L", scholarship: "Available", eligibility: "Eligible" },
];

async function fetchDreamCollegesForShortlist(args: { userId?: string }) {
  if (!args.userId) return [];
  const { data: dreams } = await supabase.from("dream_colleges").select("college_id").eq("student_id", args.userId);
  if (!dreams || dreams.length === 0) return [];
  const ids = dreams.map((d) => d.college_id);
  const { data: colleges } = await supabase.from("colleges").select("*").in("id", ids);
  return (colleges ?? []).map((c) => ({
    _id: c.id, name: c.name, course: c.courses?.[0] || "B.Tech CSE", status: "In Progress", statusColor: "bg-primary/15 text-primary",
    match: c.ranking ? Math.max(70, 100 - (c.ranking || 50) + 10) : 85, deadline: c.application_deadline, annualFee: c.fees, scholarship: "Available", eligibility: "Eligible",
  }));
}

export default function Shortlist() {
  const { user } = useAuth();
  const dreamColleges = useQuery(fetchDreamCollegesForShortlist, { userId: user?._id });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("match");

  const displayColleges = useMemo(() => {
    if (dreamColleges && dreamColleges.length > 0) return dreamColleges;
    return DEMO_COLLEGES;
  }, [dreamColleges]);

  const filtered = useMemo(() => {
    let results = displayColleges;
    if (searchQuery) { const q = searchQuery.toLowerCase(); results = results.filter((c) => c.name.toLowerCase().includes(q) || c.course.toLowerCase().includes(q)); }
    if (sortBy === "match") results = [...results].sort((a, b) => (b.match || 0) - (a.match || 0));
    else if (sortBy === "name") results = [...results].sort((a, b) => a.name.localeCompare(b.name));
    return results;
  }, [displayColleges, searchQuery, sortBy]);

  return (
    <div className="p-6 md:p-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-6xl space-y-6">
        <div><h1 className="text-3xl font-bold tracking-tight">Shortlist</h1><p className="mt-1 text-muted-foreground">{filtered.length} colleges saved</p></div>
        <div className="flex items-center gap-4">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search shortlisted colleges..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[180px]"><ArrowUpDown className="mr-2 size-3.5" /><SelectValue placeholder="Sort by" /></SelectTrigger><SelectContent><SelectItem value="match">Sort: Match score</SelectItem><SelectItem value="name">Sort: Name</SelectItem></SelectContent></Select>
        </div>
        <div className="space-y-3">
          {filtered.map((college, idx) => (
            <motion.div key={college._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
              <Card className="border-border/60 transition-all hover:border-primary/20">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2"><h3 className="text-base font-bold">{college.name}</h3><Badge className={`${college.statusColor} border-0 text-[10px]`}>{college.status}</Badge></div>
                      <p className="text-sm text-muted-foreground">{college.course}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-6 text-sm">
                        <div><p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Match</p><p className="font-bold text-primary">{college.match}%</p></div>
                        <div><p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Deadline</p><p className="font-medium">{college.deadline}</p></div>
                        <div><p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Annual Fee</p><p className="font-medium">{college.annualFee}</p></div>
                        <div><p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Scholarship</p><p className="font-medium text-primary">{college.scholarship}</p></div>
                        <div><p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Eligibility</p><p className="font-medium text-emerald-400">{college.eligibility}</p></div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0 ml-4">
                      <Button variant="outline" size="sm" className="text-xs">Compare</Button>
                      <Button variant="outline" size="sm" className="text-xs">View details</Button>
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Remove</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        {filtered.length === 0 && <div className="rounded-xl border border-dashed p-12 text-center"><Heart className="mx-auto size-12 text-muted-foreground/30" /><p className="mt-4 text-sm font-medium text-muted-foreground">No shortlisted colleges yet</p></div>}
      </motion.div>
    </div>
  );
}
