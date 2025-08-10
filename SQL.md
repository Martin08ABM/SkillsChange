# CONFIGURACIÓN DE BASE DE DATOS - SKILLSCHANGE

## 📋 INSTRUCCIONES PASO A PASO

### 1. ACCEDER A SUPABASE
1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto SkillsChange
4. En el menú lateral, haz clic en "SQL Editor"

### 2. EJECUTAR LOS SCRIPTS SQL
Copia y pega cada script en el orden indicado. Haz clic en "RUN" después de cada uno.

---

## 📊 SCRIPT 1: CREAR TABLA DE SERVICIOS

```sql
-- 1. CREATE SERVICES TABLE
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  image_url TEXT,
  is_physical BOOLEAN NOT NULL DEFAULT false,
  is_online BOOLEAN NOT NULL DEFAULT false,
  payment_type VARCHAR(10) NOT NULL DEFAULT 'paid' CHECK (payment_type IN ('paid', 'barter')),
  preferred_payment_method VARCHAR(10) CHECK (preferred_payment_method IN ('stripe', 'paypal')),
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for services table
CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_services_payment_type ON services(payment_type);
CREATE INDEX idx_services_created_at ON services(created_at);
```

---

## 💰 SCRIPT 2: CREAR TABLA DE TRANSACCIONES (COMISIONES)

```sql
-- 2. CREATE TRANSACTIONS TABLE
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL,
  buyer_id VARCHAR(255) NOT NULL,
  seller_id VARCHAR(255) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  commission_amount DECIMAL(10, 2) NOT NULL,
  seller_amount DECIMAL(10, 2) NOT NULL,
  commission_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.10,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  payment_method VARCHAR(10) NOT NULL CHECK (payment_method IN ('stripe', 'paypal')),
  payment_id VARCHAR(255) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for transactions table
CREATE INDEX idx_transactions_service_id ON transactions(service_id);
CREATE INDEX idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_payment_id ON transactions(payment_id);
```

---

## 👥 SCRIPT 3: CREAR TABLA DE USUARIOS (OPCIONAL)

```sql
-- 3. CREATE USERS TABLE (OPTIONAL)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users table
CREATE INDEX idx_users_email ON users(email);
```

---

## 🔗 SCRIPT 4: CREAR RELACIONES ENTRE TABLAS

```sql
-- 4. CREATE FOREIGN KEY CONSTRAINTS
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_service_id 
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;
```

---

## ⚙️ SCRIPT 5: CREAR FUNCIONES Y TRIGGERS

```sql
-- 5. CREATE TRIGGER FUNCTIONS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. CREATE TRIGGERS
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 📈 SCRIPT 6: CREAR VISTAS PARA ESTADÍSTICAS

```sql
-- 7. CREATE VIEWS
CREATE VIEW commission_earnings AS
SELECT 
  currency,
  SUM(commission_amount) as total_commission,
  COUNT(*) as transaction_count,
  AVG(commission_amount) as avg_commission,
  DATE_TRUNC('month', created_at) as month
FROM transactions 
WHERE status = 'completed'
GROUP BY currency, DATE_TRUNC('month', created_at)
ORDER BY month DESC;

CREATE VIEW seller_earnings AS
SELECT 
  seller_id,
  currency,
  SUM(seller_amount) as total_earnings,
  COUNT(*) as transaction_count,
  AVG(seller_amount) as avg_earning
FROM transactions 
WHERE status = 'completed'
GROUP BY seller_id, currency;

CREATE VIEW service_stats AS
SELECT 
  s.id,
  s.title,
  s.user_id,
  s.price,
  s.currency,
  COUNT(t.id) as transaction_count,
  SUM(CASE WHEN t.status = 'completed' THEN t.total_amount ELSE 0 END) as total_revenue,
  SUM(CASE WHEN t.status = 'completed' THEN t.seller_amount ELSE 0 END) as seller_revenue,
  SUM(CASE WHEN t.status = 'completed' THEN t.commission_amount ELSE 0 END) as commission_revenue
