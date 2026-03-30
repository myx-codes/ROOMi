import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  ignoreNoDocuments: true,
  // Backend GraphQL API manzili (masalan: hasura, nestjs yoki boshqa backend manzili)
  schema: process.env.CODEGEN_SCHEMA_URL || "http://localhost:3005/graphql",
  
  // Frontend'dagi o'zingiz yozgan query va mutation fayllarini qidirish yo'li
  documents: [
    "src/**/*.graphql",
    "src/**/*.gql",
    "apps/**/src/**/*.graphql",
    "apps/**/src/**/*.gql"
  ], 
  
  generates: {
    // Generatsiya qilingan kod qayerga saqlanishi
    "src/generated/graphql.tsx": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo" // React hooklarni avtomatik yaratish uchun
      ],
      config: {
        withHooks: true, // Hooklar yaratilishini faollashtirish
      }
    }
  }
};

export default config;