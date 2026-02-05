const BASE_URL = "http://localhost:3000/api";

async function runWorkerTest() {
    console.log("🚀 Testing Billing Worker...");
    try {
        const res = await fetch(`${BASE_URL}/test/billing-worker`, {
            method: "POST"
        });
        const data = await res.json();

        console.log("----------------------------------------");
        if (data.success) {
            console.log("✅ Worker Test Passed!");
            console.log(`   Generated: ${data.workerResult.generated} invoices`);
            console.log(`   Errors: ${data.workerResult.errors.length}`);

            if (data.generatedInvoice) {
                console.log(`   ✅ Invoice Created: ${data.generatedInvoice.invoiceNumber}`);
                console.log(`   Due Date: ${data.generatedInvoice.dueDate}`);
                console.log(`   Amount: ${data.generatedInvoice.totalAmount}`);
            } else {
                console.log("   ❌ Invoice NOT created (Logic mismatch?)");
            }
        } else {
            console.log("❌ Test Failed:", data.message);
        }
        console.log("----------------------------------------");
    } catch (e) {
        console.error("Exec Error:", e);
    }
}

runWorkerTest();
