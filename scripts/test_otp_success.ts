import prisma from "../src/utils/prisma";
import { OtpService } from "../src/services/auth/otp.service";

const BASE_URL = "http://localhost:3000/api";

async function testOtpSuccess() {
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║     TEST: OTP VERIFICATION SUCCESS FLOW          ║");
    console.log("╚══════════════════════════════════════════════════╝\n");

    const email = `otp_success_${Date.now()}@test.com`;
    const password = "password123";

    // 1. Register user
    console.log("1. POST /auth/register");
    let res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const registerData = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 201 ? "✅" : "❌"}`);
    console.log(`   Email: ${email}`);

    // 2. Generate known OTP and update in DB
    console.log("\n2. [DB] Setting known OTP for testing...");
    const knownOtp = "123456";
    const otpHash = await OtpService.hash(knownOtp);
    const otpExpiry = OtpService.getExpiryDate();

    await prisma.user.update({
        where: { email },
        data: { otp: otpHash, otpExpiresAt: otpExpiry },
    });
    console.log(`   OTP set to: ${knownOtp}`);

    // 3. Try login (should fail - not verified)
    console.log("\n3. POST /auth/login (before OTP - should fail)");
    res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const loginFail = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 401 ? "✅" : "❌"}`);
    console.log(`   Message: ${loginFail.message}`);

    // 4. Verify OTP with wrong code (should fail)
    console.log("\n4. POST /auth/verify-otp (wrong OTP - should fail)");
    res = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: "000000" }),
    });
    const wrongOtp = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 400 ? "✅" : "❌"}`);
    console.log(`   Message: ${wrongOtp.message}`);

    // 5. Verify OTP with correct code (should succeed)
    console.log("\n5. POST /auth/verify-otp (correct OTP - should succeed)");
    res = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: knownOtp }),
    });
    const correctOtp = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 200 ? "✅" : "❌"}`);
    console.log(`   Message: ${correctOtp.message}`);

    // 6. Login (should succeed now)
    console.log("\n6. POST /auth/login (after OTP verification)");
    res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const loginSuccess = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 200 ? "✅" : "❌"}`);
    console.log(`   Token: ${loginSuccess.data?.accessToken ? "Received ✅" : "Missing ❌"}`);

    // 7. Verify email is marked as verified in DB
    console.log("\n7. [DB] Checking emailVerified status...");
    const user = await prisma.user.findUnique({ where: { email } });
    console.log(`   emailVerified: ${user?.emailVerified} ${user?.emailVerified ? "✅" : "❌"}`);
    console.log(`   OTP cleared: ${user?.otp === null ? "✅" : "❌"}`);

    console.log("\n╔══════════════════════════════════════════════════╗");
    console.log("║           OTP TEST COMPLETE ✅                   ║");
    console.log("╚══════════════════════════════════════════════════╝");

    process.exit(0);
}

testOtpSuccess();
