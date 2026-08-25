import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, GraduationCap, MapPin, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function Shortlist() {
  const { user } = useAuth();
  const bookmarks = useQuery(
    api.scholarships.listBookmarks,
    user ? { userId: user._id } : "skip"
  );
  const scholarships = useQuery(api.scholarships.getActive);
  const colleges = useQuery(api.scholarships.listColleges);

  const bookmarkedScholarships = useMemo(() => {
    if (!bookmarks || !scholarships) return [];
    const ids = new Set(
      bookmarks.filter((b) => b.itemType === "scholarship").map((b) => b.itemId)
    );
    return scholarships.filter((s) => ids.has(s._id));
  }, [bookmarks, scholarships]);

  const bookmarkedColleges = useMemo(() => {
    if (!bookmarks || !colleges) return [];
    const ids = new Set(
      bookmarks.filter((b) => b.itemType === "college").map((b) => b.itemId)
    );
    return colleges.filter((c) => ids.has(c._id));
  }, [bookmarks, colleges]);

  return (
    <div className="p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-6xl space-y-6"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Shortlist</h1>
          <p className="mt-1 text-muted-foreground">
            Your saved scholarships and colleges
          </p>
        </div>

        <Tabs defaultValue="scholarships">
          <TabsList>
            <TabsTrigger value="scholarships" className="gap-2">
              <GraduationCap className="size-4" />
              Scholarships ({bookmarkedScholarships.length})
            </TabsTrigger>
            <TabsTrigger value="colleges" className="gap-2">
              <MapPin className="size-4" />
              Colleges ({bookmarkedColleges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scholarships" className="mt-4">
            {bookmarkedScholarships.length === 0 ? (
              <EmptyState
                icon="🎓"
                title="No saved scholarships"
                description="Browse scholarships and bookmark the ones you're interested in"
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {bookmarkedScholarships.map((s) => (
                  <Card key={s._id} className="border-border/60">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-semibold">{s.name}</h3>
                          <p className="text-xs text-muted-foreground">{s.provider}</p>
                        </div>
                        <Heart className="size-4 fill-red-500 text-red-500" />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[10px] capitalize">{s.type}</Badge>
                        <Badge variant="outline" className="text-[10px]">{s.educationLevel}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-1">{s.benefit}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Deadline: {s.deadline}</span>
                        {s.officialUrl && (
                          <a href={s.officialUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            Official site
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="colleges" className="mt-4">
            {bookmarkedColleges.length === 0 ? (
              <EmptyState
                icon="🏫"
                title="No saved colleges"
                description="Browse colleges and add them to your shortlist"
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {bookmarkedColleges.map((c) => (
                  <Card key={c._id} className="border-border/60">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-semibold">{c.name}</h3>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" />
                            {c.location}, {c.state}
                          </p>
                        </div>
                        <Heart className="size-4 fill-red-500 text-red-500" />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                        {c.description}
                      </p>
                      <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                        <span>{c.fees}</span>
                        <span>Deadline: {c.applicationDeadline}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed p-12 text-center">
      <div className="mx-auto text-4xl">{icon}</div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground/70">{description}</p>
    </div>
  );
}
