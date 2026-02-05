import { PrismaClient } from "@prisma/client";
import { InvoiceService } from "../src/services/Invoices/invoice.service";
import { addMonths, subMonths } from "date-fns";

const prisma = new PrismaClient();
const invoiceService = new InvoiceService();

async function main() {
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║     BILLING WORKER TEST                          ║");
    console.log("╚══════════════════════════════════════════════════╝\n");

    let createdSubId = "";

    try {
        console.log("1. Setup: Creating Mock Subscription eligible for billing...");

        // TARGET: We want the billing worker to think "Today + 7 days" is the billing date.
        // So validation logic: activationDate.day == (today + 7).day

        const today = new Date();
        const targetBillingDate = new Date(today);
        targetBillingDate.setDate(today.getDate() + 7); // 7 days from now

        // We set activation date to last month on this target day
        const mockActivationDate = subMonths(targetBillingDate, 1);

        console.log(`   📅 Today: ${today.toISOString().split('T')[0]}`);
        console.log(`   📅 Target Billing Date (+7d): ${targetBillingDate.toISOString().split('T')[0]}`);
        console.log(`   📅 Mock Activation Date: ${mockActivationDate.toISOString().split('T')[0]}`);

        // Get any customer and package
        const customer = await prisma.customerProfile.findFirst();
        const pkg = await prisma.package.findFirst({ where: { isActive: true } });

        if (!customer || !pkg) throw new Error("Need at least 1 customer and package to test");

        // Create ACTIVE subscription with specific activation date
        const sub = await prisma.subscriptions.create({
            data: {
                customerId: customer.id,
                packageId: pkg.id,
                serviceId: `TEST-BILL-${Date.now()}`,
                installationAddressFull: "Test Billing Address",
                geoLat: 0,
                geoLong: 0,
                photoHomeCustomer: "test.jpg",
                status: "ACTIVE",
                activationDate: mockActivationDate, // ! IMPORTANT
                contractEndDate: addMonths(new Date(), 12)
            }
        });
        createdSubId = sub.id;
        console.log(`   ✅ Created Subscription: ${sub.serviceId} (ID: ${sub.id})`);

        // 2. Run Billing Job Manualy
        console.log("\n2. Executing generateMonthlyInvoices()...");
        const result = await invoiceService.generateMonthlyInvoices();

        console.log("   📊 Result:", result);

        if (result.generated > 0) {
            console.log(`   ✅ Success! Generated ${result.generated} invoices.`);
        } else {
            console.log("   ⚠️ No invoices generated. Requirements mismatch?");
        }

        // 3. Verify Invoice Exists
        console.log("\n3. Verifying Invoice in Database...");
        const invoice = await prisma.invoice.findFirst({
            where: {
                subscriptionId: sub.id,
                status: "UNPAID"
            },
            orderBy: { id: "desc" }
        });

        if (invoice) {
            console.log(`   ✅ Invoice Found! Number: ${invoice.invoiceNumber}`);
            console.log(`      Amount: ${invoice.totalAmount}`);
            console.log(`      Due Date: ${invoice.dueDate.toISOString().split('T')[0]}`);
            // Verification
            const expectedDueDate = new Date(targetBillingDate);
            expectedDueDate.setDate(expectedDueDate.getDate() + 7);

            // Simple check if it's future
            if (invoice.dueDate > today) {
                console.log("      ✅ Due Date is in the future (Correct)");
            }
        } else {
            console.log("   ❌ Invoice NOT found for this subscription.");
        }

    } catch (error) {
        console.error("❌ TEST FAILED:", error);
    } finally {
        // Cleanup
        if (createdSubId) {
            console.log("\n🧹 Cleanup...");
            // Delete invoice first
            await prisma.invoice.deleteMany({ where: { subscriptionId: createdSubId } });
            await prisma.subscriptions.delete({ where: { id: createdSubId } });
            console.log("   ✅ Test data deleted");
        }
        await prisma.$disconnect();
    }
}

main();
