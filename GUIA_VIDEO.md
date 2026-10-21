# Guion del video (Actividad Sumativa – Unidad 2)

Este guion cubre lo que pide la rúbrica:

| Criterio | Puntos | Qué debe verse en el video |
|---|---|---|
| Comandos Docker | 70 | Instalación + **al menos 30 comandos** en la consola, explicando la **arquitectura** y para qué sirve cada uno |
| Despliegue de la aplicación web | 70 | Web + base de datos en contenedores, interfaz gráfica, las dos tablas **relacionadas** |
| Pruebas | 30 | **15 datos** guardados de forma **persistente** en un sistema independiente (el contenedor de MySQL), explicando cada paso |

Duración sugerida: 15 a 20 minutos. Graba la pantalla completa, con la voz, y habla mientras escribes. Usa PowerShell y abre la terminal dentro de la carpeta `actividad-docker`.

> Los comandos están numerados. Se numeran 50, así que si alguno falla en tu equipo te sobran de sobra para pasar de 30.

---

## Parte 1 – Instalación de Docker Desktop (2–3 min)

Muestra en pantalla:

1. Entra a <https://www.docker.com/products/docker-desktop/> y baja el instalador de Windows.
2. Ejecuta `Docker Desktop Installer.exe`. Deja marcada la opción **Use WSL 2 instead of Hyper-V** y pulsa *OK*.
3. Cuando termine, reinicia si te lo pide y abre **Docker Desktop**. Acepta los términos y espera a que abajo a la izquierda se vea el estado **Engine running** en verde.
4. Abre PowerShell y verifica que quedó instalado (comandos 1 a 5 de la tabla de abajo).

Qué decir sobre los requisitos: Docker Desktop en Windows usa WSL 2, un núcleo Linux ligero. Los contenedores no son máquinas virtuales completas: comparten el kernel del anfitrión, por eso arrancan en segundos y pesan poco.

---

## Parte 2 – Arquitectura de Docker (1–2 min, antes de los comandos)

Dibújala o muéstrala en una diapositiva:

```
 Tú escribes "docker run ..."
          │
          ▼
 ┌────────────────┐   API   ┌──────────────────────────┐        ┌─────────────────┐
 │  Docker CLI    │ ──────► │  Docker Engine (dockerd) │ ─pull─►│ Registro        │
 │  (cliente)     │         │  (servicio / demonio)    │◄─push──│ (Docker Hub)    │
 └────────────────┘         └────────────┬─────────────┘        └─────────────────┘
                                         │ containerd + runc
                    ┌────────────────────┼─────────────────────┐
                    ▼                    ▼                     ▼
               Imágenes             Contenedores         Volúmenes y redes
            (plantillas de       (instancias en         (datos persistentes y
             solo lectura)        ejecución)             comunicación)
```

Puntos para explicar:

- **Cliente (CLI)**: lo que escribimos en la consola. Solo envía órdenes.
- **Docker Engine / daemon (`dockerd`)**: hace el trabajo real: construye imágenes, crea y ejecuta contenedores.
- **Registro (Docker Hub)**: almacén de imágenes públicas (`mysql`, `node`, `nginx`…). `docker pull` descarga y `docker push` sube.
- **Imagen**: plantilla de solo lectura formada por capas. Se crea con un `Dockerfile`.
- **Contenedor**: una imagen en ejecución. Es desechable: si se borra, se pierde lo que tenía dentro.
- **Volumen**: almacenamiento que vive fuera del contenedor. Por eso los datos de MySQL **persisten**.
- **Red**: permite que el contenedor web encuentre al de la base de datos por su nombre.
- **Imagen vs. máquina virtual**: la imagen no trae sistema operativo completo; comparte el kernel.

---

## Parte 3 – 50 comandos Docker

Ejecútalos en orden. Di en voz alta qué hace cada uno (columna derecha). Todos se ejecutan desde la carpeta `actividad-docker`.

### 3.1 Verificar la instalación

| # | Comando | Qué decir |
|---|---|---|
| 1 | `docker --version` | Versión del cliente instalado |
| 2 | `docker version` | Versión del cliente **y** del servidor (Engine): confirma la arquitectura cliente/servidor |
| 3 | `docker info` | Estado general: contenedores, imágenes, sistema operativo, driver de almacenamiento |
| 4 | `docker compose version` | Compose viene incluido y sirve para levantar varios contenedores a la vez |
| 5 | `docker --help` | Lista de todos los comandos disponibles |

### 3.2 Imágenes: descargar, construir y eliminar

