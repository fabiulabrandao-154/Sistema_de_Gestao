let PrismaClient;
try {
  const prismaClientModule = await import('@prisma/client');
  PrismaClient = prismaClientModule.PrismaClient;
} catch (e) {
  console.error('PrismaClient could not be imported. Make sure to run "npx prisma generate".');
  // Fallback to a mock or just throw a better message
  PrismaClient = class {
    constructor() {
      throw new Error('PrismaClient is not generated. Please run "npx prisma generate" first.');
    }
  };
}

const prisma = new PrismaClient();

export default prisma;
