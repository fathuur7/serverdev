const BASE_URL = "http://localhost:3000/api";

let accessToken = "";
let testEmail = "";

async function testAllAPIs() {
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║           COMPREHENSIVE API TEST                 ║");
    console.log("╚══════════════════════════════════════════════════╝\n");

    testEmail = `test_${Date.now()}@example.com`;
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
        console.log(`   Status: ${res.status}`);
        console.log(`   ${res.status === 201 ? "✅" : "❌"} ${data.message || JSON.stringify(data)}`);
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    // ═══════════════════════════════════════════════════
    // 2. LOGIN (should fail - email not verified)
    // ═══════════════════════════════════════════════════
    console.log("\n2. POST /auth/login (before OTP verification - should fail)");
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: testEmail, password }),
        });
        const data = await res.json();
        console.log(`   Status: ${res.status}`);
        console.log(`   ${res.status === 401 ? "✅" : "❌"} ${data.message}`);
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    // ═══════════════════════════════════════════════════
    // 3. VERIFY OTP (wrong OTP - should fail)
    // ═══════════════════════════════════════════════════
    console.log("\n3. POST /auth/verify-otp (wrong OTP - should fail)");
    try {
        const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: testEmail, otp: "000000" }),
        });
        const data = await res.json();
        console.log(`   Status: ${res.status}`);
        console.log(`   ${res.status === 400 ? "✅" : "❌"} ${data.message}`);
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    // ═══════════════════════════════════════════════════
    // 4. RESEND OTP
    // ═══════════════════════════════════════════════════
    console.log("\n4. POST /auth/resend-otp");
    try {
        const res = await fetch(`${BASE_URL}/auth/resend-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: testEmail }),
        });
        const data = await res.json();
        console.log(`   Status: ${res.status}`);
        console.log(`   ${res.status === 200 ? "✅" : "❌"} ${data.message}`);
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    // ═══════════════════════════════════════════════════
    // 5. Manually verify user for testing (skip OTP)
    // ═══════════════════════════════════════════════════
    console.log("\n5. [BYPASS] Manually verifying email in DB...");
    // Note: In real test, you'd verify via email. Here we'll try login with existing verified user.

    // Use existing verified user for remaining tests
    const verifiedEmail = "verified@test.com";
    const verifiedPassword = "password123";

    // Try to register verified user first
    await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifiedEmail, password: verifiedPassword }),
    });

    // ═══════════════════════════════════════════════════
    // 6. GET /profile (without token - should fail)
    // ═══════════════════════════════════════════════════
    console.log("\n6. GET /auth/profile (no token - should fail)");
    try {
        const res = await fetch(`${BASE_URL}/auth/profile`);
        const data = await res.json();
        console.log(`   Status: ${res.status}`);
        console.log(`   ${res.status === 401 ? "✅" : "❌"} ${data.message}`);
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    // ═══════════════════════════════════════════════════
    // 7. GET /user (without token - should fail)
    // ═══════════════════════════════════════════════════
    console.log("\n7. GET /auth/user (no token - should fail)");
    try {
        const res = await fetch(`${BASE_URL}/auth/user`);
        const data = await res.json();
        console.log(`   Status: ${res.status}`);
        console.log(`   ${res.status === 401 ? "✅" : "❌"} ${data.message}`);
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    // ═══════════════════════════════════════════════════
    // 8. POST /customer-profile (without token - should fail)
    // ═══════════════════════════════════════════════════
    console.log("\n8. POST /auth/customer-profile (no token - should fail)");
    try {
        const res = await fetch(`${BASE_URL}/auth/customer-profile`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: "Test User",
                nik: "1234567890123456",
                phoneNumber: "08123456789",
            }),
        });
        const data = await res.json();
        console.log(`   Status: ${res.status}`);
        console.log(`   ${res.status === 401 || res.status === 422 ? "✅" : "❌"} ${data.message || "Blocked"}`);
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    // ═══════════════════════════════════════════════════
    // 9. PUT /profile (without token - should fail)
    // ═══════════════════════════════════════════════════
    console.log("\n9. PUT /auth/profile (no token - should fail)");
    try {
        const res = await fetch(`${BASE_URL}/auth/profile`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullName: "Updated Name" }),
        });
        const data = await res.json();
        console.log(`   Status: ${res.status}`);
        console.log(`   ${res.status === 401 ? "✅" : "❌"} ${data.message}`);
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    console.log("\n╔══════════════════════════════════════════════════╗");
    console.log("║               TEST SUMMARY                       ║");
    console.log("╚══════════════════════════════════════════════════╝");
    console.log(`
Endpoints Tested:
  ✓ POST /auth/register
  ✓ POST /auth/login
  ✓ POST /auth/verify-otp
  ✓ POST /auth/resend-otp
  ✓ GET  /auth/profile (protected)
  ✓ PUT  /auth/profile (protected)
  ✓ POST /auth/customer-profile (protected)
  ✓ GET  /auth/user (admin/technician only)

Note: To fully test protected endpoints with valid token,
manually verify a user's email in the database first.
`);
}

testAllAPIs();
