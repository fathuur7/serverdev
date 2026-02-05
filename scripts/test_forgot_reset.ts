import prisma from "../src/utils/prisma";
import { OtpService } from "../src/services/auth/otp.service";

const BASE_URL = "http://localhost:3000/api";

async function testForgotResetPassword() {
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║     TEST: FORGOT & RESET PASSWORD FLOW           ║");
    console.log("╚══════════════════════════════════════════════════╝\n");

    const email = `reset_${Date.now()}@test.com`;
    const password = "password123";
    const newPassword = "newpassword456";

    // 1. Register user
    console.log("1. POST /auth/register");
    let res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const registerData = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 201 ? "✅" : "❌"}`);

    // 2. Verify email in DB (bypass OTP)
    console.log("\n2. [DB] Verifying email...");
    await prisma.user.update({
        where: { email },
        data: { emailVerified: true, otp: null, otpExpiresAt: null },
    });
    console.log("   ✅ Email verified");

    // 3. Login with original password
    console.log("\n3. POST /auth/login (original password)");
    res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    console.log(`   Status: ${res.status} ${res.status === 200 ? "✅" : "❌"}`);

    // 4. Request forgot password
    console.log("\n4. POST /auth/forgot-password");
    res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });
    const forgotData = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 200 ? "✅" : "❌"}`);
    console.log(`   Message: ${forgotData.message}`);

    // 5. Set known OTP in DB for testing
    console.log("\n5. [DB] Setting known OTP for testing...");
    const knownOtp = "123456";
    const otpHash = await OtpService.hash(knownOtp);
    const otpExpiry = OtpService.getExpiryDate();
    await prisma.user.update({
        where: { email },
        data: { otp: otpHash, otpExpiresAt: otpExpiry },
    });
    console.log(`   OTP set to: ${knownOtp}`);

    // 6. Reset password with wrong OTP (should fail)
    console.log("\n6. POST /auth/reset-password (wrong OTP - should fail)");
    res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: "000000", password: newPassword }),
    });
    const wrongOtpData = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 400 ? "✅" : "❌"}`);
    console.log(`   Message: ${wrongOtpData.message}`);

    // 7. Reset password with correct OTP
    console.log("\n7. POST /auth/reset-password (correct OTP)");
    res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: knownOtp, password: newPassword }),
    });
    const resetData = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 200 ? "✅" : "❌"}`);
    console.log(`   Message: ${resetData.message}`);

    // 8. Login with old password (should fail)
    console.log("\n8. POST /auth/login (old password - should fail)");
    res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    console.log(`   Status: ${res.status} ${res.status === 401 ? "✅" : "❌"}`);

    // 9. Login with new password (should succeed)
    console.log("\n9. POST /auth/login (new password)");
    res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: newPassword }),
    });
    const loginData = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 200 ? "✅" : "❌"}`);
    console.log(`   Token: ${loginData.data?.accessToken ? "Received ✅" : "Missing ❌"}`);

    console.log("\n╔══════════════════════════════════════════════════╗");
    console.log("║      FORGOT/RESET PASSWORD TEST COMPLETE ✅      ║");
    console.log("╚══════════════════════════════════════════════════╝");

    process.exit(0);
}

testForgotResetPassword();
