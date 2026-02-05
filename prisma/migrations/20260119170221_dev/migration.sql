-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TECHNICIAN', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BLACKLISTED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING_INSTALL', 'ACTIVE', 'ISOLATED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PortStatus" AS ENUM ('CONNECTED', 'BROKEN_FAULTY', 'RESERVED');

-- CreateEnum
CREATE TYPE "TechnicianStatus" AS ENUM ('IDLE', 'ON_JOB', 'OFF_DUTY');

-- CreateEnum
CREATE TYPE "WorkOrderType" AS ENUM ('NEW_INSTALLATION', 'REPAIR', 'DISMANTLE');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('DRAFT', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AssetLocationType" AS ENUM ('WAREHOUSE', 'TECHNICIAN', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('NEW', 'REFURBISHED', 'BROKEN', 'IN_USE');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('NO_INTERNET', 'SLOW_CONNECTION', 'BILLING_ISSUE', 'REQUEST_MOVE');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "full_name" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "secondary_phone" TEXT,
    "npwp" TEXT,

    CONSTRAINT "customer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taxes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discounts" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" BIGSERIAL NOT NULL,
    "subscription_id" INTEGER NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "billing_period" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "amount_basic" DECIMAL(12,2) NOT NULL,
    "amount_tax" DECIMAL(12,2) NOT NULL,
    "amount_discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "penalty_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" BIGSERIAL NOT NULL,
    "invoice_id" BIGINT NOT NULL,
    "payment_method" TEXT NOT NULL,
    "payment_gateway_trx_id" TEXT,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount_paid" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technician_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "employee_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "current_status" "TechnicianStatus" NOT NULL DEFAULT 'IDLE',

    CONSTRAINT "technician_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" BIGSERIAL NOT NULL,
    "ticket_id" BIGINT,
    "subscription_id" INTEGER NOT NULL,
    "technician_id" INTEGER,
    "wo_type" "WorkOrderType" NOT NULL,
    "scheduled_time" TIMESTAMP(3) NOT NULL,
    "completion_time" TIMESTAMP(3),
    "customer_signature_url" TEXT,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "olt" (
    "id" SERIAL NOT NULL,
    "hostname" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "location_name" TEXT NOT NULL,
    "model" TEXT NOT NULL,

    CONSTRAINT "olt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "odp" (
    "id" SERIAL NOT NULL,
    "olt_id" INTEGER NOT NULL,
    "odp_code" TEXT NOT NULL,
    "geo_lat" DECIMAL(9,6) NOT NULL,
    "geo_long" DECIMAL(9,6) NOT NULL,
    "capacity_ports" INTEGER NOT NULL,
    "available_ports" INTEGER NOT NULL,

    CONSTRAINT "odp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" SERIAL NOT NULL,
    "subscription_id" INTEGER NOT NULL,
    "serial_number" TEXT NOT NULL,
    "mac_address" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "wifi_ssid_initial" TEXT NOT NULL,
    "wifi_password_initial" TEXT NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "port_mapping" (
    "odp_id" INTEGER NOT NULL,
    "port_number" INTEGER NOT NULL,
    "device_id" INTEGER NOT NULL,
    "status" "PortStatus" NOT NULL DEFAULT 'CONNECTED',

    CONSTRAINT "port_mapping_pkey" PRIMARY KEY ("odp_id","port_number")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location_address" TEXT NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_items" (
    "id" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_tracking" (
    "id" BIGSERIAL NOT NULL,
    "stock_item_id" INTEGER NOT NULL,
    "serial_number" TEXT NOT NULL,
    "current_location_type" "AssetLocationType" NOT NULL,
    "location_id" INTEGER NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'NEW',

    CONSTRAINT "asset_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "download_speed_mbps" INTEGER NOT NULL,
    "upload_speed_mbps" INTEGER NOT NULL,
    "monthly_price" DECIMAL(12,2) NOT NULL,
    "sla_percentage" DECIMAL(5,2) NOT NULL,
    "contract_duration_months" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "package_id" INTEGER NOT NULL,
    "service_id" TEXT NOT NULL,
    "installation_address_full" TEXT NOT NULL,
    "geo_lat" DECIMAL(9,6) NOT NULL,
    "geo_long" DECIMAL(9,6) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING_INSTALL',
    "activation_date" TIMESTAMP(3),
    "contract_end_date" TIMESTAMP(3),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" BIGSERIAL NOT NULL,
    "subscription_id" INTEGER NOT NULL,
    "category" "TicketCategory" NOT NULL,
    "priority" "TicketPriority" NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "created_by_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" BIGSERIAL NOT NULL,
    "actor_user_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "target_table" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customer_profiles_user_id_key" ON "customer_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_profiles_nik_key" ON "customer_profiles"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "discounts_code_key" ON "discounts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "technician_profiles_user_id_key" ON "technician_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "technician_profiles_employee_id_key" ON "technician_profiles"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "odp_odp_code_key" ON "odp"("odp_code");

-- CreateIndex
CREATE UNIQUE INDEX "devices_subscription_id_key" ON "devices"("subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "devices_serial_number_key" ON "devices"("serial_number");

-- CreateIndex
CREATE UNIQUE INDEX "port_mapping_device_id_key" ON "port_mapping"("device_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_items_sku_key" ON "stock_items"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "asset_tracking_serial_number_key" ON "asset_tracking"("serial_number");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_service_id_key" ON "subscriptions"("service_id");

-- AddForeignKey
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_profiles" ADD CONSTRAINT "technician_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technician_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odp" ADD CONSTRAINT "odp_olt_id_fkey" FOREIGN KEY ("olt_id") REFERENCES "olt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "port_mapping" ADD CONSTRAINT "port_mapping_odp_id_fkey" FOREIGN KEY ("odp_id") REFERENCES "odp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "port_mapping" ADD CONSTRAINT "port_mapping_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_tracking" ADD CONSTRAINT "asset_tracking_stock_item_id_fkey" FOREIGN KEY ("stock_item_id") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
