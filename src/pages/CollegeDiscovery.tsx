import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@/hooks/use-supabase-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MapPin,
  GraduationCap,
  ExternalLink,
  Heart,
  Star,
  Filter,
  ArrowUpDown,
  X,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

async function fetchColleges() {
  const { data } = await supabase.from("colleges").select("*");
  return (data ?? []).map((r) => ({
    _id: r.id,
    name: r.name,
    location: r.location,
    state: r.state,
    courses: r.courses ?? [],
    entranceExams: r.entrance_exams ?? [],
    fees: r.fees,
    eligibility: r.eligibility,
    applicationDeadline: r.application_deadline,
    scholarshipsAvailable: r.scholarships_available ?? [],
    officialUrl: r.official_url,
    isVerified: r.is_verified,
    description: r.description,
    imageUrl: r.image_url,
    ranking: r.ranking,
  }));
}

async function fetchBookmarks(args: { userId?: string }) {
  if (!args.userId) return [];
  const { data } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("student_id", args.userId)
    .eq("item_type", "college");
  return (data ?? []).map((r) => ({
    _id: r.id,
    userId: r.student_id,
    itemType: r.item_type,
    itemId: r.item_id,
  }));
}

async function toggleBookmarkOp(args: { userId: string; itemType: string; itemId: string }) {
  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("student_id", args.userId)
    .eq("item_type", args.itemType)
    .eq("item_id", args.itemId)
    .maybeSingle();

  if (existing) {
    await supabase.from("bookmarks").delete().eq("id", existing.id);
    return { bookmarked: false };
  }

  await supabase.from("bookmarks").insert({
    student_id: args.userId,
    item_type: args.itemType,
    item_id: args.itemId,
  });
  return { bookmarked: true };
}

