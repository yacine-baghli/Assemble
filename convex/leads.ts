import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Capture an email from the public teaser funnel (Phase 0).
export const capture = mutation({
  args: {
    email: v.string(),
    projectId: v.optional(v.id("projects")),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new Error("Invalid email");
    }
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    let userId = existing?._id;
    if (!existing) {
      userId = await ctx.db.insert("users", {
        email,
        plan: "free",
        source: args.source ?? "teaser",
        createdAt: Date.now(),
      });
      await ctx.db.insert("usage", {
        userId,
        projectCount: 0,
        revealedBestFit: false,
      });
    }

    // Link the teaser project to this lead.
    if (args.projectId && userId) {
      const project = await ctx.db.get(args.projectId);
      if (project && !project.userId) {
        await ctx.db.patch(args.projectId, { userId });
      }
    }
    return { userId, isNew: !existing };
  },
});

// Read-only feed for the mentor / analytics proof.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").order("desc").take(100);
    return users.map((u) => ({
      email: u.email,
      plan: u.plan,
      source: u.source ?? "teaser",
      createdAt: u.createdAt,
    }));
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.length;
  },
});
