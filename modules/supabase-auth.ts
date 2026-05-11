import { ZuploRequest, ZuploContext } from "@zuplo/runtime";

/**
 * Custom Authentication Policy that validates API Keys against Supabase.
 * Assigns users to groups (Free, Starter, etc.) based on their profile.
 */
export default async function (request: ZuploRequest, context: ZuploContext) {
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    return context.unauthorized();
  }

  // 1. Check Supabase for the API Key
  // We use the Service Role Key here to bypass RLS for validation
  // Environment variables must be set in the Zuplo Portal
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    context.log.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
    return context.internalServerError();
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/profiles?api_key=eq.${apiKey}&select=*`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`
        }
      }
    );

    const profiles = await response.json();

    if (!profiles || profiles.length === 0) {
      return context.unauthorized();
    }

    const userProfile = profiles[0];

    // 2. Populate the request.user object for downstream policies (Rate Limit/Quota)
    request.user = {
      sub: userProfile.id,
      email: userProfile.email,
      groups: [userProfile.tier]
    };

    return context.next();
  } catch (err) {
    context.log.error(`Supabase Auth Error: ${err.message}`);
    return context.internalServerError();
  }
}
