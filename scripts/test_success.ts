import prisma from "../src/utils/prisma";

const BASE_URL = "http://localhost:3000/api";

let accessToken = "";
let userId = "";

async function testAllSuccess() {
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║      FULL SUCCESS API TEST (201/200)             ║");
    console.log("╚══════════════════════════════════════════════════╝\n");

    const testEmail = `success_${Date.now()}@test.com`;
    const password = "password123";

    // ═══════════════════════════════════════════════════
    // 1. REGISTER
    // ═══════════════════════════════════════════════════
    console.log("1. POST /auth/register");
    try {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: testEmail, password }),
        });
        const data = await res.json();
        console.log(`   Status: ${res.status} ${res.status === 201 ? "✅" : "❌"}`);
        userId = data.data?.id;
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    // ═══════════════════════════════════════════════════
    // 2. BYPASS OTP - Manually verify email in DB
    // ═══════════════════════════════════════════════════
    console.log("\n2. [DB] Manually verifying email...");
    try {
        await prisma.user.update({
            where: { email: testEmail },
            data: { emailVerified: true, otp: null, otpExpiresAt: null },
        });
        console.log("   ✅ Email verified in DB");
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    // ═══════════════════════════════════════════════════
    // 3. LOGIN
    // ═══════════════════════════════════════════════════
    console.log("\n3. POST /auth/login");
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: testEmail, password }),
        });
        const data = await res.json();
        console.log(`   Status: ${res.status} ${res.status === 200 ? "✅" : "❌"}`);
        accessToken = data.data?.accessToken;
        console.log(`   Token: ${accessToken ? "Received ✅" : "Missing ❌"}`);
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    const authHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
    };

    // ═══════════════════════════════════════════════════
    // 4. CREATE CUSTOMER PROFILE
    // ═══════════════════════════════════════════════════
    console.log("\n4. POST /auth/customer-profile");
    try {
        const res = await fetch(`${BASE_URL}/auth/customer-profile`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                fullName: "Test User",
                nik: Date.now().toString().slice(-16).padStart(16, '0'),
                phoneNumber: "08123456789",
            }),
        });
        const data = await res.json();
        console.log(`   Status: ${res.status} ${res.status === 201 ? "✅" : "❌"}`);
        if (!data.success) console.log(`   Message: ${data.message}`);
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    // ═══════════════════════════════════════════════════
    // 5. GET PROFILE
    // ═══════════════════════════════════════════════════
    console.log("\n5. GET /auth/profile");
    try {
        const res = await fetch(`${BASE_URL}/auth/profile`, {
            headers: authHeaders,
        });
        const data = await res.json();
        console.log(`   Status: ${res.status} ${res.status === 200 ? "✅" : "❌"}`);
        if (data.data) console.log(`   Profile: ${data.data.fullName}`);
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    // ═══════════════════════════════════════════════════
    // 6. UPDATE PROFILE
    // ═══════════════════════════════════════════════════
    console.log("\n6. PUT /auth/profile");
    try {
        const res = await fetch(`${BASE_URL}/auth/profile`, {
            method: "PUT",
            headers: authHeaders,
            body: JSON.stringify({
                fullName: "Updated Test User",
                city: "Jakarta",
            }),
        });
        const data = await res.json();
        console.log(`   Status: ${res.status} ${res.status === 200 ? "✅" : "❌"}`);
        if (data.data) console.log(`   Updated: ${data.data.fullName}, ${data.data.city}`);
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    // ═══════════════════════════════════════════════════
    // 7. GET USER (need ADMIN/TECHNICIAN role)
    // ═══════════════════════════════════════════════════
    console.log("\n7. GET /auth/user (as CUSTOMER - should be 403)");
    try {
        const res = await fetch(`${BASE_URL}/auth/user`, {
            headers: authHeaders,
        });
        const data = await res.json();
        console.log(`   Status: ${res.status} ${res.status === 403 ? "✅ (Forbidden for CUSTOMER)" : "❌"}`);
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    // ═══════════════════════════════════════════════════
    // 8. Upgrade to ADMIN and test /user
    // ═══════════════════════════════════════════════════
    console.log("\n8. [DB] Upgrading user to ADMIN...");
    try {
        await prisma.user.update({
            where: { email: testEmail },
            data: { role: "ADMIN" },
        });
        console.log("   ✅ User upgraded to ADMIN");
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    // Re-login to get new token with ADMIN role
    console.log("\n9. POST /auth/login (as ADMIN)");
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: testEmail, password }),
        });
        const data = await res.json();
        accessToken = data.data?.accessToken;
        console.log(`   Status: ${res.status} ✅`);
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    console.log("\n10. GET /auth/user (as ADMIN)");
    try {
        const res = await fetch(`${BASE_URL}/auth/user`, {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            },
        });
        const data = await res.json();
        console.log(`   Status: ${res.status} ${res.status === 200 ? "✅" : "❌"}`);
        if (data.data) {
            console.log(` customer : ${JSON.stringify(data)}`);
        } else {
            console.log(`   Response: ${JSON.stringify(data)}`);
        }
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    console.log("\n╔══════════════════════════════════════════════════╗");
    console.log("║           ALL TESTS COMPLETE ✅                  ║");
    console.log("╚══════════════════════════════════════════════════╝");

    process.exit(0);
}

testAllSuccess();
