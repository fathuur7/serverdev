import prisma from "../src/utils/prisma";

const BASE_URL = "http://localhost:3000/api";

async function testRefreshToken() {
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║     TEST: REFRESH TOKEN FLOW                     ║");
    console.log("╚══════════════════════════════════════════════════╝\n");

    const email = `refresh_${Date.now()}@test.com`;
    const password = "password123";

    // 1. Register user
    console.log("1. POST /auth/register");
    let res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    console.log(`   Status: ${res.status} ${res.status === 201 ? "✅" : "❌"}`);

    // 2. Verify email in DB (bypass OTP)
    console.log("\n2. [DB] Verifying email...");
    await prisma.user.update({
        where: { email },
        data: { emailVerified: true, otp: null, otpExpiresAt: null },
    });
    console.log("   ✅ Email verified");

    // 3. Login and get tokens
    console.log("\n3. POST /auth/login");
    res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const loginData = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 200 ? "✅" : "❌"}`);
    console.log(`   Access Token: ${loginData.data?.accessToken ? "✅ Received" : "❌ Missing"}`);
    console.log(`   Refresh Token: ${loginData.data?.refreshToken ? "✅ Received" : "❌ Missing"}`);
    console.log(`   Expires In: ${loginData.data?.expiresIn} seconds`);

    const { accessToken, refreshToken } = loginData.data || {};

    // 4. Use refresh token to get new access token
    console.log("\n4. POST /auth/refresh");
    res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
    });
    const refreshData = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 200 ? "✅" : "❌"}`);
    console.log(`   New Access Token: ${refreshData.data?.accessToken ? "✅ Received" : "❌ Missing"}`);

    // 5. Test with invalid refresh token
    console.log("\n5. POST /auth/refresh (invalid token - should fail)");
    res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: "invalid-token" }),
    });
    console.log(`   Status: ${res.status} ${res.status === 401 ? "✅" : "❌"}`);

    // 6. Logout
    console.log("\n6. POST /auth/logout");
    res = await fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
    });
    const logoutData = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 200 ? "✅" : "❌"}`);
    console.log(`   Message: ${logoutData.message}`);

    // 7. Try refresh after logout (should fail)
    console.log("\n7. POST /auth/refresh (after logout - should fail)");
    res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
    });
    console.log(`   Status: ${res.status} ${res.status === 401 ? "✅" : "❌"}`);

    console.log("\n╔══════════════════════════════════════════════════╗");
    console.log("║      REFRESH TOKEN TEST COMPLETE ✅              ║");
    console.log("╚══════════════════════════════════════════════════╝");

    process.exit(0);
}

testRefreshToken();
