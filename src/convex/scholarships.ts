import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("scholarships").collect();
  },
});

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("scholarships")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("scholarships") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listColleges = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("colleges").collect();
  },
});

export const getCollege = query({
  args: { id: v.id("colleges") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Applications
export const listApplications = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const createApplication = mutation({
  args: {
    userId: v.string(),
    scholarshipId: v.optional(v.string()),
    collegeId: v.optional(v.string()),
    type: v.string(),
    name: v.string(),
    status: v.string(),
    deadline: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("applications", {
      userId: args.userId,
      scholarshipId: args.scholarshipId,
      collegeId: args.collegeId,
      type: args.type,
      name: args.name,
      status: args.status,
      deadline: args.deadline,
      notes: args.notes,
    });
  },
});

export const updateApplication = mutation({
  args: {
    id: v.id("applications"),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      ...(args.notes !== undefined && { notes: args.notes }),
    });
  },
});

export const deleteApplication = mutation({
  args: { id: v.id("applications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Bookmarks
export const listBookmarks = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const toggleBookmark = mutation({
  args: {
    userId: v.string(),
    itemType: v.string(),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_item", (q) =>
        q.eq("itemType", args.itemType).eq("itemId", args.itemId)
      )
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { bookmarked: false };
    }

    await ctx.db.insert("bookmarks", {
      userId: args.userId,
      itemType: args.itemType,
      itemId: args.itemId,
    });
    return { bookmarked: true };
  },
});

// Notifications
export const listNotifications = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const markNotificationRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isRead: true });
  },
});

export const markAllNotificationsRead = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const n of notifications) {
      if (!n.isRead) {
        await ctx.db.patch(n._id, { isRead: true });
      }
    }
  },
});

// Deadlines
export const listDeadlines = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("deadlines")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const createDeadline = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    date: v.string(),
    type: v.string(),
    priority: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("deadlines", {
      userId: args.userId,
      title: args.title,
      date: args.date,
      type: args.type,
      priority: args.priority,
      isCompleted: false,
    });
  },
});

export const toggleDeadline = mutation({
  args: { id: v.id("deadlines") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (item) {
      await ctx.db.patch(args.id, { isCompleted: !item.isCompleted });
    }
  },
});

