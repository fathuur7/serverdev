# Billing System Flow

## Overview
Sistem billing otomatis untuk ISP dengan model Prepaid (bayar dulu, baru pasang).

---

## Flow Langganan Baru

1. **Create Subscription** → Status `PENDING_INSTALL` + **First Invoice** dibuat
2. **Customer Bayar** → Invoice status `PAID`
3. **Activate Subscription** → Status `ACTIVE`, set `activationDate` & `contractEndDate`

---

## Task A: Invoice Generator (01:00 AM Daily)

**Logic:**
1. Cari semua subscriptions dengan status `ACTIVE`
2. Filter: `activationDate.day == (today + 7).day`
3. Generate invoice untuk periode billing bulan depan
4. Set `dueDate` = today + 7 hari
5. Status invoice: `UNPAID`

**Contoh:**
- Subscription aktif tanggal 15 Januari
- Tanggal 8 Februari (7 hari sebelum 15 Feb), invoice dibuat
- Due date: 15 Februari

**Contoh:**
- Invoice due 15 Februari, tidak dibayar
- Tanggal 16 Februari, subscription di-isolir

---

## Timeline Example

| Hari | Event |
|------|-------|
| 1 Jan | Subscription diaktivasi (billing cycle: tanggal 1) |
| 25 Jan | Task A: Generate invoice (due 1 Feb) |
| 1 Feb | Jatuh tempo invoice |
| 2 Feb | Task B: Isolir jika belum bayar |

---

## Running the Worker

```bash
# Development
bun run billing

# Production (dengan PM2)
pm2 start "bun run billing" --name billing-worker
```

---

## Files

| File | Fungsi |
|------|--------|
| `workers/billing.worker.ts` | Cron scheduler |
| `services/Invoices/invoice.service.ts` | `generateMonthlyInvoices()` |
| `services/subscriptions/subscription.service.ts` | `isolateOverdueSubscriptions()` |
