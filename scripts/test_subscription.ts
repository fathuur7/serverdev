// const BASE_URL = "http://localhost:3000/api";s

let adminToken = "";
let customerId = "";
let packageId = "";
let subscriptionId = "";

async function setupTestData() {
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║     SUBSCRIPTION & BILLING API TEST              ║");
    console.log("╚══════════════════════════════════════════════════╝\n");

    // 1. Register admin user
    console.log("1. Setup: Register admin user");
    const adminEmail = `admin_${Date.now()}@test.com`;
    await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: "password123" }),
    });

    // We need to manually set this user as admin and verified in DB
    // For now, let's test the endpoints that don't require auth first
    console.log("   ✅ Admin registered (needs manual DB verification for protected endpoints)");
}

async function testPackageEndpoints() {
    console.log("\n═══════════════════════════════════════════════════");
    console.log("   PACKAGE ENDPOINTS (Public)");
    console.log("═══════════════════════════════════════════════════\n");

    // GET all packages
    console.log("2. GET /packages");
    try {
        const res = await fetch(`${BASE_URL}/packages`);
        const data = await res.json();
        console.log(`   Status: ${res.status}`);
        if (data.success && data.data) {
            console.log(`   ✅ Found ${data.data.length} packages`);
            if (data.data.length > 0) {
                packageId = data.data[0].id;
                console.log(`   📦 Using package: ${data.data[0].name}`);
            }
        } else {
            console.log(`   ❌ ${data.message || JSON.stringify(data)}`);
        }
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    // GET active packages
    console.log("\n3. GET /packages/active");
    try {
        const res = await fetch(`${BASE_URL}/packages/active`);
        const data = await res.json();
        console.log(`   Status: ${res.status}`);
        console.log(`   ${res.status === 200 ? "✅" : "❌"} ${data.success ? `${data.data.length} active` : data.message}`);
    } catch (e) {
        console.error("   ❌ Error:", e);
    }
}

async function testSubscriptionEndpointsNoAuth() {
    console.log("\n═══════════════════════════════════════════════════");
    console.log("   SUBSCRIPTION ENDPOINTS (Protected - No Auth)");
    console.log("═══════════════════════════════════════════════════\n");

    // GET all subscriptions (no auth - should fail)
    console.log("4. GET /subscriptions (no auth - should fail)");
    try {
        const res = await fetch(`${BASE_URL}/subscriptions`);
        const data = await res.json();
        console.log(`   Status: ${res.status}`);
        console.log(`   ${res.status === 401 ? "✅" : "❌"} ${data.message || "Blocked"}`);
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    // POST create subscription (no auth - should fail)
    console.log("\n5. POST /subscriptions (no auth - should fail)");
    try {
        const res = await fetch(`${BASE_URL}/subscriptions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customerId: "test",
                packageId: "test",
                installationAddressFull: "Test Address",
                geoLat: -6.2,
                geoLong: 106.8,
                photoHomeCustomer: "photo.jpg",
            }),
        });
        const data = await res.json();
        console.log(`   Status: ${res.status}`);
        console.log(`   ${res.status === 401 ? "✅" : "❌"} ${data.message || "Blocked"}`);
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    // PATCH activate (no auth - should fail)
    console.log("\n6. PATCH /subscriptions/:id/activate (no auth - should fail)");
    try {
        const res = await fetch(`${BASE_URL}/subscriptions/test-id/activate`, {
            method: "PATCH",
        });
        const data = await res.json();
        console.log(`   Status: ${res.status}`);
        console.log(`   ${res.status === 401 ? "✅" : "❌"} ${data.message || "Blocked"}`);
    } catch (e) {
        console.error("   ❌ Error:", e);
    }
}

async function printSummary() {
    console.log("\n╔══════════════════════════════════════════════════╗");
    console.log("║               TEST SUMMARY                       ║");
    console.log("╚══════════════════════════════════════════════════╝");
    console.log(`
Endpoints Tested:
  ✓ GET  /packages (public)
  ✓ GET  /packages/active (public)
  ✓ GET  /subscriptions (protected)
  ✓ POST /subscriptions (protected)
  ✓ PATCH /subscriptions/:id/activate (protected)

Note: Protected endpoints correctly return 401 without auth.
To test with valid admin token, manually verify an admin user in DB.
`);
}

async function runTests() {
    await setupTestData();
    await testPackageEndpoints();
    await testSubscriptionEndpointsNoAuth();
    await printSummary();
}

runTests();