// Profile
export const updateProfile = mutation({
  args: {
    userId: v.string(),
    name: v.optional(v.string()),
    studentProfile: v.optional(
      v.object({
        age: v.optional(v.number()),
        state: v.optional(v.string()),
        gender: v.optional(v.string()),
        annualFamilyIncome: v.optional(v.number()),
        category: v.optional(v.string()),
        educationLevel: v.optional(v.string()),
        schoolType: v.optional(v.string()),
        course: v.optional(v.string()),
        institutionType: v.optional(v.string()),
        academicScore: v.optional(v.number()),
        isDisabled: v.optional(v.boolean()),
        isMinority: v.optional(v.boolean()),
        isFirstGeneration: v.optional(v.boolean()),
        otherCriteria: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq("_id", args.userId))
      .first();
    if (user) {
      await ctx.db.patch(user._id, {
        ...(args.name !== undefined && { name: args.name }),
        ...(args.studentProfile !== undefined && {
          studentProfile: args.studentProfile,
        }),
        onboardingCompleted: true,
      });
    }
  },
});

// Seed demo data
export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("scholarships").first();
    if (existing) return { seeded: false };

    // Seed scholarships
    const scholarships = [
      {
        name: "National Merit Scholarship",
        provider: "Ministry of Education, Govt. of India",
        type: "government",
        benefit: "₹50,000 per year + tuition waiver",
        eligibility: "Class 12 passed with 90%+ marks",
        deadline: "2026-09-30",
        educationLevel: "undergraduate",
        state: "all",
        category: "general",
        minScore: 90,
        maxIncome: 800000,
        description:
          "Prestigious merit-based scholarship for top-performing students across India. Covers tuition and provides annual stipend.",
        isVerified: true,
        isActive: true,
      },
      {
        name: "Post-Matric SC/ST Scholarship",
        provider: "Ministry of Social Justice",
        type: "government",
        benefit: "Full tuition + ₹1,500/month maintenance",
        eligibility: "SC/ST category, family income < ₹2.5L",
        deadline: "2026-10-15",
        educationLevel: "postgraduate",
        state: "all",
        category: "SC/ST",
        minScore: 50,
        maxIncome: 250000,
        isForDisabled: false,
        isForMinority: false,
        isForFirstGen: false,
        description:
          "Government scholarship for SC/ST students pursuing post-matric education. Covers complete tuition and provides maintenance allowance.",
        isVerified: true,
        isActive: true,
      },
      {
        name: "INSPIRE Fellowship",
        provider: "Department of Science & Technology",
        type: "government",
        benefit: "₹80,000/year for 5 years",
        eligibility: "Top 1% of Class 12, pursuing B.Sc./Integrated M.Sc.",
        deadline: "2026-11-01",
        educationLevel: "undergraduate",
        state: "all",
        category: "general",
        minScore: 95,
        description:
          "Innovation in Science Pursuit for Inspired Research. Supports talented students in natural/basic sciences.",
        isVerified: true,
        isActive: true,
      },
      {
        name: "Tata Trusts Scholarship",
        provider: "Tata Trusts",
        type: "private",
        benefit: "Up to ₹2,00,000 per year",
        eligibility: "Family income < ₹6L, merit-based",
        deadline: "2026-08-31",
        educationLevel: "undergraduate",
        state: "all",
        category: "general",
        minScore: 70,
        maxIncome: 600000,
        description:
          "Comprehensive scholarship from Tata Trusts covering tuition, hostel, and living expenses for meritorious students from low-income families.",
        isVerified: true,
        isActive: true,
      },
      {
        name: "AICTE Pragati Scholarship",
        provider: "AICTE, Govt. of India",
        type: "government",
        benefit: "₹50,000/year (tuition + contingency)",
        eligibility: "Female students, family income < ₹8L, pursuing technical education",
        deadline: "2026-11-30",
        educationLevel: "undergraduate",
        state: "all",
        category: "general",
        gender: "female",
        maxIncome: 800000,
        description:
          "Promoting girls' participation in technical education. Covers tuition fees and provides contingency grant.",
        isVerified: true,
        isActive: true,
      },
      {
        name: "Minority Scholarship (PMSS)",
        provider: "Ministry of Minority Affairs",
        type: "government",
        benefit: "₹30,000 - ₹1,00,000 based on course",
        eligibility: "Minority community, family income < ₹2L",
        deadline: "2026-10-31",
        educationLevel: "postgraduate",
        state: "all",
        category: "minority",
        maxIncome: 200000,
        isForMinority: true,
        description:
          "Prime Minister's Scholarship Scheme for minority community students. Multiple tiers based on course level.",
        isVerified: true,
        isActive: true,
      },
      {
        name: "KVPY Fellowship",
        provider: "Indian Institute of Science",
        type: "government",
        benefit: "₹84,000/year + summer camp participation",
        eligibility: "KVPY scholars, pursuing B.Sc./Integrated M.Sc./B.S.",
        deadline: "2026-09-15",
        educationLevel: "undergraduate",
        state: "all",
        category: "general",
        minScore: 85,
        description:
          "Kishore Vaigyanik Protsahan Yojana fellowship for students with aptitude for scientific research.",
        isVerified: true,
        isActive: true,
      },
      {
        name: "L&T Build India Scholarship",
        provider: "Larsen & Toubro",
        type: "private",
        benefit: "₹2,00,000/year + internship at L&T",
        eligibility: "B.E./B.Tech students, 1st year, 70%+ in 12th",
        deadline: "2026-09-20",
        educationLevel: "undergraduate",
        state: "all",
        category: "general",
        minScore: 70,
        description:
          "Industry scholarship for engineering students with guaranteed summer internship at L&T projects.",
        isVerified: true,
        isActive: true,
      },
      {
        name: "Reliance Foundation Undergraduate Scholarship",
        provider: "Reliance Foundation",
        type: "private",
        benefit: "₹2,00,000 over duration of course",
        eligibility: "Family income < ₹15L, merit + need based",
        deadline: "2026-10-20",
        educationLevel: "undergraduate",
        state: "all",
        category: "general",
        maxIncome: 1500000,
        description:
          "Need-cum-merit scholarship supporting undergraduate students from economically weaker sections.",
        isVerified: true,
        isActive: true,
      },
      {
        name: "First Generation Student Grant",
        provider: "National Scholarship Portal",
        type: "government",
        benefit: "₹25,000 one-time + ₹10,000/year",
        eligibility: "First in family to attend college, income < ₹3L",
        deadline: "2026-12-01",
        educationLevel: "undergraduate",
        state: "all",
        category: "general",
        maxIncome: 300000,
        isForFirstGen: true,
        description:
          "Special grant for first-generation college students to encourage higher education in families where no member has attended college.",
        isVerified: true,
        isActive: true,
      },
    ];

    for (const s of scholarships) {
      await ctx.db.insert("scholarships", s);
    }

    // Seed colleges
    const colleges = [
      {
        name: "Indian Institute of Technology, Bombay",
        location: "Mumbai",
        state: "Maharashtra",
        courses: ["B.Tech Computer Science", "B.Tech Mechanical", "B.Tech Electrical", "B.Tech Chemical", "M.Tech various"],
        entranceExams: ["JEE Advanced", "JEE Main"],
        fees: "₹2,50,000/year",
        eligibility: "JEE Advanced qualified, Top 1000 rank",
        applicationDeadline: "2026-06-15",
        scholarshipsAvailable: ["Merit-cum-means", "Free studentship"],
        officialUrl: "https://www.iitb.ac.in",
        isVerified: true,
        description: "India's premier engineering and technology institution consistently ranked #1 in NIRF.",
        ranking: 1,
      },
      {
        name: "Indian Institute of Technology, Delhi",
        location: "New Delhi",
        state: "Delhi",
        courses: ["B.Tech Computer Science", "B.Tech Mathematics & Computing", "B.Tech EE", "M.Tech various"],
        entranceExams: ["JEE Advanced", "JEE Main"],
        fees: "₹2,40,000/year",
        eligibility: "JEE Advanced qualified",
        applicationDeadline: "2026-06-20",
        scholarshipsAvailable: ["Merit-cum-means", "Institute free studentship"],
        officialUrl: "https://www.iitd.ac.in",
        isVerified: true,
        description: "One of the oldest and most prestigious IITs, known for cutting-edge research and innovation.",
        ranking: 2,
      },
      {
        name: "BITS Pilani",
        location: "Pilani",
        state: "Rajasthan",
        courses: ["B.E. Computer Science", "B.E. Electronics", "B.Pharmacy", "M.Sc. various"],
        entranceExams: ["BITSAT"],
        fees: "₹4,00,000/year",
        eligibility: "BITSAT score 300+, 75% in PCM",
        applicationDeadline: "2026-05-31",
        scholarshipsAvailable: ["Merit scholarship", "Need-based aid"],
        officialUrl: "https://www.bits-pilani.ac.in",
        isVerified: true,
        description: "Premier private university known for its industry connect and excellent placement record.",
        ranking: 5,
      },
      {
        name: "VIT Vellore",
        location: "Vellore",
        state: "Tamil Nadu",
        courses: ["B.Tech CSE", "B.Tech ECE", "B.Tech Mech", "BCA", "MCA"],
        entranceExams: ["VITEEE"],
        fees: "₹3,50,000/year",
        eligibility: "VITEEE qualified, 60% in 12th",
        applicationDeadline: "2026-07-15",
        scholarshipsAvailable: ["VIT Merit Scholarship", "Sports scholarship"],
        officialUrl: "https://vit.ac.in",
        isVerified: true,
        description: "Deemed university with multiple campuses, known for engineering and technology programs.",
        ranking: 12,
      },
      {
        name: "Delhi University",
        location: "New Delhi",
        state: "Delhi",
        courses: ["B.A. (Hons) English", "B.Sc. (Hons) Physics", "B.Com (Hons)", "BBA", "M.A. various"],
        entranceExams: ["CUET-UG"],
        fees: "₹25,000/year",
        eligibility: "CUET-UG score based, 12th pass",
        applicationDeadline: "2026-07-01",
        scholarshipsAvailable: ["DU Merit Scholarship", "SC/ST Scholarship"],
        officialUrl: "https://www.du.ac.in",
        isVerified: true,
        description: "One of India's largest and most prestigious central universities with a vast array of programs.",
        ranking: 8,
      },
      {
        name: "SRM Institute of Science and Technology",
        location: "Chennai",
        state: "Tamil Nadu",
        courses: ["B.Tech CSE", "B.Tech AI & ML", "B.Tech Biotech", "BBA", "MBA"],
        entranceExams: ["SRMJEEE"],
        fees: "₹3,20,000/year",
        eligibility: "SRMJEEE qualified, 50% in 12th",
        applicationDeadline: "2026-06-30",
        scholarshipsAvailable: ["SRM Merit Scholarship", "Need-based aid"],
        officialUrl: "https://www.srmist.edu.in",
        isVerified: true,
        description: "Deemed university known for its modern campus, research facilities, and strong placement record.",
        ranking: 18,
      },
    ];

    for (const c of colleges) {
      await ctx.db.insert("colleges", c);
    }

    return { seeded: true };
  },
});
