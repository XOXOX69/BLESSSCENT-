# BLESSCENT Database Schema Design

## Overview

This document outlines the PostgreSQL database schema for the BLESSCENT Retail POS System. The schema follows clean design principles with proper separation of concerns and support for offline-first POS operations.

### Design Principles
- **Soft Delete**: All business records use `deleted_at` for soft deletion
- **Audit Trail**: Critical tables have corresponding audit tables
- **UUIDs**: Primary keys use UUIDs for distributed systems compatibility
- **Timestamps**: All tables include `created_at` and `updated_at`
- **Soft Delete**: All business records use `deleted_at` for soft deletion
- **Concurrency**: Optimistic locking with `version` column on volatile tables

---

## Naming Conventions

| Pattern | Example | Description |
|---------|---------|-------------|
| Tables | `snake_case` | `users`, `product_variants` |
| Columns | `snake_case` | `created_at`, `price_profile_id` |
| Foreign Keys | `{table}_id` | `branch_id`, `product_id` |
| Indexes | `idx_{table}_{column}` | `idx_products_sku` |
| Enums | `UPPER_SNAKE_CASE` | `USER_ROLE`, `SALE_STATUS` |

---

## Core Tables

### 1. Users & Authentication

#### 1.1 users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    role USER_ROLE NOT NULL DEFAULT 'CASHIER',
    branch_id UUID REFERENCES branches(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_branch ON users(branch_id);
```

#### 1.2 user_roles Enum

```sql
CREATE TYPE USER_ROLE AS ENUM (
    'ADMIN',
    'MANAGER',
    'CASHIER',
    'INVENTORY',
    'RESELLER'
);
```

#### 1.3 user_sessions

```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    token_scope VARCHAR(50) NOT NULL, -- 'POS', 'DASHBOARD', 'FULL'
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token_hash);
```

---

### 2. Organization Structure

#### 2.1 branches

```sql
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    manager_id UUID REFERENCES users(id),
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Manila',
    is_active BOOLEAN NOT NULL DEFAULT true,
    opening_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_branches_code ON branches(code);
```

---

### 3. Product Catalog

#### 3.1 products

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    brand VARCHAR(100),
    category_id UUID REFERENCES product_categories(id),
    base_price DECIMAL(12, 2) NOT NULL,
    unit_of_measure VARCHAR(20) NOT NULL DEFAULT 'piece',
    image_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_bundle BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_category ON products(category_id);
```

#### 3.2 product_categories

```sql
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES product_categories(id),
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_categories_parent ON product_categories(parent_id);
```

#### 3.3 product_variants

```sql
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    size VARCHAR(50), -- e.g., '50ml', '100ml'
    concentration VARCHAR(50), -- e.g., 'EDT', 'EDP', 'Parfum'
    packaging VARCHAR(100), -- e.g., 'Bottle', 'Box Set'
    barcode VARCHAR(100),
    weight DECIMAL(8, 3),
    length DECIMAL(8, 2),
    width DECIMAL(8, 2),
    height DECIMAL(8, 2),
    image_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);
CREATE INDEX idx_variants_barcode ON product_variants(barcode);
```

#### 3.4 product_bundle_items

```sql
CREATE TABLE product_bundle_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(bundle_product_id, variant_id)
);

CREATE INDEX idx_bundle_items_bundle ON product_bundle_items(bundle_product_id);
```

---

### 4. Pricing System

#### 4.1 price_profiles

```sql
CREATE TABLE price_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    profile_type PRICE_PROFILE_TYPE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 0, -- Higher priority overrides lower
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_price_profiles_type ON price_profiles(profile_type);
CREATE INDEX idx_price_profiles_priority ON price_profiles(priority);
```

#### 4.2 price_profile_types Enum

```sql
CREATE TYPE PRICE_PROFILE_TYPE AS ENUM (
    'RETAIL',      -- Default retail price
    'MEMBER',      -- Member discount price
    'RESELLER',    -- Reseller price level
    'PROMO',       -- Promotional/discount price
    'SPECIAL'      -- Special/custom pricing
);
```

