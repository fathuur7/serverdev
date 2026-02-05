import prisma from "../src/utils/prisma";

async function main() {
    console.log("Updating Test Package 10Mbps...");

    // Find existing Test Package
    const existing = await prisma.package.findFirst({
        where: { name: "Test Package 10Mbps" }
    });

    if (existing) {
        await prisma.package.update({
            where: { id: existing.id },
            data: {
                description: "Paket uji coba untuk development. Cocok untuk testing dan debugging. Low latency connection.",
                imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
            }
        });
        console.log("Test Package updated successfully!");
    } else {
        console.log("Test Package not found");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
