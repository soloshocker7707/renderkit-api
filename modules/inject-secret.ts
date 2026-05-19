import { ZuploContext, ZuploRequest, environment } from "@zuplo/runtime";

export default async function (
  request: ZuploRequest,
  context: ZuploContext,
  options: any,
  policyName: string
) {
  const secret = (environment as any).SECRET_ZUPLO || "";
  
  request.headers.set("x-zuplo-secret", secret.trim());
  return request;
}