#### 4.3 price_tiers

```sql
CREATE TABLE price_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_profile_id UUID NOT NULL REFERENCES price_profiles(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id),
    price DECIMAL(12, 2) NOT NULL,
    cost_price DECIMAL(12, 2), -- For profit calculation
    compare_at_price DECIMAL(12, 2), -- Original price for showing discounts
    currency VARCHAR(3) NOT NULL DEFAULT 'PHP',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(price_profile_id, variant_id)
);

CREATE INDEX idx_price_tiers_profile ON price_tiers(price_profile_id);
CREATE INDEX idx_price_tiers_variant ON price_tiers(variant_id);
```

#### 4.4 reseller_price_levels

```sql
CREATE TABLE reseller_price_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
    price_profile_id UUID NOT NULL REFERENCES price_profiles(id),
    discount_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    effective_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(reseller_id, price_profile_id)
);

CREATE INDEX idx_reseller_price_level ON reseller_price_levels(reseller_id);
```

---

### 5. Inventory Management

#### 5.1 stocks

```sql
CREATE TABLE stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES product_variants(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    quantity_available INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 10,
    reorder_quantity INTEGER NOT NULL DEFAULT 50,
    last_counted_at TIMESTAMP WITH TIME ZONE,
    version INTEGER NOT NULL DEFAULT 1, -- Optimistic locking
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(variant_id, branch_id)
);

CREATE INDEX idx_stocks_variant ON stocks(variant_id);
CREATE INDEX idx_stocks_branch ON stocks(branch_id);
CREATE INDEX idx_stocks_available ON stocks(branch_id, quantity_available);
```

#### 5.2 stock_transactions

```sql
CREATE TABLE stock_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES product_variants(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    transaction_type STOCK_TRANSACTION_TYPE NOT NULL,
    quantity_change INTEGER NOT NULL, -- Positive for in, negative for out
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reference_type VARCHAR(50), -- 'SALE', 'STOCK_IN', 'ADJUSTMENT', 'TRANSFER'
    reference_id UUID,
    notes TEXT,
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_trans_variant ON stock_transactions(variant_id);
CREATE INDEX idx_stock_trans_branch ON stock_transactions(branch_id);
CREATE INDEX idx_stock_trans_created ON stock_transactions(created_at);
CREATE INDEX idx_stock_trans_reference ON stock_transactions(reference_type, reference_id);
```

#### 5.3 stock_transaction_types Enum

```sql
CREATE TYPE STOCK_TRANSACTION_TYPE AS ENUM (
    'STOCK_IN',       -- Receiving inventory
    'SALE',           -- Sale deduction
    'RETURN',         -- Customer return
    'ADJUSTMENT',     -- Manual adjustment
    'DAMAGE',         -- Damaged goods
    'EXPIRED',        -- Expired products
    'TRANSFER_IN',    -- Transfer from another branch
    'TRANSFER_OUT',   -- Transfer to another branch
    'RESERVED',       -- Reserved for order
    'RELEASED'        -- Released reservation
);
```

---

### 6. Members (Customer Loyalty)

#### 6.1 members

```sql
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_number VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender GENDER,
    address TEXT,
    city VARCHAR(100),
    tier MEMBER_TIER NOT NULL DEFAULT 'BRONZE',
    total_points INTEGER NOT NULL DEFAULT 0,
    available_points INTEGER NOT NULL DEFAULT 0,
    lifetime_spend DECIMAL(14, 2) NOT NULL DEFAULT 0,
    total_purchases INTEGER NOT NULL DEFAULT 0,
    points_per_php DECIMAL(5, 2) NOT NULL DEFAULT 0.01, -- Points earned per PHP spent
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_purchase_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_members_number ON members(member_number);
CREATE INDEX idx_members_tier ON members(tier);
CREATE INDEX idx_members_phone ON members(phone);
CREATE INDEX idx_members_email ON members(email);
```

#### 6.2 member_tiers Enum

```sql
CREATE TYPE MEMBER_TIER AS ENUM (
    'BRONZE',
    'SILVER',
    'GOLD',
    'PLATINUM',
    'DIAMOND'
);
```

