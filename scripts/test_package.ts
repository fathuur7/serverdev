import prisma from "../src/utils/prisma";

const BASE_URL = "http://localhost:3000/api";

async function testPackageCRUD() {
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║          TEST: PACKAGE CRUD                      ║");
    console.log("╚══════════════════════════════════════════════════╝\n");

    // Create admin for protected routes
    const adminEmail = `admin_pkg_${Date.now()}@test.com`;
    const password = "password123";

    await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password }),
    });
    await prisma.user.update({
        where: { email: adminEmail },
        data: { emailVerified: true, role: "ADMIN", otp: null, otpExpiresAt: null },
    });

    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password }),
    });
    const loginData = await loginRes.json();
    const adminToken = loginData.data?.accessToken;
    console.log("Admin Token:", adminToken ? "Received ✅" : "Missing ❌");

    const authHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`,
    };

    // 1. GET all packages (public)
    console.log("\n1. GET /packages");
    let res = await fetch(`${BASE_URL}/packages`);
    let data = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 200 ? "✅" : "❌"}`);
    console.log(`   Count: ${data.data?.length || 0} packages`);

    // 2. POST create package (admin)
    console.log("\n2. POST /packages (create)");
    res = await fetch(`${BASE_URL}/packages`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
            name: "Paket Basic " + Date.now(),
            downloadSpeedMbps: 10,
            uploadSpeedMbps: 5,
            monthlyPrice: 150000,
            slaPercentage: 95,
            contractDurationMonths: 12,
        }),
    });
    data = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 201 ? "✅" : "❌"}`);
    const newPackageId = data.data?.id;
    console.log(`   Package ID: ${newPackageId}`);

    // 3. GET package by id
    console.log(`\n3. GET /packages/${newPackageId}`);
    res = await fetch(`${BASE_URL}/packages/${newPackageId}`);
    data = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 200 ? "✅" : "❌"}`);
    console.log(`   Name: ${data.data?.name}`);

    // 4. PUT update package
    console.log(`\n4. PUT /packages/${newPackageId} (update)`);
    res = await fetch(`${BASE_URL}/packages/${newPackageId}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
            name: "Paket Basic Updated",
            monthlyPrice: 175000,
        }),
    });
    data = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 200 ? "✅" : "❌"}`);
    console.log(`   Updated Name: ${data.data?.name}`);

    // 5. PATCH toggle active
    console.log(`\n5. PATCH /packages/${newPackageId}/toggle`);
    res = await fetch(`${BASE_URL}/packages/${newPackageId}/toggle`, {
        method: "PATCH",
        headers: authHeaders,
    });
    data = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 200 ? "✅" : "❌"}`);
    console.log(`   isActive: ${data.data?.isActive}`);

    // 6. GET active packages only
    console.log("\n6. GET /packages/active");
    res = await fetch(`${BASE_URL}/packages/active`);
    data = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 200 ? "✅" : "❌"}`);
    console.log(`   Active Count: ${data.data?.length || 0}`);

    // 7. DELETE package
    console.log(`\n7. DELETE /packages/${newPackageId}`);
    res = await fetch(`${BASE_URL}/packages/${newPackageId}`, {
        method: "DELETE",
        headers: authHeaders,
    });
    data = await res.json();
    console.log(`   Status: ${res.status} ${res.status === 200 ? "✅" : "❌"}`);
    console.log(`   Message: ${data.message}`);

    console.log("\n╔══════════════════════════════════════════════════╗");
    console.log("║           PACKAGE CRUD TEST COMPLETE ✅          ║");
    console.log("╚══════════════════════════════════════════════════╝");

    process.exit(0);
}

testPackageCRUD();
