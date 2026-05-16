import { ZuploRequest, ZuploContext } from "@zuplo/runtime";

export default async function (request: ZuploRequest, context: ZuploContext) {
  // Handle Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-api-key, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // For other requests, the headers will be added by the response
  const response = await context.next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
}
