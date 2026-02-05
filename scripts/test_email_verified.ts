import prisma from "../src/utils/prisma";

const BASE_URL = "http://localhost:3000/api";

async function testSetEmailVerified() {
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║     TEST: PATCH /auth/user/:id/verify            ║");
    console.log("╚══════════════════════════════════════════════════╝\n");

    const email = `verify_test_${Date.now()}@test.com`;
    const password = "password123";

    // 1. Register user
    console.log("1. Register new user...");
    let res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const registerData = await res.json();
    const newUserId = registerData.data?.id;
    console.log(`   User ID: ${newUserId}, emailVerified: false`);

    // 2. Create admin user
    console.log("\n2. Creating admin user...");
    const adminEmail = `admin_${Date.now()}@test.com`;
    await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password }),
    });
    await prisma.user.update({
        where: { email: adminEmail },
        data: { emailVerified: true, role: "ADMIN", otp: null, otpExpiresAt: null },
    });

    // 3. Login as admin
    console.log("\n3. Login as admin...");
    res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password }),
    });
    const loginData = await res.json();
    const adminToken = loginData.data?.accessToken;
    console.log(`   Admin Token: ${adminToken ? "Received ✅" : "Missing ❌"}`);

    // 4. PATCH /auth/user/:id/verify (set to true)
    console.log(`\n4. PATCH /auth/user/${newUserId}/verify (verified: true)`);
    res = await fetch(`${BASE_URL}/auth/user/${newUserId}/verify`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ verified: true }),
    });
    const verifyData = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 200 ? "✅" : "❌"}`);
    console.log(`   Response: ${JSON.stringify(verifyData)}`);

    // 5. Verify user can now login
    console.log("\n5. Verify user can now login...");
    res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const userLoginData = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 200 ? "✅" : "❌"}`);
    console.log(`   Can login: ${userLoginData.success ? "YES ✅" : "NO ❌"}`);

    // 6. PATCH /auth/user/:id/verify (set to false)
    console.log(`\n6. PATCH /auth/user/${newUserId}/verify (verified: false)`);
    res = await fetch(`${BASE_URL}/auth/user/${newUserId}/verify`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ verified: false }),
    });
    const unverifyData = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 200 ? "✅" : "❌"}`);

    // 7. User should NOT be able to login now
    console.log("\n7. User should NOT be able to login now...");
    res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const blockedData = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 401 ? "✅ (correctly blocked)" : "❌"}`);
    console.log(`   Message: ${blockedData.message}`);

    console.log("\n╔══════════════════════════════════════════════════╗");
    console.log("║           TEST COMPLETE ✅                       ║");
    console.log("╚══════════════════════════════════════════════════╝");

    process.exit(0);
}

testSetEmailVerified();