| # | Comando | Qué decir |
|---|---|---|
| 6 | `docker pull alpine:3.20` | Descarga una imagen del registro. `3.20` es la etiqueta (versión) |
| 7 | `docker images` | Lista las imágenes locales con su tamaño |
| 8 | `docker image inspect alpine:3.20 --format "{{.Os}}/{{.Architecture}}"` | Metadatos de la imagen; aquí, sistema y arquitectura |
| 9 | `docker history alpine:3.20` | Las capas que forman la imagen |
| 10 | `docker search nginx --limit 3` | Busca imágenes en Docker Hub |
| 11 | `docker build -t demo-hola:1.0 ./01-demo-basico` | **Crea una imagen propia** a partir de un Dockerfile (muéstralo abierto antes) |
| 12 | `docker tag demo-hola:1.0 demo-hola:latest` | Le pone una segunda etiqueta a la misma imagen |
| 13 | `docker images` | Ahora aparece `demo-hola` con dos etiquetas |

### 3.3 Contenedores: crear, usar y eliminar

| # | Comando | Qué decir |
|---|---|---|
| 14 | `docker run --rm demo-hola:1.0` | Crea y ejecuta un contenedor desde **nuestra** imagen; `--rm` lo borra al terminar |
| 15 | `docker run --rm hello-world` | Contenedor de prueba oficial; el mensaje explica los pasos que hizo Docker |
| 16 | `docker ps -a` | Lista **todos** los contenedores, también los detenidos. Los de las demostraciones con `--rm` ya no aparecen porque se borraron solos; si ves contenedores antiguos de otros proyectos, explica que son de ejemplos previos y no los uses |
| 17 | `docker run -d --name web-demo -p 8080:80 nginx:alpine` | **Crea un contenedor** en segundo plano (`-d`), con nombre (`--name`) y puerto 8080 del equipo → 80 del contenedor |
| 18 | `docker ps` | Contenedores en ejecución |
| 19 | `docker logs web-demo` | Salida del contenedor |
| 20 | `docker exec web-demo nginx -v` | Ejecuta un comando dentro del contenedor |
| 21 | `docker top web-demo` | Procesos que corren dentro |
| 22 | `docker stats --no-stream` | Consumo de CPU y memoria |
| 23 | `docker inspect web-demo --format "{{.NetworkSettings.IPAddress}}"` | Dirección IP interna del contenedor |
| 24 | `docker stop web-demo` | Detiene el contenedor |
| 25 | `docker start web-demo` | Lo vuelve a iniciar |
| 26 | `docker restart web-demo` | Lo reinicia |
| 27 | `docker rename web-demo servidor-demo` | Le cambia el nombre |
| 28 | `docker rm -f servidor-demo` | **Elimina el contenedor** (`-f` lo detiene si está corriendo) |
| 29 | `docker rmi nginx:alpine` | **Elimina una imagen** |
| 30 | `docker rmi demo-hola:latest demo-hola:1.0` | Elimina la imagen que creamos nosotros (sus dos etiquetas) |
| 31 | `docker rmi hello-world alpine:3.20` | Limpia las imágenes de la demostración |

> Antes del 17: abre <http://localhost:8080> en el navegador para mostrar que nginx responde; después del 28 recarga y muestra que ya no responde.

### 3.4 Volúmenes, redes y espacio

| # | Comando | Qué decir |
|---|---|---|
| 32 | `docker volume create vol-demo` | Crea un volumen (almacenamiento persistente) |
| 33 | `docker volume ls` | Lista los volúmenes |
| 34 | `docker volume inspect vol-demo` | Dónde se guarda y cuándo se creó |
| 35 | `docker volume rm vol-demo` | Elimina el volumen |
| 36 | `docker network create red-demo` | Crea una red propia |
| 37 | `docker network ls` | Lista las redes (`bridge`, `host`, `none` y la nuestra) |
| 38 | `docker network inspect red-demo` | Detalle de la red |
| 39 | `docker network rm red-demo` | Elimina la red |
| 40 | `docker system df` | Espacio que usan imágenes, contenedores y volúmenes |

---

## Parte 4 – La aplicación: base de datos y servidor web

### 4.1 Construir las dos imágenes

Muestra antes los archivos `db/Dockerfile`, `db/init.sql` (las dos tablas, 7 columnas cada una, llave foránea) y `web/Dockerfile`, y explica cada línea brevemente.

| # | Comando | Qué decir |
|---|---|---|
| 41 | `docker build -t tienda-mysql:1.0 ./db` | **Imagen de la base de datos**: parte de `mysql:8.0` y copia `init.sql`, que crea las tablas la primera vez que arranca |
| 42 | `docker build -t tienda-web:1.0 ./web` | **Imagen del servidor web**: parte de `node:20-alpine`, instala dependencias y copia el código |
| 43 | `docker images` | Ahí están las dos imágenes nuevas |

### 4.2 Crear la red, el volumen y los contenedores

