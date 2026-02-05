
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
});

async function main() {
    console.log("Connecting to DB...");
    try {
        // Find PAID invoices without payments
        const invoices = await prisma.invoice.findMany({
            where: { status: 'PAID' },
            include: { payments: true }
        });

        console.log(`Found ${invoices.length} PAID invoices.`);

        for (const inv of invoices) {
            console.log(`Checking Invoice: ${inv.invoiceNumber}`);
            if (inv.payments.length === 0) {
                console.log(` --> Missing Payment record. Creating...`);
                // Create dummy payment record based on invoice details
                await prisma.payment.create({
                    data: {
                        invoiceId: inv.id,
                        amountPaid: inv.totalAmount,
                        paymentMethod: 'manual_backfill', // or default
                        paidAt: new Date(), // or now
                        paymentGatewayTrxId: 'BACKFILL-' + inv.invoiceNumber
                    }
                });
                console.log(`   ✅ Created Payment for ${inv.invoiceNumber}`);
            } else {
                console.log(` --> Has ${inv.payments.length} payment(s). OK.`);
            }
        }

    } catch (e) {
        console.error("Error executing backfill:", e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
