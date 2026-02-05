import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Connecting to DB...");
        const count = await prisma.user.count();
        console.log("✅ Successfully connected!");
        console.log("User count:", count);
    } catch (e) {
        console.error("❌ Connection failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
