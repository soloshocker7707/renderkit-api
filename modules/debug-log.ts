import { ZuploRequest, ZuploContext } from "@zuplo/runtime";

export default async function (request: ZuploRequest, context: ZuploContext) {
  context.log.info(`--- INBOUND PIPELINE COMPLETE ---`);
  context.log.info(`User: ${JSON.stringify(request.user)}`);
  context.log.info(`Groups: ${JSON.stringify(request.user?.groups)}`);
  return request;
}