#### 6.3 member_point_transactions

```sql
CREATE TABLE member_point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    transaction_type POINT_TRANSACTION_TYPE NOT NULL,
    points INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reference_type VARCHAR(50), -- 'SALE', 'REDEMPTION', 'ADJUSTMENT', 'EXPIRY'
    reference_id UUID,
    expires_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_member_points_member ON member_point_transactions(member_id);
CREATE INDEX idx_member_points_created ON member_point_transactions(created_at);
```

#### 6.4 point_transaction_types Enum

```sql
CREATE TYPE POINT_TRANSACTION_TYPE AS ENUM (
    'EARNED',      -- Points earned from purchase
    'REDEEMED',    -- Points redeemed for discount
    'EXPIRED',     -- Points expired
    'ADJUSTED',    -- Manual adjustment
    'BONUS'        -- Bonus points from promotions
);
```

#### 6.5 member_tier_rules

```sql
CREATE TABLE member_tier_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier MEMBER_TIER NOT NULL UNIQUE,
    min_lifetime_spend DECIMAL(14, 2) NOT NULL DEFAULT 0,
    min_purchases INTEGER NOT NULL DEFAULT 0,
    discount_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
    points_multiplier DECIMAL(5, 2) NOT NULL DEFAULT 1.0,
    benefits TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

---

### 7. Resellers

#### 7.1 resellers

```sql
CREATE TABLE resellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number VARCHAR(20) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    tax_id VARCHAR(50),
    price_level_id UUID REFERENCES price_profiles(id),
    credit_limit DECIMAL(14, 2) NOT NULL DEFAULT 0,
    current_balance DECIMAL(14, 2) NOT NULL DEFAULT 0,
    status RESELLER_STATUS NOT NULL DEFAULT 'PENDING',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_resellers_account ON resellers(account_number);
