import { useState, useMemo } from "react";
import { useMutation } from "@/hooks/use-supabase-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const DEMO_PROFILE = {
  name: "Arjun Sharma", email: "arjun.sharma@gmail.com", gender: "Male", category: "General",
  state: "Maharashtra", city: "Mumbai", twelfthPercentage: "87%", studentType: "12th",
  preferredCourse: "B.Tech CSE", specialization: "Artificial Intelligence", annualBudget: "₹2.5L",
  hostelRequired: "Yes", scholarshipRequired: "Yes", preferredCities: ["Pune", "Bangalore", "Hyderabad", "Chennai"],
  annualFeeBudget: "₹2.5L", profileStatus: "Active", completionPercent: 78,
  completedSections: ["Personal info", "Academic details", "Preferences"], pendingSections: ["Entrance exams", "Documents"],
};

async function updateProfileOp(args: { userId: string; name?: string; profile?: any }) {
  const updates: any = {};
  if (args.name) updates.name = args.name;
  if (args.profile) {
    updates.age = args.profile.age;
    updates.state = args.profile.state;
    updates.gender = args.profile.gender;
    updates.annual_family_income = args.profile.annualFamilyIncome;
    updates.category = args.profile.category;
    updates.education_level = args.profile.educationLevel;
    updates.course = args.profile.course;
    updates.academic_score = args.profile.academicScore;
    updates.onboarding_completed = true;
  }
  await supabase.from("profiles").update(updates).eq("id", args.userId);
}

function ProfileLabel({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{children}</p>;
}

export default function Profile() {
  const { user } = useAuth();
  const updateProfile = useMutation(updateProfileOp);
  const [isEditing, setIsEditing] = useState(false);

  const profile = useMemo(() => {
    if (user?.studentProfile?.age) {
      return {
        name: user.name || "Student", email: user.email || "guest@collegepath",
        gender: user.studentProfile.gender || "—", category: user.studentProfile.category || "—",
        state: user.studentProfile.state || "—", city: "—",
        twelfthPercentage: user.studentProfile.academicScore ? `${user.studentProfile.academicScore}%` : "—",
        studentType: user.studentProfile.educationLevel || "—", preferredCourse: user.studentProfile.course || "—",
        specialization: "—", annualBudget: user.studentProfile.annualFamilyIncome ? `₹${(user.studentProfile.annualFamilyIncome / 100000).toFixed(1)}L` : "—",
        hostelRequired: "—", scholarshipRequired: "Yes",
        preferredCities: ["Pune", "Bangalore", "Hyderabad", "Chennai"],
        annualFeeBudget: user.studentProfile.annualFamilyIncome ? `₹${(user.studentProfile.annualFamilyIncome / 100000).toFixed(1)}L` : "—",
        profileStatus: "Active", completionPercent: user.onboardingCompleted ? 100 : 50,
        completedSections: ["Personal info", "Academic details"], pendingSections: ["Entrance exams", "Documents", "Preferences"],
      };
    }
    return DEMO_PROFILE;
  }, [user]);

  return (
    <div className="p-6 md:p-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold tracking-tight">Your Profile</h1><p className="mt-1 text-muted-foreground">Your academic details power every match and recommendation.</p></div>
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>{isEditing ? "Done" : "Edit profile"}</Button>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Personal Information */}
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <ProfileLabel>Personal Information</ProfileLabel>
              <div className="mt-4 grid grid-cols-2 gap-6">
                <div><ProfileLabel>Full Name</ProfileLabel><p className="mt-1 text-base font-medium">{profile.name}</p></div>
                <div><ProfileLabel>Email</ProfileLabel><p className="mt-1 text-base font-medium">{profile.email}</p></div>
                <div><ProfileLabel>Gender</ProfileLabel><p className="mt-1 text-base font-medium">{profile.gender}</p></div>
                <div><ProfileLabel>Category</ProfileLabel><p className="mt-1 text-base font-medium">{profile.category}</p></div>
                <div><ProfileLabel>State</ProfileLabel><p className="mt-1 text-base font-medium">{profile.state}</p></div>
                <div><ProfileLabel>City</ProfileLabel><p className="mt-1 text-base font-medium">{profile.city}</p></div>
              </div>
            </div>
            {/* Academic Details */}
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <ProfileLabel>Academic Details</ProfileLabel>
              <div className="mt-4 grid grid-cols-2 gap-6">
                <div><ProfileLabel>12th Percentage</ProfileLabel><p className="mt-1 text-base font-medium">{profile.twelfthPercentage}</p></div>
                <div><ProfileLabel>Student Type</ProfileLabel><p className="mt-1 text-base font-medium">{profile.studentType}</p></div>
                <div><ProfileLabel>Preferred Course</ProfileLabel><p className="mt-1 text-base font-medium">{profile.preferredCourse}</p></div>
                <div><ProfileLabel>Specialization</ProfileLabel><p className="mt-1 text-base font-medium">{profile.specialization}</p></div>
              </div>
            </div>
            {/* Financial Preferences */}
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <ProfileLabel>Financial Preferences</ProfileLabel>
              <div className="mt-4 grid grid-cols-2 gap-6">
                <div><ProfileLabel>Annual Budget</ProfileLabel><p className="mt-1 text-base font-medium">{profile.annualBudget}</p></div>
                <div><ProfileLabel>Hostel Required</ProfileLabel><p className="mt-1 text-base font-medium">{profile.hostelRequired}</p></div>
                <div><ProfileLabel>Scholarship Required</ProfileLabel><p className="mt-1 text-base font-medium">{profile.scholarshipRequired}</p></div>
              </div>
            </div>
          </div>
          {/* Right Column */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <ProfileLabel>Profile Completion</ProfileLabel>
              <div className="mt-4">
                <div className="flex items-center justify-between"><p className="text-sm font-medium">Overall completeness</p><p className="text-sm font-bold text-primary">{profile.completionPercent}%</p></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all" style={{ width: `${profile.completionPercent}%` }} /></div>
                <div className="mt-4 space-y-3">
                  {profile.completedSections.map((s) => <div key={s} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-500" /><span className="text-sm">{s}</span></div>)}
                  {profile.pendingSections.map((s) => <div key={s} className="flex items-center gap-2"><div className="size-4 rounded-full border-2 border-muted-foreground/30" /><span className="text-sm text-muted-foreground">{s}</span></div>)}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <ProfileLabel>Saved Preferences</ProfileLabel>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between"><ProfileLabel>Preferred cities</ProfileLabel><p className="text-sm font-medium text-right">{profile.preferredCities.join(", ")}</p></div>
                <div className="flex items-center justify-between"><ProfileLabel>Annual fee budget</ProfileLabel><p className="text-sm font-medium">{profile.annualFeeBudget}</p></div>
                <div className="flex items-center justify-between"><ProfileLabel>Course</ProfileLabel><p className="text-sm font-medium">{profile.preferredCourse}</p></div>
                <div className="flex items-center justify-between"><ProfileLabel>Profile status</ProfileLabel><p className="text-sm font-medium text-emerald-400">{profile.profileStatus}</p></div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
