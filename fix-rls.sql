-- SCRIPT DE CORRECCIÓN PARA RLS EN SUPABASE
-- Ejecutar en el SQL Editor de Supabase

-- 1. Desactivar RLS temporalmente para limpiar
ALTER TABLE services DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes que pueden estar causando problemas
DROP POLICY IF EXISTS "Users can view their own services" ON services;
DROP POLICY IF EXISTS "Users can insert their own services" ON services;
DROP POLICY IF EXISTS "Users can update their own services" ON services;
DROP POLICY IF EXISTS "Users can delete their own services" ON services;

-- 3. Crear política pública para SELECT (todos pueden ver todos los servicios)
CREATE POLICY "Public can view all services" ON services
  FOR SELECT USING (true);

-- 4. Crear política para INSERT (solo usuarios autenticados pueden crear)
CREATE POLICY "Authenticated users can create services" ON services
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 5. Crear política para UPDATE (solo el propietario puede actualizar)
CREATE POLICY "Users can update their own services" ON services
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = user_id);

-- 6. Crear política para DELETE (solo el propietario puede eliminar)
CREATE POLICY "Users can delete their own services" ON services
  FOR DELETE TO authenticated
  USING (auth.uid()::text = user_id);

-- 7. Reactivar RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- 8. Verificar que la tabla está configurada correctamente
SELECT schemaname, tablename, rowsecurity, restrictive
FROM pg_tables 
WHERE tablename = 'services';

-- 9. Mostrar políticas creadas
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'services';

-- 10. Insertar un servicio de prueba (reemplaza 'test-user-id' con un ID real)
INSERT INTO services (
  title, 
  description, 
  price, 
  currency, 
  is_physical, 
  is_online, 
  payment_type,
  preferred_payment_method,
  user_id
) VALUES (
  'Servicio de prueba',
  'Este es un servicio de prueba para verificar la funcionalidad',
  25.00,
  'EUR',
  true,
  false,
  'paid',
  'stripe',
  'test-user-id'
);

-- 11. Verificar que el servicio se creó correctamente
SELECT id, title, user_id, created_at FROM services WHERE title = 'Servicio de prueba';
