# Perfumería Joaquín — Web

Tienda online (catálogo + checkout con Mercado Pago + contacto por WhatsApp).
Ver `plan-de-trabajo-tienda-perfumes.md` en el proyecto de Claude para el plan completo.

## Fase 0 — Setup (pasos manuales que hay que hacer una sola vez)

Estos pasos no se pueden automatizar del todo porque requieren crear cuentas
y hacer clicks en dashboards externos. Marcá cada uno a medida que lo hagas:

- [ ] **GitHub**: crear un repo nuevo (privado o público) y subir este proyecto.
  ```bash
  git init
  git add .
  git commit -m "Setup inicial: Next.js + Supabase + Mercado Pago"
  git remote add origin <URL-DE-TU-REPO>
  git push -u origin main
  ```

- [ ] **Supabase**: crear cuenta y proyecto nuevo en [supabase.com](https://supabase.com).
  1. Anotar la **Project URL** y la **anon key** (Project Settings > API).
  2. Anotar la **service_role key** (misma pantalla, con advertencia roja — es secreta).
  3. Ir a **SQL Editor** y correr todo el contenido de `supabase/schema.sql`.
  4. Ir a **Authentication > Users** y crear un usuario para el admin (email + contraseña fuerte).
  5. Copiar el UUID de ese usuario y correr en el SQL Editor:
     ```sql
     insert into admin_users (user_id) values ('EL-UUID-QUE-COPIASTE');
     ```
  6. Si el plan lo permite, activar 2FA para esa cuenta desde Authentication.

- [ ] **Mercado Pago**: crear cuenta de developer en
  [mercadopago.com.ar/developers/panel](https://www.mercadopago.com.ar/developers/panel).
  1. Crear una aplicación de tipo "Checkout Pro".
  2. Copiar el **Access Token de TEST** (no el de producción todavía).
  3. Configurar el webhook apuntando a `https://tu-dominio.vercel.app/api/mercadopago/webhook`
     y copiar la **clave secreta** que se usa para validar la firma.

- [ ] **Variables de entorno locales**:
  ```bash
  cp .env.example .env.local
  ```
  Completar `.env.local` con los valores reales de Supabase y Mercado Pago (test).

- [ ] **Instalar dependencias y correr en local**:
  ```bash
  npm install
  npm run dev
  ```
  Abrir [http://localhost:3000](http://localhost:3000).

- [ ] **Migrar el catálogo real** (192 productos ya relevados de la tienda actual):
  ```bash
  npm run migrate:catalog
  ```
  Esto infiere marca/ml/categoría a partir del nombre — revisar después
  desde el panel de admin (Fase 2) y corregir lo que haga falta a mano,
  y completar el **stock real** (el CSV original no lo traía).

- [ ] **Vercel**: conectar el repo de GitHub en [vercel.com](https://vercel.com)
  para que cada push a `main` se despliegue solo. Cargar las mismas
  variables de entorno de `.env.local` en Settings > Environment Variables
  (con las credenciales de test por ahora; recién se cambian a producción
  en la Fase 6, justo antes de lanzar).

## Estructura del proyecto

```
app/                  → páginas (frontend) y API routes (backend), Next.js App Router
  api/                → lógica de servidor: checkout, webhook de Mercado Pago, etc.
lib/supabase/
  client.ts           → cliente de Supabase para el navegador (anon key, respeta RLS)
  server.ts           → cliente de Supabase para Server Components (anon key + sesión)
  admin.ts            → cliente con service_role key, SOLO para usar en app/api/**
supabase/
  schema.sql          → esquema completo con RLS activado desde el día uno
scripts/
  migrate-catalog.ts  → migra el catálogo real (CSV) a Supabase
.env.example          → plantilla de variables de entorno (copiar a .env.local)
```

## Seguridad — reglas que no se negocian

Ver el checklist completo en la sección 5 del plan de trabajo. Los dos puntos
más importantes, resumidos:

1. El precio de un pedido **siempre** se recalcula en el servidor consultando
   `products` por `id`. Nunca se confía en un precio recibido del navegador.
2. El webhook de Mercado Pago valida la firma (`x-signature`) antes de marcar
   un pedido como `paid`. El estado de un pedido nunca lo define el redirect
   del usuario a la página de éxito.
