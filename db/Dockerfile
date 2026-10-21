# Imagen de la base de datos relacional (MySQL 8.0)
FROM mysql:8.0

# Juego de caracteres para acentos y "enes"
CMD ["mysqld", "--character-set-server=utf8mb4", "--collation-server=utf8mb4_unicode_ci"]

# Todo .sql dentro de esta carpeta se ejecuta la primera vez que arranca el
# contenedor (cuando el volumen de datos esta vacio): crea las dos tablas.
COPY init.sql /docker-entrypoint-initdb.d/01-init.sql

EXPOSE 3306
