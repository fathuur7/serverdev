const BASE_URL = "http://localhost:3000";

async function test() {
    console.log("--- Starting Profile Security Verification ---");

    const email = `profile_test_${Date.now()}@example.com`;
    const password = "password123";

    // 1. Register
    console.log(`\n1. registering user: ${email}`);
    await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    // 2. Login to get Token
    console.log(`\n2. logging in to get token...`);
    let token = "";
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (data.success && data.data.accessToken) {
            token = data.data.accessToken;
            console.log("✅ Token received");
        } else {
            console.error("❌ Failed to get token", data);
            return;
        }
    } catch (error) {
        console.error("❌ Login Request Failed:", error);
        return;
    }

    // 3. Create Profile (Authenticated)
    console.log(`\n3. Creating Profile with Token...`);
    try {
        const res = await fetch(`${BASE_URL}/auth/customer-profile`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                fullName: "Test Profile User",
                nik: "1234567890123456",
                phoneNumber: "081299998888"
            })
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(data));
        if (res.status === 201 && data.success) {
            console.log("✅ Profile Created Successfully");
        } else {
            console.log("❌ Profile Creation Failed");
        }
    } catch (error) {
        console.error("❌ Profile Request Failed:", error);
    }

    // 4. Create Profile (Unauthenticated)
    console.log(`\n4. Attempting Create Profile WITHOUT Token (Should Fail)...`);
    try {
        const res = await fetch(`${BASE_URL}/auth/customer-profile`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                fullName: "Hacker",
                nik: "000",
                phoneNumber: "000"
            })
        });
        console.log("Status:", res.status);
        if (res.status === 401) {
            console.log("✅ Blocked successfully (401)");
        } else {
            console.log("❌ WAS NOT BLOCKED!", res.status);
        }
    } catch (error) {
        console.error(error);
    }
}

test();
