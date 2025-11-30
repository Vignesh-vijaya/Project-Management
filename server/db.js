import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

// Required for Neon serverless driver to work in Node.js
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);

export const prisma = new PrismaClient({ adapter });