CREATE INDEX idx_resellers_status ON resellers(status);
CREATE INDEX idx_resellers_email ON resellers(email);
```

#### 7.2 reseller_status Enum

```sql
CREATE TYPE RESELLER_STATUS AS ENUM (
    'PENDING',     -- Awaiting approval
    'ACTIVE',      -- Approved and active
    'SUSPENDED',   -- Temporarily suspended
    'INACTIVE',    -- Deactivated
    'BLACKLISTED'  -- Permanently blocked
);
```

#### 7.3 reseller_contacts

```sql
CREATE TABLE reseller_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    role VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_reseller_contacts_reseller ON reseller_contacts(reseller_id);
```

---

### 8. Sales

#### 8.1 sales

```sql
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_number VARCHAR(30) NOT NULL UNIQUE,
    branch_id UUID NOT NULL REFERENCES branches(id),
    seller_id UUID REFERENCES users(id),
    member_id UUID REFERENCES members(id),
    reseller_id UUID REFERENCES resellers(id),
    sale_type SALE_TYPE NOT NULL DEFAULT 'RETAIL',
    status SALE_STATUS NOT NULL DEFAULT 'COMPLETED',
    subtotal DECIMAL(14, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
    points_earned INTEGER NOT NULL DEFAULT 0,
    points_redeemed INTEGER NOT NULL DEFAULT 0,
    payment_method VARCHAR(50),
    notes TEXT,
    synced_from_pos BOOLEAN NOT NULL DEFAULT false,
    local_id UUID, -- POS local ID for sync
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sales_number ON sales(sale_number);
CREATE INDEX idx_sales_branch ON sales(branch_id);
CREATE INDEX idx_sales_member ON sales(member_id);
CREATE INDEX idx_sales_reseller ON sales(reseller_id);
CREATE INDEX idx_sales_created ON sales(created_at);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_local ON sales(local_id);
```

#### 8.2 sale_types Enum

```sql
CREATE TYPE SALE_TYPE AS ENUM (
    'RETAIL',      -- Regular customer sale
    'MEMBER',      -- Member sale
    'RESELLER',    -- Reseller order
    'ONLINE',      -- Online order
    'PHONE',       -- Phone order
    'WHOLESALE'    -- Wholesale order
);
```

#### 8.3 sale_status Enum

```sql
CREATE TYPE SALE_STATUS AS ENUM (
    'DRAFT',       -- Pending completion
    'COMPLETED',   -- Paid and completed
    'CANCELLED',   -- Cancelled
    'REFUNDED',    -- Refunded
    'ON_HOLD'      -- On hold
);
```

#### 8.4 sale_items

```sql
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    original_price DECIMAL(12, 2), -- Price before discount
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_price DECIMAL(14, 2) NOT NULL DEFAULT 0,
    points_earned INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_variant ON sale_items(variant_id);
```

#### 8.5 payments

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_method PAYMENT_METHOD NOT NULL,
    amount DECIMAL(14, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'PHP',
    reference_number VARCHAR(100),
    card_last_four VARCHAR(4),
    card_brand VARCHAR(50),
    payment_gateway VARCHAR(50),
    gateway_reference VARCHAR(255),
    status PAYMENT_STATUS NOT NULL DEFAULT 'COMPLETED',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_payments_sale ON payments(sale_id);
CREATE INDEX idx_payments_status ON payments(status);
```

#### 8.6 payment_methods Enum

```sql
CREATE TYPE PAYMENT_METHOD AS ENUM (
    'CASH',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'GCASH',
    'PAYMAYA',
    'BANK_TRANSFER',
    'CHEQUE',
    'CREDIT_ACCOUNT' -- Reseller credit payment
);
```

#### 8.7 payment_status Enum

```sql
CREATE TYPE PAYMENT_STATUS AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED',
    'CANCELLED'
);
```

---

### 9. Ledger & Credit

#### 9.1 ledger_entries

```sql
CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
    entry_type LEDGER_ENTRY_TYPE NOT NULL,
    amount DECIMAL(14, 2) NOT NULL, -- Positive for credit, negative for debit
    balance_after DECIMAL(14, 2) NOT NULL,
    reference_type VARCHAR(50), -- 'SALE', 'PAYMENT', 'ADJUSTMENT', 'CREDIT_NOTE'
    reference_id UUID,
    description TEXT,
    due_date DATE,
    is_paid BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_ledger_reseller ON ledger_entries(reseller_id);
CREATE INDEX idx_ledger_type ON ledger_entries(entry_type);
CREATE INDEX idx_ledger_reference ON ledger_entries(reference_type, reference_id);
CREATE INDEX idx_ledger_due ON ledger_entries(due_date, is_paid);
```

#### 9.2 ledger_entry_types Enum

```sql
CREATE TYPE LEDGER_ENTRY_TYPE AS ENUM (
    'CREDIT',          -- Added credit (payment received)
    'DEBIT',           -- Debit (sale made on credit)
    'PAYMENT',         -- Payment received
    'CREDIT_NOTE',     -- Credit note issued
    'DEBIT_NOTE',      -- Debit note issued
    'INTEREST',        -- Interest charge
    'ADJUSTMENT'       -- Manual adjustment
);
```

#### 9.3 payments_received

```sql
CREATE TABLE payments_received (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
    amount DECIMAL(14, 2) NOT NULL,
    payment_method PAYMENT_METHOD NOT NULL,
    reference_number VARCHAR(100),
    bank_name VARCHAR(100),
    cheque_number VARCHAR(50),
    received_by UUID REFERENCES users(id),
    receipt_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_payments_received_reseller ON payments_received(reseller_id);
CREATE INDEX idx_payments_received_date ON payments_received(created_at);
```

---

### 10. Sync & Offline Support

#### 10.1 sync_transactions

```sql
CREATE TABLE sync_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id UUID NOT NULL, -- POS local UUID
    entity_type VARCHAR(50) NOT NULL, -- 'SALE', 'PAYMENT', 'STOCK_ADJUSTMENT'
    entity_id UUID NOT NULL,
    branch_id UUID NOT NULL REFERENCES branches(id),
    operation SYNC_OPERATION NOT NULL,
    payload JSONB NOT NULL,
    status SYNC_STATUS NOT NULL DEFAULT 'PENDING',
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_transactions_local ON sync_transactions(local_id);
CREATE INDEX idx_sync_transactions_entity ON sync_transactions(entity_type, entity_id);
CREATE INDEX idx_sync_transactions_status ON sync_transactions(status);
CREATE INDEX idx_sync_transactions_branch ON sync_transactions(branch_id);
```

#### 10.2 sync_operations Enum

```sql
CREATE TYPE SYNC_OPERATION AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE'
);
```

#### 10.3 sync_status Enum

```sql
CREATE TYPE SYNC_STATUS AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'CONFLICT'
);
```

#### 10.4 sync_conflicts

```sql
CREATE TABLE sync_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_transaction_id UUID NOT NULL REFERENCES sync_transactions(id),
    local_data JSONB NOT NULL,
    server_data JSONB NOT NULL,
    resolution SYNC_RESOLUTION,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

#### 10.5 sync_resolutions Enum

```sql
CREATE TYPE SYNC_RESOLUTION AS ENUM (
    'SERVER_WINS',
    'LOCAL_WINS',
    'MERGE',
    'MANUAL'
);
```

#### 10.6 sync_metadata

```sql
CREATE TABLE sync_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id),
    entity_type VARCHAR(50) NOT NULL,
    last_sync_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_sync_token VARCHAR(100),
    record_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(branch_id, entity_type)
);
```

---

### 11. Audit Trail

#### 11.1 audit_logs

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action AUDIT_ACTION NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_fields JSONB,
    user_id UUID REFERENCES users(id),
    branch_id UUID REFERENCES branches(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
CREATE INDEX idx_audit_action ON audit_logs(action);
```

