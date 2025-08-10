# Sistema de Pagos - SkillsChange

Este documento explica cómo configurar y usar el sistema de pagos integrado con Stripe y PayPal en la aplicación SkillsChange.

## 🚀 Características Implementadas

- ✅ Integración con Stripe para pagos con tarjeta de crédito/débito
- ✅ Integración con PayPal para pagos con PayPal y tarjetas
- ✅ Formulario de creación de servicios con opciones de pago
- ✅ Página de éxito de pago
- ✅ Validación de formularios y manejo de errores
- ✅ Marketplace de servicios con compra directa

## 📋 Configuración Inicial

### 1. Variables de Entorno

Las siguientes variables ya están añadidas al archivo `.env`. Debes configurarlas con tus credenciales reales:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
PAYPAL_SANDBOX=true

# Application URL
APP_URL=http://localhost:4321
```

### 2. Configuración de Stripe

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/)
2. Crea una cuenta o inicia sesión
3. Ve a "Developers" > "API Keys"
4. Copia la "Publishable key" y "Secret key"
5. Reemplaza en el archivo `.env`:
   - `STRIPE_SECRET_KEY` con tu Secret Key
   - `PUBLIC_STRIPE_PUBLISHABLE_KEY` con tu Publishable Key

### 3. Configuración de PayPal

1. Ve a [PayPal Developer](https://developer.paypal.com/)
2. Crea una cuenta o inicia sesión
3. Ve a "My Apps & Credentials"
4. Crea una nueva aplicación
5. Copia el "Client ID" y "Client Secret"
6. Reemplaza en el archivo `.env`:
   - `PAYPAL_CLIENT_ID` con tu Client ID
   - `PAYPAL_CLIENT_SECRET` con tu Client Secret
   - Mantén `PAYPAL_SANDBOX=true` para pruebas

### 4. Instalar Dependencias

Las dependencias ya están instaladas, pero si necesitas reinstalarlas:

```bash
npm install stripe @paypal/paypal-server-sdk
```

## 🔧 Uso del Sistema

### Para Proveedores de Servicios

1. Ve a `/add-service`
2. Completa el formulario del servicio
3. Selecciona "Pago" como método
4. Introduce el precio del servicio
5. Selecciona el proveedor de pago (Stripe o PayPal)
6. Haz clic en "Publicar"

### Para Compradores

1. Ve a `/services` para ver los servicios disponibles
2. Haz clic en "Comprar Ahora" en el servicio deseado
3. Serás redirigido al checkout correspondiente (Stripe o PayPal)
4. Completa el pago
5. Serás redirigido a la página de éxito

## 📁 Estructura de Archivos

```
src/
├── pages/
│   ├── add-service.astro          # Formulario de creación de servicios
│   ├── services.astro             # Marketplace de servicios
│   ├── payment-success.astro      # Página de éxito de pago
│   └── api/
│       └── payments/
│           ├── stripe.ts          # Endpoint de Stripe
│           └── paypal.ts          # Endpoint de PayPal
├── components/
│   ├── Header.astro
│   ├── Footer.astro
│   └── NavBar.astro
└── layouts/
    └── Layout.astro
```

## 🔄 Flujo de Pago

### Stripe
1. Usuario selecciona Stripe como método de pago
2. Se llama al endpoint `/api/payments/stripe`
3. Se crea una sesión de Stripe Checkout
4. Usuario es redirigido a Stripe Checkout
5. Después del pago, regresa a `/payment-success`

### PayPal
1. Usuario selecciona PayPal como método de pago
2. Se llama al endpoint `/api/payments/paypal`
3. Se crea una orden de PayPal
4. Usuario es redirigido a PayPal
5. Después del pago, regresa a `/payment-success`
6. Se captura automáticamente el pago

## 🛡️ Seguridad

- Las claves secretas se mantienen en el servidor
- Los pagos se procesan en entornos seguros (Stripe/PayPal)
- Validación de formularios tanto en cliente como servidor
- Manejo de errores y estados de carga

## 🧪 Pruebas

### Stripe Test Cards
- **Visa**: 4242 4242 4242 4242
- **Mastercard**: 5555 5555 5555 4444
- **American Express**: 3782 822463 10005
- **Declined**: 4000 0000 0000 0002

### PayPal Test Account
- Usa tu cuenta sandbox de PayPal Developer
- Crea cuentas de prueba para comprador y vendedor

## 🚨 Notas Importantes

1. **Producción**: Cambia `PAYPAL_SANDBOX=false` y usa las claves de producción
2. **HTTPS**: En producción, asegúrate de usar HTTPS
3. **Webhooks**: Considera implementar webhooks para confirmaciones de pago
4. **Base de Datos**: Integra con tu base de datos para persistir transacciones
5. **Validación**: Añade validación adicional según tus necesidades

## 🐛 Resolución de Problemas

### Error: "Invalid API Key"
- Verifica que las claves en `.env` sean correctas
- Asegúrate de que no haya espacios adicionales

### Error: "CORS"
- Verifica que `APP_URL` esté configurado correctamente
- Asegúrate de que el dominio esté autorizado en Stripe/PayPal

### Error: "Session not found"
- Verifica que la sesión de Stripe sea válida
- Revisa los logs del servidor para más detalles

## 📞 Soporte

Para problemas específicos:
- [Stripe Documentation](https://stripe.com/docs)
- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [Astro Documentation](https://docs.astro.build/)

## 🎯 Próximos Pasos

1. Integrar con base de datos para persistir servicios y transacciones
2. Implementar webhooks para confirmaciones de pago
3. Añadir sistema de reembolsos
4. Implementar dashboard de vendedor
5. Añadir más métodos de pago (Apple Pay, Google Pay)
