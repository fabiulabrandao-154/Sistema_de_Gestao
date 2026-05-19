import { PrismaClient } from '@prisma/client/edge';
import { Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL not found. Prisma may fail until it is provided.");
}

const pool = new Pool({ connectionString: connectionString || "" });
const adapter = new PrismaNeon(pool);

// O cliente Edge exige que você passe o adapter e inicialize sem buscar binários locais
const prisma = new PrismaClient({ adapter });

export default prisma;