#### 11.2 audit_actions Enum

```sql
CREATE TYPE AUDIT_ACTION AS ENUM (
    'CREATE',
    'READ',
    'UPDATE',
    'DELETE',
    'LOGIN',
    'LOGOUT',
    'PRINT',
    'EXPORT',
    'SYNC'
);
```

---

## Core Aggregate Relationships

```
User → Branch (assigned to)
Branch → Stock (has)
Product → Variant (has)
Variant → Stock (per branch)
Variant → PriceTier (per price profile)
Variant → SaleItem (in sales)
Member → Sale (makes)
Reseller → Sale (makes)
Reseller → LedgerEntry (has)
Sale → SaleItem (contains)
Sale → Payment (has)
```

---

## Offline POS Schema (SQLite)

For offline POS, the following tables are replicated locally:

```sql
-- Simplified local tables for SQLite
CREATE TABLE local_products (
    id TEXT PRIMARY KEY, -- Local UUID
    server_id TEXT, -- Server UUID after sync
    sync_status TEXT DEFAULT 'PENDING',
    -- ... product fields
);

CREATE TABLE local_sales (
    id TEXT PRIMARY KEY,
    server_id TEXT,
    sync_status TEXT DEFAULT 'PENDING',
    -- ... sale fields
);

CREATE TABLE local_payments (
    id TEXT PRIMARY KEY,
    server_id TEXT,
    sync_status TEXT DEFAULT 'PENDING',
    -- ... payment fields
);

CREATE TABLE local_stock_adjustments (
    id TEXT PRIMARY KEY,
    server_id TEXT,
    sync_status TEXT DEFAULT 'PENDING',
    -- ... adjustment fields
);

CREATE TABLE sync_queue (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload TEXT NOT NULL,
    retry_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);
```

---

## Performance Considerations

### Indexes for Performance
- Primary keys are indexed by default
- Foreign keys have indexes for join performance
- Date range queries have appropriate indexes
- Status fields are indexed for filtering

### Query Optimization
- Use covering indexes for frequent queries
- Partition large tables (sales, audit_logs) by date
- Use materialized views for reports
- Implement connection pooling with PgBouncer

---

## Next Steps

1. Create database migrations in NestJS typeorm/prisma
2. Set up initial seed data (default users, branches, categories)
3. Create database connection and configuration
4. Implement repository layer for each entity
5. Create service layer with business logic
