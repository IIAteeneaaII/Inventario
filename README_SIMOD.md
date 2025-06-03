
# Inventario SIMOD – Backend

Sistema Integral de Monitoreo de Dispositivos (SIMOD)  
**Gestión de inventario para el ciclo de vida de módems**: registro de lotes, trazabilidad por número de serie, control por roles y reportes detallados.

## Tecnologías utilizadas

- **Node.js** – Entorno de ejecución de JavaScript para el backend.
- **Express.js** – Framework para construir la API REST.
- **PostgreSQL** – Base de datos relacional robusta y escalable.
- **Prisma ORM** – Mapeo objeto-relacional para consultas eficientes.
- **EJS** – Motor de plantillas para renderizar vistas dinámicas.
- **BCrypt.js** – Para el hash seguro de contraseñas.
- **Express-session** – Para manejar sesiones de usuario.
- **Dotenv** – Gestión de variables de entorno.
- **Middleware personalizados** – Para validación, control de acceso y auditoría.

## Estructura del proyecto

```
├── controllers/
│   └── authController.js
│   └── loteController.js
│   └── registroController.js
│   └── usuarioController.js
│
├── middlewares/
│   └── authMiddleware.js
│   └── roleMiddleware.js
│   └── loggerMiddleware.js
│
├── routes/
│   └── authRoutes.js
│   └── loteRoutes.js
│   └── registroRoutes.js
│   └── usuarioRoutes.js
│
├── prisma/
│   └── schema.prisma  # Definición del modelo de base de datos
│
├── views/
│   └── *.ejs  # Plantillas EJS para renderizado de vistas
│
├── public/
│   └── css/, js/, img/  # Archivos estáticos
│
├── utils/
│   └── emailSender.js
│   └── logger.js
│
├── .env
├── server.js
├── package.json
```

## Middlewares

- **`authMiddleware.js`**  
  Verifica si el usuario ha iniciado sesión antes de acceder a rutas protegidas.

- **`roleMiddleware.js`**  
  Restringe el acceso según el rol del usuario (`U.Reg`, `U.A.I`, etc.).

- **`loggerMiddleware.js`**  
  Registra en bitácora todas las acciones relevantes: usuario, acción, timestamp.

## Controladores (`controllers/`)

Encapsulan la lógica principal de cada módulo:

- **`authController.js`**: Registro, login, logout, hash de contraseñas, manejo de sesiones.
- **`usuarioController.js`**: Gestión de usuarios y sus roles (solo `U.A.I`).
- **`loteController.js`**: Alta, modificación y consulta de lotes (solo `U.Reg`).
- **`registroController.js`**: Alta de números de serie y sus estados (según el área operativa).

## Rutas (`routes/`)

Agrupan las rutas de la API según el recurso o entidad:

- **`authRoutes.js`**: `/login`, `/logout`, `/registro`
- **`usuarioRoutes.js`**: `/usuarios`, `/usuarios/:id`
- **`loteRoutes.js`**: `/lotes`, `/lotes/:id`
- **`registroRoutes.js`**: `/registro/:area`, `/registros/:lote`

Cada ruta implementa validación de roles y autorización.

## Autenticación y Autorización

- Se implementa mediante sesiones (`express-session`).
- Las contraseñas se almacenan con **bcrypt** (salt + hash).
- Cada sesión guarda el ID de usuario y su tipo.
- Se verifica el rol con middleware antes de acceder a rutas protegidas.

## Funcionalidades principales

- Gestión de usuarios y roles.
- Creación y edición de lotes de producción.
- Registro de dispositivos por área (con validación de estados únicos).
- Subclasificación de SCRAP por tipo de defecto.
- Auditoría completa (logs de acciones por usuario).
- Reportes filtrables y exportables.
- Visualización de estadísticas por área/lote (para `U.V`).
- Seguridad mediante cifrado y sesiones.

## Configuración

1. Clonar el repositorio:
(Ahora se requieren permisos)
```bash
git clone https://github.com/IIAteeneaaII/Inventario
cd inventario-simod
```

2. Instalar dependencias:
```bash
npm install
```

3. Crear archivo `.env` con el siguiente contenido:
hay veces que se guarda como .example
```
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/simod
SESSION_SECRET=unasecretasegura
```

4. Ejecutar migraciones Prisma:
```bash
npx prisma migrate dev --name init
```

5. Iniciar el servidor:
```bash
npm start
```

## Comandos útiles

```bash
npx prisma studio          # Visualizar datos en el navegador
npx prisma generate        # Generar cliente Prisma
npx prisma migrate dev     # Aplicar migraciones
npm init -y
docker-compose down
docker-compose up -d
docker ps  # Debes ver 2 contenedores: "postgres" y "pgadmin".
npx prisma generate
npx prisma migrate dev --name init
```

## Seguridad

- Contraseñas cifradas con `bcrypt`.
- Roles con acceso restringido a funciones clave.
- Validación de entradas en formularios.
- Auditoría de todas las acciones con usuario y timestamp.

## Notas

- El sistema es **escalable** y permite agregar nuevas áreas o procesos sin modificar la estructura base.
- Compatible con más de **100,000 registros** manteniendo el rendimiento.
- Se pueden agregar futuras integraciones como **notificaciones por correo** o **modo offline**.
