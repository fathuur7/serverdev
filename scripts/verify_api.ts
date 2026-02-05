// const BASE_URL = "http://localhost:3000";

async function main() {
    console.log("--- Starting Auth API Verification ---");

    const email = `api_test_${Date.now()}@example.com`;
    const password = "password123";

    // 1. Test Register Endpoint
    console.log(`\n1. POST /auth/register`);
    try {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(data));
    } catch (error) {
        console.error("❌ Register Request Failed:", error);
    }

    // 2. Test Login Endpoint
    console.log(`\n2. POST /auth/login`);
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(data));
    } catch (error) {
        console.error("❌ Login Request Failed:", error);
    }
}

main();