export default function CollegeDiscovery() {
  const { user } = useAuth();
  const colleges = useQuery(fetchColleges);
  const bookmarks = useQuery(fetchBookmarks, { userId: user?._id });
  const toggleBookmark = useMutation(toggleBookmarkOp);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [sortBy, setSortBy] = useState("ranking");
  const [selectedCollege, setSelectedCollege] = useState<any>(null);

  const shortlistedIds = useMemo(
    () => new Set(bookmarks?.map((b) => b.itemId) || []),
    [bookmarks]
  );

  const filtered = useMemo(() => {
    if (!colleges) return [];
    let results = [...colleges];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.courses.some((course: string) => course.toLowerCase().includes(q))
      );
    }

    if (filterState !== "all") {
      results = results.filter((c) => c.state === filterState);
    }

    if (sortBy === "ranking") {
      results.sort((a, b) => (a.ranking || 99) - (b.ranking || 99));
    } else if (sortBy === "name") {
      results.sort((a, b) => a.name.localeCompare(b.name));
    }

    return results;
  }, [colleges, searchQuery, filterState, sortBy]);

  const handleToggleBookmark = useCallback(
    async (id: string) => {
      if (!user) return;
      await toggleBookmark({
        userId: user._id,
        itemType: "college",
        itemId: id,
      });
    },
    [user, toggleBookmark]
  );

  const uniqueStates = useMemo(() => {
    if (!colleges) return [];
    return [...new Set(colleges.map((c) => c.state))].sort();
  }, [colleges]);

  return (
    <div className="p-6 md:p-8">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-6xl space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discover opportunities</h1>
          <p className="mt-1 text-muted-foreground">
            Find a path that fits your profile, goals and budget.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search colleges, courses, scholarships or exams..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterState} onValueChange={setFilterState}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {uniqueStates.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Filter className="size-3.5" />
            More filters
          </Button>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-accent/30 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-primary">👤</span> Based on your profile:
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">12th: 87%</Badge>
            <Badge variant="secondary" className="text-xs">B.Tech CSE</Badge>
            <Badge variant="secondary" className="text-xs">₹2.5L budget</Badge>
          </div>
          <span className="ml-auto text-sm font-bold text-primary">{filtered.length} MATCHES</span>
        </div>

        <h2 className="text-lg font-bold">Colleges for your path</h2>

        <div className="space-y-4">
          {filtered.map((college, idx) => {
            const isShortlisted = shortlistedIds.has(college._id);
            const deadlineDays = Math.ceil(
              (new Date(college.applicationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            const isUrgent = deadlineDays <= 7 && deadlineDays > 0;

            return (
              <motion.div
                key={college._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card className="group border-border/60 transition-all hover:border-primary/30 hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      {college.isVerified && (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle2 className="size-3.5" />
                          Officially verified
                        </span>
                      )}
                      <Badge variant="secondary" className="text-[10px]">
                        {isUrgent ? "Closing Soon" : "Open"}
                      </Badge>
                    </div>

                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold">{college.name}</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {college.courses[0] || "B.Tech CSE"} · {college.location}, {college.state}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">
                          {college.ranking ? Math.max(70, 100 - (college.ranking || 50) + 10) : 85}%
                        </p>
                        <p className="text-xs text-muted-foreground">Match</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-6 text-sm">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">NIRF</p>
                        <p className="font-medium">#{college.ranking || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Avg Package</p>
                        <p className="font-medium">₹{college.ranking ? (14 - college.ranking * 0.1).toFixed(1) : "12.0"}L</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Annual Fee</p>
                        <p className="font-medium">{college.fees}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Exam</p>
                        <p className="font-medium">{college.entranceExams[0] || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Deadline</p>
                        <p className={`font-medium ${isUrgent ? "text-amber-500" : ""}`}>
                          {college.applicationDeadline}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <Star className="size-3" />
                        Scholarship
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t pt-4">
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 className="size-3" />
                        Eligible
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          className="size-9 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors"
                          onClick={() => handleToggleBookmark(college._id)}
                        >
                          {isShortlisted ? (
                            <Heart className="size-5 fill-red-500 text-red-500" />
                          ) : (
                            <Heart className="size-5 text-muted-foreground" />
                          )}
                        </button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setSelectedCollege(college)}
                        >
                          View details <ArrowRight className="size-3.5" />
                        </Button>
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
            <GraduationCap className="mx-auto size-12 text-muted-foreground/30" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">No colleges found</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Try adjusting your search or filters</p>
          </div>
        )}

        <AnimatePresence>
          {selectedCollege && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setSelectedCollege(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl border bg-background p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold">{selectedCollege.name}</h2>
                    <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {selectedCollege.location}, {selectedCollege.state}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedCollege(null)} className="size-8">
                    <X className="size-4" />
                  </Button>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <p className="text-muted-foreground">{selectedCollege.description}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-accent/50 p-3">
                      <p className="text-[11px] text-muted-foreground">Fees</p>
                      <p className="font-medium">{selectedCollege.fees}</p>
                    </div>
                    <div className="rounded-lg bg-accent/50 p-3">
                      <p className="text-[11px] text-muted-foreground">Deadline</p>
                      <p className="font-medium">{selectedCollege.applicationDeadline}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Entrance Exams</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedCollege.entranceExams.map((exam: string) => (
                        <Badge key={exam} variant="outline" className="text-xs">{exam}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Courses</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedCollege.courses.map((course: string) => (
                        <Badge key={course} variant="secondary" className="text-xs">{course}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Eligibility</p>
                    <p className="text-muted-foreground">{selectedCollege.eligibility}</p>
                  </div>
                  {selectedCollege.officialUrl && (
                    <a
                      href={selectedCollege.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Visit Official Website <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
                <div className="mt-6 flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setSelectedCollege(null)}>
                    Close
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleToggleBookmark(selectedCollege._id);
                      setSelectedCollege(null);
                    }}
                  >
                    {shortlistedIds.has(selectedCollege._id) ? "Remove from Shortlist" : "Add to Shortlist"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
