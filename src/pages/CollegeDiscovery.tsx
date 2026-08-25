import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
  HeartOff,
  Star,
  Filter,
  ArrowUpDown,
  X,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function CollegeDiscovery() {
  const { user } = useAuth();
  const colleges = useQuery(api.scholarships.listColleges);
  const bookmarks = useQuery(
    api.scholarships.listBookmarks,
    user ? { userId: user._id } : "skip"
  );
  const toggleBookmark = useMutation(api.scholarships.toggleBookmark);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [sortBy, setSortBy] = useState("ranking");
  const [selectedCollege, setSelectedCollege] = useState<any>(null);

  const shortlistedIds = useMemo(
    () =>
      new Set(
        bookmarks?.filter((b) => b.itemType === "college").map((b) => b.itemId) || []
      ),
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
          c.courses.some((course) => course.toLowerCase().includes(q))
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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Discover Colleges
          </h1>
          <p className="mt-1 text-muted-foreground">
            Find the right college based on your preferences and eligibility
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search colleges, courses, locations..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterState} onValueChange={setFilterState}>
            <SelectTrigger className="w-[160px]">
              <MapPin className="mr-2 size-3.5" />
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {uniqueStates.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="mr-2 size-3.5" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ranking">Ranking</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} college{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* College Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((college, idx) => {
            const isShortlisted = shortlistedIds.has(college._id);
            return (
              <motion.div
                key={college._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card className="group h-full border-border/60 transition-all hover:border-primary/30 hover:shadow-md">
                  <CardContent className="flex flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold leading-tight">{college.name}</h3>
                          {college.ranking && (
                            <Badge variant="secondary" className="shrink-0 text-[10px]">
                              #{college.ranking}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" />
                          {college.location}, {college.state}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0"
                        onClick={() => handleToggleBookmark(college._id)}
                      >
                        {isShortlisted ? (
                          <Heart className="size-4 fill-red-500 text-red-500" />
                        ) : (
                          <HeartOff className="size-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>

                    <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                      {college.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {college.entranceExams.map((exam) => (
                        <Badge key={exam} variant="outline" className="text-[10px]">
                          {exam}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-auto space-y-2 border-t pt-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Fees</span>
                        <span className="font-medium">{college.fees}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Deadline</span>
                        <span className="font-medium">{college.applicationDeadline}</span>
                      </div>
                      {college.isVerified && (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                          <Star className="size-3" />
                          Verified Source
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => setSelectedCollege(college)}
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handleToggleBookmark(college._id)}
                      >
                        {isShortlisted ? "Shortlisted" : "Shortlist"}
                      </Button>
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
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              No colleges found
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* College Detail Dialog */}
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
                <Separator className="my-4" />
                <div className="space-y-3 text-sm">
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
                  <div>
                    <p className="font-medium">Scholarships Available</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedCollege.scholarshipsAvailable.map((s: string) => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
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
