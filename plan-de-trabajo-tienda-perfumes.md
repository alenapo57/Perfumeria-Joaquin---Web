# Plan de trabajo — Tienda online de perfumes

**Versión:** 1.0
**Fecha:** Julio 2026
**Tipo de proyecto:** Sitio web e-commerce (catálogo + pagos online + contacto por WhatsApp)

---

## 1. Resumen ejecutivo

Desarrollo de una tienda online profesional para Perfumería Joaquín (actualmente en Tiendanegocio, [perfumeriajoaquin.tiendanegocio.com](https://perfumeriajoaquin.tiendanegocio.com/)), con catálogo de productos, checkout con pagos online (tarjeta y Mercado Pago) y contacto directo por WhatsApp. El proyecto se construye como una aplicación **full-stack monolítica** (frontend y backend en el mismo código), priorizando velocidad de desarrollo, bajo costo de infraestructura y seguridad desde el diseño.

### Datos reales del negocio (relevados de la tienda actual)
- **Catálogo actual:** 192 productos activos, con precios que van de $54.600 a $198.500.
- **Categorías:** Árabes Originales, Réplicas, Yves D'Orgeval, Nacionales, Otros.
- **Envíos:** gratis en San Carlos de Bolívar, y gratis a todo el país en compras superiores a $100.000 (Correo Argentino / Andreani).
- **Cuotas:** todos los productos se muestran con "hasta 3 cuotas sin interés" (feature de Mercado Pago a activar en el checkout).
- **Showroom físico:** Sarmiento 625, San Carlos de Bolívar.
- **Contacto:** WhatsApp +54 9 11 7358-7226, email perfumeriajoaquin@gmail.com.
- **Redes:** Instagram, Facebook y TikTok (@perfumeriajoaquin).

### Objetivos
- Reemplazar la presencia actual en Tiendamia por una web propia, profesional y de carga rápida.
- Permitir compras online seguras con tarjeta de crédito/débito y Mercado Pago.
- Dar a la persona dueña del negocio un panel simple para cargar y editar productos sin tocar código.
- Mantener el costo de infraestructura en cero o casi cero mientras el negocio sea chico/mediano.

### Fuera de alcance (por ahora)
- App mobile nativa (queda documentada como posible fase futura, ver sección 9).
- Backend separado del frontend (se justifica solo si aparece la app mobile).
- Integración con WhatsApp Business API (se usa link directo `wa.me`, no la API paga).

---

## 2. Stack tecnológico

| Capa | Tecnología | Costo | Motivo |
|---|---|---|---|
| Frontend + Backend | Next.js 14+ (App Router) + TypeScript | Gratis | Un solo proyecto, API routes para lógica de servidor, SEO nativo |
| Estilos | Tailwind CSS | Gratis | Rápido de mantener, responsive por defecto |
| Base de datos | Supabase (Postgres) | Gratis (tier free) | SQL real, Auth y Storage incluidos |
| Almacenamiento de imágenes | Supabase Storage | Gratis (tier free) | Integrado con la misma base |
| Autenticación (panel admin) | Supabase Auth | Gratis | Login seguro sin desarrollarlo desde cero |
| Pagos | Mercado Pago Checkout Pro (SDK oficial) | Gratis (comisión por venta) | Estándar en Argentina, soporta tarjeta y cuotas |
| Hosting | Vercel | Gratis (tier hobby) | Deploy automático desde GitHub, HTTPS incluido |
| Dominio | `.com.ar` (NIC.ar) o `.com` | ~3.000-4.500 ARS/año o ~10-12 USD/año | Imagen profesional, evita `.vercel.app` |
| Emails transaccionales | Resend | Gratis (tier free) | Avisar pedidos nuevos por mail |
| Analytics | Vercel Analytics o Plausible | Gratis / bajo costo | Saber qué productos se ven más |
| Control de versiones | GitHub | Gratis | Deploy automático + historial de cambios |

**Nota sobre el monolito:** frontend y backend viven en el mismo proyecto Next.js. Las páginas públicas (`app/`) conviven con las API routes (`app/api/`), que corren en servidor y concentran toda la lógica sensible (crear preferencia de pago, validar webhooks, escribir en la base de datos). No se separa en un backend independiente porque hoy no hay una segunda app (mobile) que lo justifique.

---

## 3. Arquitectura

```
Cliente (navegador)
        │
        ▼
Next.js en Vercel  (catálogo + checkout)
        │
        ├──► Supabase       → productos, imágenes, pedidos
        ├──► Mercado Pago   → cobro con tarjeta/cuotas
        └──► WhatsApp       → link directo de consulta (wa.me)
```

- El navegador solo habla con Next.js.
- Next.js (desde el servidor, nunca desde el cliente) habla con Supabase y Mercado Pago.
- El botón de WhatsApp no pasa por el servidor: es un link directo `https://wa.me/549XXXXXXXXXX`.

---

## 4. Modelo de datos (Supabase / Postgres)

### Tabla `categories`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| name | text | ej. "Réplicas", "Árabes Originales", "Yves D'Orgeval", "Nacionales", "Otros" |
| parent_id | uuid (FK, nullable) | permite subcategorías, ej. "Réplicas → Diseñador", "Nacionales → Hombre/Mujer" |
| slug | text (unique) | |

### Tabla `products`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| name | text | |
| slug | text (unique) | para URLs amigables |
| description | text | |
| price | numeric | en ARS |
| stock | integer | |
| brand | text | ej. Armaf, Afnan, Al Haramain, Lattafa, Xerjoff (alternativo), etc. |
| category_id | uuid (FK) | referencia a `categories` |
| ml | integer | volumen en ml (60/75/85/90/100/105/120), útil para variantes |
| installments_enabled | boolean | refleja el "hasta 3 cuotas sin interés" que ya usan hoy |
| image_url | text | apunta a Supabase Storage |
| active | boolean | para ocultar sin borrar |
| created_at | timestamp | |

### Tabla `shipping_rules`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| zone | text | `local` (San Carlos de Bolívar) / `nacional` |
| free_from_amount | numeric | monto a partir del cual el envío es gratis (hoy $100.000 a nivel nacional; local siempre gratis) |
| fixed_cost | numeric | costo fijo de envío nacional si no supera el monto mínimo |

### Tabla `orders`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| customer_name | text | |
| customer_phone | text | |
| items | jsonb | snapshot de productos y cantidades al momento de compra |
| total | numeric | **calculado en el servidor, nunca recibido del cliente** |
| status | text | `pending`, `paid`, `cancelled` |
| mp_payment_id | text | id de pago de Mercado Pago |
| created_at | timestamp | |

### Tabla `admin_users`
Gestionada por Supabase Auth (no se crea a mano). Un único rol de administrador por ahora.

---

## 5. Medidas de seguridad (obligatorias antes de lanzar)

### 5.1 Pagos
- [ ] El precio de cada pedido se recalcula **siempre en el servidor** consultando `products` por `id`. Nunca se confía en un precio enviado desde el navegador.
- [ ] La preferencia de pago de Mercado Pago se crea desde una API route (`/api/checkout`), nunca desde el cliente.
- [ ] El webhook de Mercado Pago (`/api/mercadopago/webhook`) valida la firma (`x-signature`) antes de marcar un pedido como pagado.
- [ ] El estado "pagado" de un pedido se define **únicamente** por la confirmación del webhook, nunca por la redirección del usuario a la página de éxito.
- [ ] Los datos de tarjeta nunca pasan por nuestro servidor ni se almacenan (los maneja Mercado Pago directamente).

### 5.2 Base de datos (Supabase)
- [ ] Row Level Security (RLS) activado en **todas** las tablas.
- [ ] `products`: lectura pública permitida, escritura solo para el rol admin autenticado.
- [ ] `orders`: un cliente no puede leer pedidos ajenos; solo el admin tiene lectura completa.
- [ ] La `service_role key` de Supabase se usa **solo** en API routes del servidor, nunca en el frontend.

### 5.3 Variables de entorno y secretos
- [ ] Access token de Mercado Pago, service role key de Supabase y cualquier secreto van en variables de entorno (`.env.local`), nunca en el código ni en GitHub.
- [ ] Ninguna variable secreta usa el prefijo `NEXT_PUBLIC_` (ese prefijo las expone al navegador).
- [ ] Las mismas variables se configuran en el dashboard de Vercel para producción, separadas de desarrollo.

### 5.4 Panel de administración
- [ ] Login con Supabase Auth (no se implementa un sistema propio).
- [ ] Contraseña fuerte obligatoria para la cuenta admin.
- [ ] 2FA activado si Supabase Auth lo permite en el plan usado.
- [ ] Verificación de rol de administrador en el servidor (API route / middleware), no solo ocultando el link en el frontend.

### 5.5 Infraestructura general
- [ ] HTTPS activo (automático con Vercel).
- [ ] Validación de todo input de usuario (formularios de contacto, búsqueda) antes de usarlo en consultas.
- [ ] Uso del cliente oficial de Supabase para queries (evita SQL injection por diseño).
- [ ] Rate limiting básico en `/api/checkout` para evitar creación masiva de pedidos falsos (Vercel provee protección base; opcionalmente sumar Upstash, tier gratis).
- [ ] `npm audit` corrido periódicamente para detectar dependencias vulnerables.

---

## 6. Fases de desarrollo

### Fase 0 — Setup y migración de datos (1-2 días)
- Crear repositorio en GitHub.
- Inicializar proyecto Next.js + TypeScript + Tailwind.
- Crear proyecto en Supabase y definir esquema de tablas con RLS desde el día uno.
- Crear cuenta de Mercado Pago Developers y obtener credenciales de test.
- Migrar el catálogo real (192 productos ya relevados de la tienda actual, ver `catalogo-perfumeria-joaquin.csv`) a la tabla `products`, completando categoría, marca y ml por producto.

### Fase 1 — Catálogo (3-5 días)
- Página principal con grid de productos.
- Página de detalle de producto (`/producto/[slug]`).
- Filtros por marca y categoría.
- Carga de imágenes vía Supabase Storage.

### Fase 2 — Panel de administración (2-3 días)
- Login con Supabase Auth.
- CRUD de productos (crear, editar, ocultar, eliminar).
- Protección de rutas `/admin/*` verificada en servidor.

### Fase 3 — Carrito y checkout (3-4 días)
- Estado de carrito en cliente (Zustand o Context).
- Cálculo de envío según `shipping_rules` (gratis en Bolívar, gratis nacional sobre $100.000, costo fijo por debajo de ese monto).
- API route para crear preferencia de pago en Mercado Pago, con cuotas sin interés habilitadas (hasta 3, replicando lo que ya ofrece la tienda actual).
- Página de resultado de pago (éxito / pendiente / fallo).
- Webhook de confirmación de pago con validación de firma.

### Fase 4 — Contacto y detalles finales (1-2 días)
- Botón de WhatsApp en producto y footer.
- Notificación por email (Resend) al admin cuando entra un pedido.
- Metadata SEO, sitemap, Open Graph para compartir en redes.
- Optimización de imágenes con `next/image`.

### Fase 5 — Pruebas y seguridad (2-3 días)
- Recorrer el checklist completo de la sección 5.
- Pruebas de pago en modo sandbox de Mercado Pago.
- Prueba de manipulación de precios desde devtools (debe fallar).
- Revisión de políticas RLS con usuario no autenticado.

### Fase 6 — Lanzamiento
- Conectar dominio propio en Vercel.
- Pasar credenciales de Mercado Pago de test a producción.
- Deploy final y monitoreo de las primeras ventas reales.

**Duración estimada total:** 3-4 semanas trabajando part-time.

---

## 7. Costos estimados

| Ítem | Costo |
|---|---|
| Hosting (Vercel) | 0 ARS |
| Base de datos (Supabase) | 0 ARS |
| Dominio `.com.ar` | ~3.000-4.500 ARS/año |
| Comisión Mercado Pago | % por venta (según plan vigente, verificar en su web) |
| Email transaccional (Resend) | 0 ARS (dentro del tier free) |
| **Total inicial** | **Solo el dominio** |

---

## 8. Roadmap futuro (opcional, no incluido en este plan)

- App mobile en React Native para gestión de pedidos → en ese momento se justifica extraer la lógica de negocio a un backend independiente (FastAPI o Node) consumido tanto por la web como por la app.
- Integración de cupones de descuento.
- Sistema de reviews de productos.
- Multi-moneda si se apunta a ventas internacionales.

---

## 9. Checklist final antes de lanzar a producción

- [ ] Todas las medidas de seguridad de la sección 5 revisadas y tildadas.
- [ ] Pago de prueba real (monto bajo) confirmado de punta a punta.
- [ ] Dominio propio conectado y funcionando con HTTPS.
- [ ] Panel de admin probado por el dueño del negocio.
- [ ] Backup manual de la base de datos exportado antes del lanzamiento.
- [ ] Credenciales de producción de Mercado Pago (no las de test) cargadas en Vercel.
