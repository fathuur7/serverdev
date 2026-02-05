const BASE_URL = "http://localhost:3000/api";

async function main() {
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║     SUBSCRIPTION SUCCESS FLOW TEST               ║");
    console.log("╚══════════════════════════════════════════════════╝\n");

    try {
        // 1. Setup Data via Server Endpoint
        console.log("1. Setting up Test Data (Admin, Customer, Package)...");
        const setupRes = await fetch(`${BASE_URL}/test/setup`, {
            method: "POST"
        });
        const setupData = await setupRes.json();

        if (!setupData.success) {
            throw new Error(`Setup failed: ${JSON.stringify(setupData)}`);
        }

        const { admin, customer, package: pkg } = setupData.data;
        const adminToken = admin.token;
        const custToken = customer.token;

        console.log(`   ✅ Admin: ${admin.email}`);
        console.log(`   ✅ Customer: ${customer.email}`);
        console.log(`   📦 Package: ${pkg.name}`);

        // 2. Create Customer Profile
        console.log("\n2. Creating Customer Profile...");
        const profileRes = await fetch(`${BASE_URL}/auth/customer-profile`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${custToken}`
            },
            body: JSON.stringify({
                fullName: "Test Customer",
                nik: Math.random().toString().slice(2, 18), // Random 16 digits
                phoneNumber: "08123456789",
                address: "Jl. Test No. 123",
                city: "Jakarta",
            }),
        });
        const profileData = await profileRes.json();

        if (!profileData.success) {
            // Maybe profile already exists if user reused? ignoring for now as setup creates fresh user
            console.log("   ⚠️ Profile creation note:", profileData.message);
        } else {
            console.log("   ✅ Profile Created");
        }

        // We need customerId (CustomerProfile ID)
        // Since we don't have direct access, let's assume we can query it via admin or just use the user we just made?
        // Wait, createSubscription needs `customerId` (Profile ID), not `userId`.
        // We can get it by calling `GET /auth/profile` with customer token!

        const custProfileRes = await fetch(`${BASE_URL}/auth/profile`, {
            headers: { "Authorization": `Bearer ${custToken}` }
        });
        const custProfileData = await custProfileRes.json();
        const customerId = custProfileData.data.id;
        console.log(`   ✅ Got Customer Profile ID: ${customerId}`);

        // 3. Create Subscription (Admin Only)
        console.log("\n3. TEST: Create Subscription (Prepaid Flow)...");
        const createSubRes = await fetch(`${BASE_URL}/subscriptions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                customerId: customerId,
                packageId: pkg.id,
                installationAddressFull: "Jl. Baru No. 1",
                geoLat: -6.2,
                geoLong: 106.8,
                photoHomeCustomer: "http://img.com/home.jpg"
            }),
        });
        const subData = await createSubRes.json();

        if (!subData.success) {
            console.log("   ❌ Failed:", JSON.stringify(subData, null, 2));
            return;
        }

        console.log("   ✅ Subscription Created!");
        console.log(`      ID: ${subData.data.subscription.id}`);
        console.log(`      Status: ${subData.data.subscription.status}`);

        if (subData.data.firstInvoice) {
            console.log(`      First Invoice: ${subData.data.firstInvoice.invoiceNumber}`);
            console.log(`      Status: ${subData.data.firstInvoice.status} (Expected: PAID for prepaid)`);
            console.log(`      Amount: ${subData.data.firstInvoice.totalAmount}`);
        } else {
            console.log("   ❌ Missing First Invoice in response!");
        }

        const subscriptionId = subData.data.subscription.id;

        // 4. Activate Subscription
        console.log("\n4. TEST: Activate Subscription...");
        const activateRes = await fetch(`${BASE_URL}/subscriptions/${subscriptionId}/activate`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
        });
        const activeData = await activateRes.json();

        if (!activeData.success) {
            console.log("   ❌ Failed:", activeData);
        } else {
            console.log("   ✅ Subscription Activated!");
            console.log(`      Status: ${activeData.data.status}`);
            console.log(`      Activation Date: ${activeData.data.activationDate}`);
            console.log(`      Contract End: ${activeData.data.contractEndDate}`);
        }

    } catch (error) {
        console.error("\n❌ TEST FAILED:", error);
    }
}

main();
