import { PrismaClient } from '@prisma/client';
import { Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL not found. Prisma may fail until it is provided.");
}

// Configuração do Driver Adapter para o Neon usando WebSocket (Pool)
// Isso é o padrão recomendado para ambientes que não suportam binários nativos
const pool = new Pool({ connectionString: connectionString || "" });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter } as any);

export default prisma;
