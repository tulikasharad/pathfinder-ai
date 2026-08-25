import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
      // CollegePath extended fields
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
      onboardingCompleted: v.optional(v.boolean()),
    }).index("email", ["email"]),

    scholarships: defineTable({
      name: v.string(),
      provider: v.string(),
      type: v.string(), // government, educational, private
      benefit: v.string(),
      eligibility: v.string(),
      deadline: v.string(),
      educationLevel: v.string(),
      state: v.string(),
      category: v.string(),
      minScore: v.optional(v.number()),
      maxIncome: v.optional(v.number()),
      gender: v.optional(v.string()),
      isForDisabled: v.optional(v.boolean()),
      isForMinority: v.optional(v.boolean()),
      isForFirstGen: v.optional(v.boolean()),
      description: v.string(),
      officialUrl: v.optional(v.string()),
      isVerified: v.boolean(),
      isActive: v.boolean(),
    }).index("by_active", ["isActive"]).index("by_type", ["type"]),

    colleges: defineTable({
      name: v.string(),
      location: v.string(),
      state: v.string(),
      courses: v.array(v.string()),
      entranceExams: v.array(v.string()),
      fees: v.string(),
      eligibility: v.string(),
      applicationDeadline: v.string(),
      scholarshipsAvailable: v.array(v.string()),
      officialUrl: v.optional(v.string()),
      isVerified: v.boolean(),
      description: v.string(),
      imageUrl: v.optional(v.string()),
      ranking: v.optional(v.number()),
    }).index("by_state", ["state"]).index("by_verified", ["isVerified"]),

    applications: defineTable({
      userId: v.string(),
      scholarshipId: v.optional(v.string()),
      collegeId: v.optional(v.string()),
      type: v.string(), // "scholarship" | "college"
      name: v.string(),
      status: v.string(), // interested, preparing, started, applied, selected, not_selected
      deadline: v.string(),
      notes: v.optional(v.string()),
      documents: v.optional(v.array(v.string())),
    }).index("by_user", ["userId"]).index("by_status", ["status"]),

    bookmarks: defineTable({
      userId: v.string(),
      itemType: v.string(), // "scholarship" | "college"
      itemId: v.string(),
    }).index("by_user", ["userId"]).index("by_item", ["itemType", "itemId"]),

    notifications: defineTable({
      userId: v.string(),
      title: v.string(),
      message: v.string(),
      type: v.string(), // deadline, update, reminder, new_scholarship
      isRead: v.boolean(),
      actionUrl: v.optional(v.string()),
    }).index("by_user", ["userId"]).index("by_read", ["userId", "isRead"]),

    deadlines: defineTable({
      userId: v.string(),
      title: v.string(),
      date: v.string(),
      type: v.string(), // exam, application, scholarship, document
      priority: v.string(), // urgent, high, medium, low
      isCompleted: v.boolean(),
      relatedItemId: v.optional(v.string()),
    }).index("by_user", ["userId"]).index("by_date", ["date"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