FROM services s
LEFT JOIN transactions t ON s.id = t.service_id
GROUP BY s.id, s.title, s.user_id, s.price, s.currency;
```

---

## 🔒 SCRIPT 7: CONFIGURAR SEGURIDAD (RLS)

```sql
-- 8. CREATE RLS POLICIES (ROW LEVEL SECURITY)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for services - users can only see their own services
CREATE POLICY "Users can view their own services" ON services
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own services" ON services
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own services" ON services
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own services" ON services
  FOR DELETE USING (auth.uid()::text = user_id);

-- Policy for transactions - users can see transactions they're involved in
CREATE POLICY "Users can view their transactions" ON transactions
  FOR SELECT USING (auth.uid()::text = buyer_id OR auth.uid()::text = seller_id);

-- Policy for users - users can only see their own data
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);
```

---

## 📊 SCRIPT 8: FUNCIONES DE ADMINISTRACIÓN

```sql
-- 9. CREATE ADMIN FUNCTIONS
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS TABLE(
  total_services bigint,
  total_transactions bigint,
  total_commission_eur decimal,
  total_revenue_eur decimal,
  active_users bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM services),
    (SELECT COUNT(*) FROM transactions WHERE status = 'completed'),
    (SELECT COALESCE(SUM(commission_amount), 0) FROM transactions WHERE status = 'completed' AND currency = 'EUR'),
    (SELECT COALESCE(SUM(total_amount), 0) FROM transactions WHERE status = 'completed' AND currency = 'EUR'),
    (SELECT COUNT(DISTINCT user_id) FROM services);
END;
$$ LANGUAGE plpgsql;
```

---

## 🌟 SCRIPT 9: DATOS DE EJEMPLO (OPCIONAL)

```sql
-- 10. INSERT SAMPLE DATA (OPTIONAL)
INSERT INTO services (title, description, price, currency, is_physical, is_online, payment_type, preferred_payment_method, user_id) VALUES
('Clases de Programación', 'Aprende a programar en Python desde cero', 50.00, 'EUR', false, true, 'paid', 'stripe', 'sample-user-1'),
('Diseño de Logos', 'Diseño personalizado de logos para tu empresa', 75.00, 'EUR', false, true, 'paid', 'paypal', 'sample-user-2'),
('Reparación de Bicicletas', 'Servicio de reparación y mantenimiento de bicicletas', 30.00, 'EUR', true, false, 'paid', 'stripe', 'sample-user-3');
```

---

## ✅ VERIFICACIÓN

Para verificar que todo funciona correctamente, ejecuta:

```sql
-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Ver estadísticas de la plataforma
SELECT * FROM get_platform_stats();

-- Ver comisiones ganadas
SELECT * FROM commission_earnings;
```

---

## 📝 EXPLICACIÓN DEL SISTEMA DE COMISIONES

### ¿Cómo funciona?

1. **Cuando un usuario compra un servicio:**
   - Precio original: 100€
   - Comisión (10%): 10€
   - El vendedor recibe: 90€
   - La plataforma recibe: 10€

2. **Registro en la base de datos:**
   - `total_amount`: 100€ (lo que paga el comprador)
   - `commission_amount`: 10€ (lo que gana la plataforma)
   - `seller_amount`: 90€ (lo que recibe el vendedor)

3. **Seguimiento:**
   - Todas las transacciones se registran en la tabla `transactions`
   - Puedes ver tus ganancias en la vista `commission_earnings`

### Tasa de comisión actual: 10%

Esta tasa está configurada en el código y se puede ajustar fácilmente. Comparado con otras plataformas:
- **Fiverr**: 20%
- **Upwork**: 10-20%
- **Freelancer**: 10%
- **Tu plataforma**: 10% ✅

---

## 🚀 PRÓXIMOS PASOS

1. Ejecuta todos los scripts en orden
2. Verifica que las tablas se crearon correctamente
3. Prueba crear un servicio desde tu aplicación
4. Realiza una transacción de prueba
5. Verifica que las comisiones se calculen correctamente

¡Tu sistema de comisiones está listo para funcionar! 🎉
