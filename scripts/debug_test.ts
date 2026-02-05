import prisma from "../src/utils/prisma";

const BASE_URL = "http://localhost:3000/api";

async function debugTest() {
    const email = `debug_${Date.now()}@test.com`;
    const password = "password123";

    // 1. Register
    console.log("1. Register...");
    let res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    console.log("   Status:", res.status);

    // 2. Verify in DB
    console.log("2. Verify email in DB...");
    await prisma.user.update({
        where: { email },
        data: { emailVerified: true, otp: null, otpExpiresAt: null, role: "ADMIN" },
    });

    // 3. Login
    console.log("3. Login...");
    res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const loginData = await res.json();
    console.log("   Status:", res.status);
    console.log("   Token:", loginData.data?.accessToken ? "OK" : "MISSING");

    // 4. Get User
    console.log("4. GET /auth/user...");
    res = await fetch(`${BASE_URL}/auth/user`, {
        headers: { "Authorization": `Bearer ${loginData.data?.accessToken}` },
    });
    const userData = await res.json();
    console.log("   Status:", res.status);
    console.log("   Response:", JSON.stringify(userData, null, 2));

    process.exit(0);
}

debugTest();
