import { ZuploRequest, ZuploContext } from "@zuplo/runtime";

/**
 * Tier configurations matching Dodo Payments plans.
 * Dodo plan names = Zuplo consumer group names (no mapping needed).
 */
const TIER_CONFIGS = {
  Free: {
    monthly_limit: 250,
    rpm: 2
  },
  Starter: {
    monthly_limit: 10000,
    rpm: 30
  },
  Expert: {
    monthly_limit: 50000,
    rpm: 120
  },
  Enterprise: {
    monthly_limit: 100000,
    rpm: 300
  }
};

export type TierName = keyof typeof TIER_CONFIGS;

/**
 * Returns the active tier name from the user's groups.
 * Falls back to Free if no matching tier group is found.
 */
function getActiveTier(request: ZuploRequest, context: ZuploContext): TierName {
  const groups = request.user?.data?.groups || [];
  context.log.info(`User groups: ${JSON.stringify(groups)}`);

  // Find the highest tier the user belongs to
  const tierOrder: TierName[] = ["Enterprise", "Expert", "Starter", "Free"];
  for (const tier of tierOrder) {
    if (groups.includes(tier)) {
      return tier;
    }
  }

  // Default to Free for unauthenticated or unknown users
  return "Free";
}

export function getRateLimit(request: ZuploRequest, context: ZuploContext) {
  const activeTier = getActiveTier(request, context);
  const config = TIER_CONFIGS[activeTier];

  context.log.info(`Rate limit applied: Tier=${activeTier}, RPM=${config.rpm}`);

  return {
    key: request.user?.sub || request.headers.get("true-client-ip") || "anonymous",
    requestsAllowed: config.rpm,
    timeWindowMinutes: 1
  };
}

export function getQuota(request: ZuploRequest, context: ZuploContext) {
  const activeTier = getActiveTier(request, context);
  const config = TIER_CONFIGS[activeTier];

  context.log.info(`Quota applied: Tier=${activeTier}, Monthly=${config.monthly_limit}`);

  return {
    key: request.user?.sub || request.headers.get("true-client-ip") || "anonymous",
    requestsAllowed: config.monthly_limit,
    timeWindowMinutes: 43200 // 30 days in minutes
  };
}