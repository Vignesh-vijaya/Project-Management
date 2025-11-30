import 'dotenv/config'; // Load env vars
import { defineConfig } from '@prisma/config';

export default defineConfig({
  // FIX: Use singular 'datasource'
  datasource: {
    // This connects to the DIRECT_URL (required for migrations/push)
    url: process.env.DIRECT_URL,
  },
});