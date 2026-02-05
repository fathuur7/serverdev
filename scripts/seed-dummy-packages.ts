import prisma from "../src/utils/prisma";

async function main() {
    console.log("Seeding dummy packages...");

    const packages = [
        {
            name: "Starter Home 15Mbps",
            downloadSpeedMbps: 15,
            uploadSpeedMbps: 15,
            monthlyPrice: 150000,
            slaPercentage: 98.5,
            contractDurationMonths: 12,
            description: "Paket hemat untuk kebutuhan dasar rumah tangga. Cocok untuk browsing ringan, media sosial, dan streaming SD. Ideal untuk 1-3 perangkat.",
            imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-1.2.1&auto=format&fit=crop&w=1351&q=80",
            isActive: true,
        },
        {
            name: "Family Stream 30Mbps",
            downloadSpeedMbps: 30,
            uploadSpeedMbps: 30,
            monthlyPrice: 250000,
            slaPercentage: 99.0,
            contractDurationMonths: 12,
            description: "Pilihan favorit keluarga. Nikmati streaming HD lancar tanpa buffering di beberapa perangkat sekaligus. Cocok untuk work from home.",
            imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
            isActive: true,
        },
        {
            name: "Gamer Pro 50Mbps",
            downloadSpeedMbps: 50,
            uploadSpeedMbps: 50,
            monthlyPrice: 350000,
            slaPercentage: 99.5,
            contractDurationMonths: 12,
            description: "Dirancang khusus untuk gamers. Latensi rendah, koneksi stabil, dan kecepatan tinggi untuk pengalaman gaming kompetitif terbaik.",
            imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
            isActive: true,
        },
        {
            name: "Creator Elite 100Mbps",
            downloadSpeedMbps: 100,
            uploadSpeedMbps: 100,
            monthlyPrice: 550000,
            slaPercentage: 99.8,
            contractDurationMonths: 12,
            description: "Kecepatan upload simetris untuk content creator. Upload video 4K, live streaming, dan transfer file besar dalam hitungan detik.",
            imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
            isActive: true,
        },
        {
            name: "Sultan Ultimate 1Gbps",
            downloadSpeedMbps: 1000,
            uploadSpeedMbps: 1000,
            monthlyPrice: 1500000,
            slaPercentage: 99.9,
            contractDurationMonths: 24,
            description: "Kecepatan tanpa batas untuk smart home masa depan. Streaming 8K, VR, dan server rumahan tanpa hambatan. Prioritas support tertinggi.",
            imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
            isActive: true,
        },
    ];

    for (const pkg of packages) {
        // Check if exists by name to avoid duplicates
        const existing = await prisma.package.findFirst({
            where: { name: pkg.name }
        });

        if (existing) {
            console.log(`Updating existing package: ${pkg.name}`);
            await prisma.package.update({
                where: { id: existing.id },
                data: pkg
            });
        } else {
            console.log(`Creating new package: ${pkg.name}`);
            await prisma.package.create({
                data: pkg
            });
        }
    }

    console.log("Seed completed successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
