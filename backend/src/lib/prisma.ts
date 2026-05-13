let prisma: any;

try {
  // Use a dynamic import to avoid crashes if @prisma/client doesn't have the export yet
  const { PrismaClient } = await import('@prisma/client');
  prisma = new PrismaClient();
} catch (e) {
  console.warn('⚠️ Prisma Client not found or not generated. Backend will run in restricted mode.');
  console.warn('Please run "npx prisma generate" to fix this.');
  
  // Create a proxy that throws descriptive errors instead of crashing the server on boot
  prisma = new Proxy({}, {
    get: (target, prop) => {
      return (...args: any[]) => {
        const errorMsg = `Prisma Client is not generated. (Property requested: ${String(prop)}). Please run "npx prisma generate" and "npx prisma db push".`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      };
    }
  });
}

export default prisma;

