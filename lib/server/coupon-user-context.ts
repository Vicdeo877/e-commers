import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Snapshot used to decide if a coupon’s audience rules apply. */
export type CouponUserContext = {
  kind: "guest" | "user";
  userId: number | null;
  lifetimeOrderCount: number;
  accountAgeDays: number;
};

export async function getCouponUserContext(user: User | null): Promise<CouponUserContext> {
  if (!user) {
    return { kind: "guest", userId: null, lifetimeOrderCount: 0, accountAgeDays: 0 };
  }
  const count = await prisma.order.count({
    where: {
      userId: user.id,
      orderStatus: { notIn: ["cancelled", "returned"] },
    },
  });
  const ms = Date.now() - user.createdAt.getTime();
  const accountAgeDays = Math.max(0, Math.floor(ms / 86_400_000));
  return {
    kind: "user",
    userId: user.id,
    lifetimeOrderCount: count,
    accountAgeDays,
  };
}

/** Human-readable label for analytics / UI. */
export function describeUserSegment(ctx: CouponUserContext): string {
  if (ctx.kind === "guest") return "guest";
  if (ctx.lifetimeOrderCount === 0) return "new_customer";
  if (ctx.lifetimeOrderCount <= 3) return "mid_customer";
  return "returning_customer";
}
