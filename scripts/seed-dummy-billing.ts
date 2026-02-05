
import prisma from "../src/utils/prisma";
import { addDays } from "date-fns";

async function main() {
    console.log("🌱 Seeding Dummy Subscription for Billing Test...");

    // 1. Calculate Target Date (H+7 from today)
    // MATCH LOGIC WITH InvoiceService (Local Time)
    const today = new Date();
    const targetDay = new Date(today);
    targetDay.setDate(targetDay.getDate() + 7);

    console.log(`📅 Today: ${today.toISOString()} (Local Date: ${today.getDate()})`);
    console.log(`🎯 Target Billing Date (activations on this day): ${targetDay.toISOString()} (Local Date: ${targetDay.getDate()})`);

    // 2. Create Dummy User & Data
    const email = `test.billing.${Date.now()}@example.com`;

    // Create Package if not exists
    let pkg = await prisma.package.findFirst();
    if (!pkg) {
        pkg = await prisma.package.create({
            data: {
                name: "Test Package 50Mbps",
                downloadSpeedMbps: 50,
                uploadSpeedMbps: 10,
                monthlyPrice: 250000,
                slaPercentage: 99.5,
                contractDurationMonths: 12,
                isActive: true
            }
        });
    }

    // Create User
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash: "dummy_hash",
            role: "CUSTOMER",
            status: "ACTIVE",
            emailVerified: true
        }
    });

    // Create Profile
    const profile = await prisma.customerProfile.create({
        data: {
            userId: user.id,
            fullName: "Test Billing User",
            nik: `NIK${Date.now()}`,
            phoneNumber: "08123456789",
            address: "Test Address",
            city: "Test City"
        }
    });

    // 3. Create Subscription matching criteria
    // PROBLEM: Node uses Local Day (e.g. 31), but DB stores JS Date as UTC.
    // If we use new Date() it might set UTC time such that the Day is 30.
    // We MUST force the UTC Day to match the Local Target Day.

    const targetDateNum = targetDay.getDate();

    // Construct a UTC string: 2025-12-{DD}T12:00:00.000Z
    // This effectively forces the 'Day' column in Postgres (extracted from UTC) to match targetDateNum.
    const safeDay = targetDateNum.toString().padStart(2, '0');
    // Use Dec 2025 as it has 31 days, safe for any day number.
    const isoString = `2025-12-${safeDay}T12:00:00.000Z`;

    const activationDate = new Date(isoString);

    console.log(`   Force-Constructed UTC Date: ${isoString}`);
    console.log(`   (Guaranteed to be Day ${targetDateNum} in UTC for DB Extraction)`);

    const sub = await prisma.subscriptions.create({
        data: {
            customerId: profile.id,
            packageId: pkg.id,
            serviceId: `TEST-BILLING-${Date.now()}`,
            status: "ACTIVE",
            activationDate: activationDate,
            contractEndDate: addDays(activationDate, 365),
            installationAddressFull: "Test Address",
            geoLat: 0,
            geoLong: 0,
            photoHomeCustomer: "dummy.jpg"
        }
    });

    console.log(`✅ Created Subscription: ${sub.id}`);
    console.log(`   Service ID: ${sub.serviceId}`);
    console.log(`   Activation Date: ${sub.activationDate?.toISOString()}`);
    console.log(`   (Should match EXTRACT(DAY) = ${targetDateNum} in Backend Query)`);
    console.log("\n🚀 Now checking generation logic...");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
