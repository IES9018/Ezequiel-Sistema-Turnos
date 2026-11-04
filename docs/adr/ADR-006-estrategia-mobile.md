# ADR-006: Estrategia Mobile del Sistema de Turnos

**Fecha:** 2026-11-03
**Estado:** Aceptado
**Supersede:** Ninguno (complementa ADR-005 — estrategia web — y operacionaliza NG-02 de la SPEC)

## Contexto

El TP3 definió dos personas (Martina, clienta que reserva desde el celular; y el/la administrador que gestiona la agenda) y el CA-07 exige que la app funcione en pantallas de **360 px o mayores sin scroll horizontal**. ADR-005 ya decidió una **SPA React + Vite** servida como estático contra la API REST, pero no dijo **cómo se lleva esa SPA al bolsillo**: ¿responsive web pura, PWA instalable/offline, app nativa o híbrida?

Restricciones y contexto que condicionan la decisión:

- **NG-02 (SPEC):** no se implementará app móvil nativa; solo web responsive.
- **Tamaño del equipo:** 1 desarrollador (el estudiante), a tiempo parcial.
- **Tiempo hasta el cierre de PP3:** Sprint 3 (19 oct – 13 nov) debe terminar con despliegue funcional; no hay margen para aprender y mantener dos bases de código.
- **Dominio:** reserva de turnos de una única peluquería/barbería. Se usa principalmente con conectividad, estando el local abierto.
- **Offline:** el uso se da en el local o camino a él con red móvil; no hay operación de campo sin señal. (Ver `docs/arquitectura/offline-sync.md`.)
- **Hardware:** no se requiere cámara, GPS, biometría ni Bluetooth.
- **Ya construido:** SPA responsive con TailwindCSS, contratos OpenAPI y autenticación JWT (ADR-001/005, R-03/R-05).

## Decisión

Se adopta **responsive web (SPA)** como estrategia mobile, **sin PWA ni contenedores híbridos** en esta etapa.

- Un único artefacto (bundle estático) sirve a desktop y móvil; el layout se adapta con breakpoints de TailwindCSS.
- Las 2 pantallas críticas (reserva y mis turnos) se reinterpretan a `< 400 px` con targets táctiles **≥ 48 px** (ver wireframes móviles).
- Los presupuestos de rendimiento móvil (LCP/INP/peso JS) se fijan y miden en `docs/arquitectura/presupuestos-rendimiento.md`.
- La PWA queda como **evolución futura** posible (ver "Consecuencias"), no como alcance de PP3.

### Matriz de decisión

Celdas justificadas contra el contexto real del proyecto (1 dev, PP3 cierra 13 nov, sin offline ni hardware).

| Criterio (peso) | Responsive web (SPA) | PWA (instalable + offline) | Nativa (iOS/Android) | Híbrida (Flutter/RN/Capacitor) |
|---|---|---|---|---|
| **Costo de mantenimiento 1 persona (alto)** | ✅ un solo código web, ya existente | ⚠️ + service worker, manifest, versionado de caché | ❌ 2 apps + tiendas + releases | ⚠️ segundo runtime y toolchain |
| **¿Offline necesario? (alto)** | ✅ no hay operación sin red en el dominio | ✅ resuelve offline, pero es un problema que **no tenemos** | ✅ puede cachear local | ⚠️ igual que PWA con más piezas |
| **Acceso a hardware (medio)** | ✅ no se usa cámara/GPS/BT | ✅ suficiente | ✅ total (innecesario) | ✅ suficiente |
| **Tiempo hasta cierre de PP3 (alto)** | ✅ cero migración; se adapta lo existente | ⚠️ suma trabajo no planificado | ❌ imposible en el plazo | ❌ imposible en el plazo |
| **Consistencia con ADR-001/005 y R-03/R-04 (alto)** | ✅ mismo stack React+Vite+Tailwind | ⚠️ agrega plataforma no declarada en ADR | ❌ viola NG-02 y R-04 | ❌ viola NG-02 y R-04 |
| **Distribución / instalación (bajo)** | ✅ URL pública, sin tiendas | ⚠️ "agregar a inicio" opcional | ❌ App Store / Play Store | ⚠️ build por plataforma |
| **CA-07 / CA-08 (alto)** | ✅ se resuelve con CSS + foco/contraste | ✅ igual | ✅ igual | ✅ igual |

La **responsive web** gana en todos los criterios de peso alto: mantiene un solo código, no introduce plataforma no declarada, cumple CA-07/CA-08 y llega al cierre de PP3. PWA solo se justificaría si el offline fuera un requisito real, y no lo es.

## Alternativas Descartadas

- **Opción A — PWA (service worker + manifest + caché offline):** descartada **para esta etapa**. Técnicamente es la evolución natural de la SPA y su costo no es alto, pero resuelve un problema que el dominio no tiene (no se opera sin red) y agrega superficie de riesgo (caché obsoleta, sincronización, invalidación de versión) justo cuando el equipo es de 1 persona y el plazo es corto. Se reabre si aparece un requisito de uso sin señal (ver `offline-sync.md`).
- **Opción B — App nativa (Swift/Kotlin):** descartada. Viola NG-02, exige 2 bases de código, publicación en tiendas y un equipo que no existe. Ningún requisito pide hardware nativo.
- **Opción C — Híbrida (Flutter / React Native / Capacitor):** descartada. Añade un segundo runtime y toolchain para reescribir pantallas que ya funcionan; viola NG-02/R-04 y no aporta al dominio. Capacitor sería el atajo menos costoso, pero seguiría sin resolver un requisito inexistente.

## Consecuencias

### Positivas

- **Un solo artefacto** (bundle estático) para desktop y móvil: despliegue y mantenimiento simples (1 dev).
- Reutiliza al 100% la SPA, los contratos OpenAPI y la autenticación ya construidos (ADR-001/005).
- CA-07/CA-08 se cumplen con CSS responsive + foco visible + contraste, medibles y auditables.
- No agrega dependencias ni plataformas fuera de R-04.

### Negativas / riesgos (escritos antes de sufrirlos)

- **Sin instalación ni offline:** si la clienta pierde señal, la reserva falla; se acepta porque el uso es con conectividad y el fallback es reintentar. La condición que reabre la decisión está en `offline-sync.md`.
- **Sin acceso a hardware ni notificaciones push nativas:** RF-05 (confirmación por email/notificación) se resuelve server-side por email, no con push del sistema operativo.
- **El primer render depende del bundle JS:** se mitiga con el presupuesto de **peso inicial JS < 200 KB gzip** y LCP/INP medidos (TP5/TP6).
- **Teclado virtual y `input type=date/time`:** se usan controles nativos del navegador para evitar pickers propios pesados; se valida su comportamiento en los wireframes móviles.

### Condición que reabriría la decisión (PWA)

Si en una etapa futura aparece **uso real sin conectividad** (p. ej. agenda del profesional en un local sin buena señal) o se requiere **notificación push** al cliente, se evaluará promover la SPA a PWA (manifest + service worker con estrategia de caché e invalidación) mediante un nuevo ADR que supersede a este.