| # | Comando | Qué decir |
|---|---|---|
| 44 | `docker network create red-tienda` | Red donde se hablarán web y base de datos |
| 45 | `docker run -d --name tienda-db --network red-tienda -v mysql_data:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=root_pass -e MYSQL_DATABASE=tienda_db -e MYSQL_USER=app_user -e MYSQL_PASSWORD=app_pass -e TZ=America/Bogota tienda-mysql:1.0` | Contenedor de MySQL. `-v` monta el volumen donde se guardan los datos; `-e` pasa la configuración (usuario, contraseña y zona horaria) |
| 46 | `docker logs tienda-db` | Espera a ver `ready for connections` (tarda ~20 s) |
| 47 | `docker exec -it tienda-db mysql -uapp_user -papp_pass tienda_db` | **Entra a MySQL dentro del contenedor**. Dentro escribe, uno por uno: `SHOW TABLES;` `DESCRIBE clientes;` `DESCRIBE pedidos;` y luego `exit` |
| 48 | `docker run -d --name tienda-web --network red-tienda -p 3000:3000 -e DB_HOST=tienda-db -e TZ=America/Bogota tienda-web:1.0` | Contenedor de Node.js. `-p` publica el puerto; `DB_HOST` es el nombre del contenedor de MySQL |
| 49 | `docker ps` | Los dos contenedores corriendo: `tienda-db` y `tienda-web` |
| 50 | `docker logs tienda-web` | Muestra `Servidor web escuchando en el puerto 3000` |

> Si prefieres hacerlo con un solo comando: `docker compose up -d --build`, luego `docker compose ps`, `docker compose logs` y `docker compose down`. Usa **solo una** de las dos formas (ver README).

---

## Parte 5 – Demostración de la app y pruebas (5–6 min)

Abre <http://localhost:3000>.

1. **Inicio (`/`)**: señala que dice *Ejecutándose en Docker: Sí* y que el ID del contenedor (hostname) coincide con el que muestra `docker ps`. Señala que la base de datos aparece como *Conectado* con el ID de **otro** contenedor. Así demuestras que la web y la base de datos son sistemas independientes.
2. **Registrar datos (`/registrar`)**: ingresa **a mano** 2 o 3 clientes y 2 o 3 pedidos, mostrando las validaciones (por ejemplo, un correo mal escrito). Menciona que el pedido se asocia a un cliente existente: esa es la relación entre tablas.
3. Pulsa **Cargar 15 + 15 datos de ejemplo** para completar los **15 datos**. (Si ya metiste datos a mano, usa antes *Vaciar tablas*.)
4. **Ver base de datos (`/datos`)**: es el enlace distinto que pide la actividad. Muestra los 15 clientes y los 15 pedidos, y que cada pedido muestra el cliente al que pertenece.
5. **Prueba directa en MySQL**: en la consola ejecuta

   ```bash
   docker exec tienda-db mysql -uapp_user -papp_pass tienda_db -e "SELECT COUNT(*) AS clientes FROM clientes; SELECT COUNT(*) AS pedidos FROM pedidos; SELECT c.nombre, p.producto, p.cantidad FROM pedidos p JOIN clientes c ON c.id_cliente = p.id_cliente LIMIT 5;"
   ```

   Esto prueba que los datos están realmente en el contenedor de MySQL y que el `JOIN` usa la relación.

### Prueba de persistencia (lo que más impresiona)

Elimina **ambos contenedores** y vuelve a crearlos con los mismos comandos 45 y 48. El volumen conserva los datos:

```bash
docker rm -f tienda-web tienda-db
docker volume ls
docker run -d --name tienda-db --network red-tienda -v mysql_data:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=root_pass -e MYSQL_DATABASE=tienda_db -e MYSQL_USER=app_user -e MYSQL_PASSWORD=app_pass -e TZ=America/Bogota tienda-mysql:1.0
docker run -d --name tienda-web --network red-tienda -p 3000:3000 -e DB_HOST=tienda-db -e TZ=America/Bogota tienda-web:1.0
```

Espera unos 20 s, recarga <http://localhost:3000/datos> y muestra que los 15 + 15 datos siguen ahí. Explica: el contenedor es desechable, el volumen no.

---

## Cierre del video (30 s)

Resume las ventajas que mostraste (el indicador de logro de la actividad): **portabilidad** (funciona igual en cualquier equipo con Docker), **aislamiento** (web y base de datos separadas), **rapidez** (se crea y se destruye en segundos), **reproducibilidad** (todo está descrito en Dockerfiles y `init.sql`) y **persistencia** (volumen).

---

## Entrega

- [ ] Código fuente de la app web: carpeta `web/` (sin `node_modules`). Lo más simple es comprimir toda la carpeta `actividad-docker` en un `.zip`.
- [ ] Script de la base de datos: `db/init.sql`.
- [ ] Enlace del video **público** (por ejemplo YouTube en modo *Público* o *No listado*, o Google Drive con "Cualquier persona con el enlace"). Pruébalo abriéndolo en una ventana de incógnito.
- [ ] Sube todo al menos 2 horas antes del cierre y no incluyas datos personales (los datos de ejemplo son ficticios).
