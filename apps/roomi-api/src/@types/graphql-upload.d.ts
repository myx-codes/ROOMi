declare module 'graphql-upload' {
  // Minimal typing for the middleware used in main.ts
  export function graphqlUploadExpress(options?: Record<string, any>): any;
}

