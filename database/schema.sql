-- ============================================
-- SADAF Database Schema — Supabase / PostgreSQL
-- ============================================

-- 1. customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. measurements
CREATE TABLE measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  height NUMERIC,
  weight NUMERIC,
  shoulder NUMERIC,
  chest NUMERIC,
  waist NUMERIC,
  hip NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ai_studio
CREATE TABLE ai_studio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  prompt TEXT,
  image_url TEXT,
  style TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ai_fitting_room
CREATE TABLE ai_fitting_room (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  measurement_id UUID REFERENCES measurements(id) ON DELETE SET NULL,
  ai_studio_id UUID REFERENCES ai_studio(id) ON DELETE SET NULL,
  result_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. employees
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. coupons
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC NOT NULL,
  min_order NUMERIC DEFAULT 0,
  max_uses INT,
  used_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. atelier_orders
CREATE TABLE atelier_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  measurement_id UUID REFERENCES measurements(id) ON DELETE SET NULL,
  ai_studio_id UUID REFERENCES ai_studio(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  fabric TEXT,
  colors TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','in_progress','ready','delivered','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT,
  image_url TEXT,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  total_price NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. order_items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL
);

-- 11. payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  atelier_order_id UUID REFERENCES atelier_orders(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  method TEXT CHECK (method IN ('card','cash','wallet','bank_transfer')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
  transaction_ref TEXT,
  paid_at TIMESTAMPTZ
);

-- 12. shipping
CREATE TABLE shipping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  atelier_order_id UUID REFERENCES atelier_orders(id) ON DELETE SET NULL,
  carrier TEXT,
  tracking_number TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','shipped','out_for_delivery','delivered','returned')),
  address TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- 13. coupon_usage
CREATE TABLE coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ DEFAULT now()
);

-- 14. reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. wishlist
CREATE TABLE wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, product_id)
);

-- 16. notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT,
  title TEXT,
  body TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 17. messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  message TEXT,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Auto-update updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_atelier_orders_updated
  BEFORE UPDATE ON atelier_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
