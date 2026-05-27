declare const process: {
  env: Record<string, string | undefined>;
};

declare module '@zuplo/runtime' {
  export type ZuploRequest = Request & {
    user?: {
      sub?: string;
      data?: {
        email?: string;
        groups?: string[];
      };
    };
  };

  export type ZuploContext = {
    log: {
      info: (...args: any[]) => void;
      error: (...args: any[]) => void;
      warn?: (...args: any[]) => void;
    };
  };

  export class ServiceProviderImpl {}
  export class Handler {
    constructor(...args: any[]);
    requestHandler(request: Request, env: any, ctx: any): Promise<Response> | Response;
  }

  export const environment: Record<string, string | undefined>;
}

declare module 'zuplo:routes' {
  const routes: any;
  export default routes;
}

declare module 'zuplo:schema-validations' {
  const schemaValidations: any;
  export = schemaValidations;
}

declare module 'zuplo:runtime-extension' {
  export const runtimeInit: any;
}

declare module 'zuplo:runtime-settings' {
  const runtimeSettings: any;
  export default runtimeSettings;
}
