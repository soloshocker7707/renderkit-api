import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

export default async function (
  request: ZuploRequest,
  context: ZuploContext,
  options: any,
  policyName: string
) {
  const secret = process.env.SECRET_ZUPLO || "";
  
  request.headers.set("x-zuplo-secret", secret.trim());
  return request;
}
