const BASE_URL = "http://localhost:3000/api";

async function testOtpFlow() {
    console.log("=== Testing OTP Auth Flow ===\n");

    // Use your real email to receive OTP
    const email = `kopisusu8ip+test${Date.now()}@gmail.com`; // Gmail alias - goes to your inbox
    const password = "password123";

    // 1. Register
    console.log("1. POST /auth/register");
    try {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        console.log(`   Status: ${res.status}`);
        console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
        if (res.status === 201) {
            console.log("   ✅ Register Success - OTP should be sent to email\n");
        } else {
            console.log("   ❌ Register Failed\n");
            return;
        }
    } catch (e) {
        console.error("   ❌ Error:", e);
        return;
    }

    // 2. Try login without verification (should fail)
    console.log("2. POST /auth/login (without OTP verification - should fail)");
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        console.log(`   Status: ${res.status}`);
        console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
        if (res.status === 401 && data.message.includes("not verified")) {
            console.log("   ✅ Correctly blocked - Email not verified\n");
        } else {
            console.log("   ⚠️ Unexpected response\n");
        }
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    // 3. Test verify-otp endpoint (with wrong OTP)
    console.log("3. POST /auth/verify-otp (with wrong OTP - should fail)");
    try {
        const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp: "000000" }),
        });
        const data = await res.json();
        console.log(`   Status: ${res.status}`);
        console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
        if (res.status === 400) {
            console.log("   ✅ Correctly rejected invalid OTP\n");
        }
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    // 4. Test resend-otp endpoint
    console.log("4. POST /auth/resend-otp");
    try {
        const res = await fetch(`${BASE_URL}/auth/resend-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        const data = await res.json();
        console.log(`   Status: ${res.status}`);
        console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
        if (res.status === 200) {
            console.log("   ✅ Resend OTP Success\n");
        }
    } catch (e) {
        console.error("   ❌ Error:", e);
    }

    console.log("=== Test Complete ===");
    console.log("\nNote: To fully test, you need to:");
    console.log("1. Check your email for the OTP (if RESEND_API_KEY is set)");
    console.log("2. Call /auth/verify-otp with the correct OTP");
    console.log("3. Then /auth/login should work");
}

testOtpFlow();
