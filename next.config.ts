import type { NextConfig } from 'next';
const config: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ['@libsql/client'],
  outputFileTracingIncludes: {
    '/api/graveyard': ['./data/graveyard/**'],
    '/api/workspace': ['./data/graveyard/**'],
  },
};
export default config;
