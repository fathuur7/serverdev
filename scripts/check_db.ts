import prisma from "../src/utils/prisma";

async function main() {
    try {
        const usersCols = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'users';`;
        console.log("USERS:", JSON.stringify(usersCols));

        const profileCols = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'customer_profiles';`;
        console.log("PROFILES:", JSON.stringify(profileCols));
    } catch (e) {
        console.error(e);
    }
}

main().finally(() => prisma.$disconnect());
