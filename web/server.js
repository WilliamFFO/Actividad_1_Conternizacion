'use strict';

const express = require('express');
const mysql = require('mysql2/promise');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PORT = Number(process.env.PORT) || 3000;

// La base de datos vive en OTRO contenedor: se llega a ella por el nombre del
// servicio ("db") dentro de la red de Docker.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'app_user',
  password: process.env.DB_PASSWORD || 'app_pass',
  database: process.env.DB_NAME || 'tienda_db',
  waitForConnections: true,
  connectionLimit: 5,
  dateStrings: true, // DATE/DATETIME llegan como texto 'YYYY-MM-DD' y no como objetos Date
  charset: 'utf8mb4',
});

// ---------------------------------------------------------------------------
// Datos de ejemplo: 15 clientes y 15 pedidos (todos ficticios)
// ---------------------------------------------------------------------------
const CLIENTES_EJEMPLO = [
  // nombre, correo, fecha_nacimiento, activo, saldo
  ['Ana Torres', 'ana.torres@example.com', '1990-03-14', 1, 150000.5],
  ['Luis Gómez', 'luis.gomez@example.com', '1985-07-22', 1, 82000],
  ['Marta Rojas', 'marta.rojas@example.com', '1992-11-05', 1, 0],
  ['Carlos Peña', 'carlos.pena@example.com', '1978-01-30', 0, 12500.75],
  ['Sofía Herrera', 'sofia.herrera@example.com', '1995-09-18', 1, 300000],
  ['Diego Castro', 'diego.castro@example.com', '1988-04-09', 1, 45000],
  ['Laura Mejía', 'laura.mejia@example.com', '2000-12-25', 1, 99999.99],
  ['Andrés Vargas', 'andres.vargas@example.com', '1983-06-02', 0, 0],
  ['Paula Ortiz', 'paula.ortiz@example.com', '1997-02-11', 1, 67000],
  ['Jorge Ramírez', 'jorge.ramirez@example.com', '1975-10-27', 1, 210500.25],
  ['Camila Duarte', 'camila.duarte@example.com', '1993-08-16', 1, 15000],
  ['Felipe Ruiz', 'felipe.ruiz@example.com', '1989-05-03', 1, 73000],
  ['Valentina Cruz', 'valentina.cruz@example.com', '2001-03-29', 1, 5000],
  ['Mateo Salazar', 'mateo.salazar@example.com', '1981-12-12', 0, 128000],
  ['Daniela Ríos', 'daniela.rios@example.com', '1996-07-07', 1, 91000.1],
];

const PEDIDOS_EJEMPLO = [
  // indice del cliente (0-14), producto, cantidad, precio_unitario, fecha_pedido, entregado
  [0, 'Teclado mecánico', 1, 185000, '2026-09-01', 1],
  [1, 'Mouse inalámbrico', 2, 49900, '2026-09-02', 1],
  [2, 'Monitor 24 pulgadas', 1, 620000, '2026-09-03', 0],
  [3, 'Cable HDMI 2m', 3, 18000, '2026-09-04', 1],
  [4, 'Portátil 15 pulgadas', 1, 2450000, '2026-09-05', 0],
  [5, 'Memoria USB 64GB', 4, 32000, '2026-09-06', 1],
  [6, 'Audífonos con micrófono', 1, 120000, '2026-09-08', 1],
  [7, 'Disco duro externo 1TB', 1, 285000, '2026-09-09', 0],
  [8, 'Cámara web HD', 2, 95000, '2026-09-10', 1],
  [9, 'Silla ergonómica', 1, 540000, '2026-09-12', 0],
  [10, 'Base para portátil', 1, 65000, '2026-09-13', 1],
  [11, 'Impresora multifuncional', 1, 430000, '2026-09-15', 1],
  [12, 'Lámpara de escritorio', 2, 54000, '2026-09-16', 0],
  [13, 'Router WiFi 6', 1, 310000, '2026-09-18', 1],
  [14, 'Parlantes bluetooth', 1, 150000, '2026-09-20', 0],
];

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const money = (v) => '$ ' + Number(v).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const yesNo = (v) => (Number(v) ? '<span class="badge ok">Sí</span>' : '<span class="badge no">No</span>');
// Fecha local (la zona horaria del contenedor se fija con la variable TZ), no UTC
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

function layout(active, title, body, flash) {
  const link = (href, key, text) => `<a href="${href}"${active === key ? ' class="active" aria-current="page"' : ''}>${text}</a>`;
  const banner = flash ? `<div class="flash ${flash.type}" role="status">${esc(flash.msg)}</div>` : '';
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} | Tienda en Docker</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <header>
    <div class="wrap bar">
      <a class="brand" href="/"><img src="/contenedores.svg" alt="" width="34" height="34"> Tienda en Docker</a>
      <nav>
        ${link('/', 'inicio', 'Inicio')}
        ${link('/registrar', 'registrar', 'Registrar datos')}
        ${link('/datos', 'datos', 'Ver base de datos')}
      </nav>
    </div>
  </header>
  <main class="wrap">
    ${banner}
    ${body}
  </main>
  <footer class="wrap">Node.js + MySQL, cada uno en su propio contenedor Docker.</footer>
</body>
</html>`;
}

function flashFrom(query) {
  if (query.ok) return { type: 'success', msg: query.ok };
  if (query.err) return { type: 'error', msg: query.err };
  return null;
}

const back = (res, to, type, msg) => res.redirect(`${to}?${type}=${encodeURIComponent(msg)}`);

// ---------------------------------------------------------------------------
// Validacion de formularios
// ---------------------------------------------------------------------------
function validarCliente(b) {
  const nombre = (b.nombre || '').trim();
  const correo = (b.correo || '').trim().toLowerCase();
  const fecha = (b.fecha_nacimiento || '').trim();
  const saldo = b.saldo === undefined || b.saldo === '' ? 0 : Number(b.saldo);
  if (!nombre || nombre.length > 80) return { error: 'El nombre es obligatorio (máximo 80 caracteres).' };
  if (correo.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return { error: 'El correo no es válido.' };
  if (!isDate(fecha) || fecha > today()) return { error: 'La fecha de nacimiento no es válida.' };
  if (!Number.isFinite(saldo) || saldo < 0 || saldo > 99999999.99) return { error: 'El saldo debe ser un número entre 0 y 99.999.999,99.' };
  return { valores: [nombre, correo, fecha, b.activo ? 1 : 0, saldo.toFixed(2)] };
}

function validarPedido(b) {
  const idCliente = Number.parseInt(b.id_cliente, 10);
  const producto = (b.producto || '').trim();
  const cantidad = Number.parseInt(b.cantidad, 10);
  const precio = Number(b.precio_unitario);
  const fecha = (b.fecha_pedido || '').trim();
  if (!Number.isInteger(idCliente) || idCliente < 1) return { error: 'Selecciona un cliente.' };
  if (!producto || producto.length > 100) return { error: 'El producto es obligatorio (máximo 100 caracteres).' };
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 32767) return { error: 'La cantidad debe ser un entero entre 1 y 32767.' };
  if (b.precio_unitario === '' || !Number.isFinite(precio) || precio < 0 || precio > 99999999.99) return { error: 'El precio unitario no es válido.' };
  if (!isDate(fecha)) return { error: 'La fecha del pedido no es válida.' };
  return { valores: [idCliente, producto, cantidad, precio.toFixed(2), fecha, b.entregado ? 1 : 0] };
}

// ---------------------------------------------------------------------------
// Aplicacion
// ---------------------------------------------------------------------------
const app = express();
app.disable('x-powered-by');
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const h = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ----- Inicio: demuestra que la app corre dentro de un contenedor ----------
app.get('/', h(async (req, res) => {
  const enDocker = fs.existsSync('/.dockerenv');
  let db = null;
  let dbError = null;
  try {
    const [[fila]] = await pool.query('SELECT VERSION() AS version, @@hostname AS host, DATABASE() AS base');
    const [[c]] = await pool.query('SELECT (SELECT COUNT(*) FROM clientes) AS clientes, (SELECT COUNT(*) FROM pedidos) AS pedidos');
    db = { ...fila, ...c };
  } catch (e) {
    dbError = e.code || e.message;
  }

  const body = `
    <section class="hero">
      <div>
        <h1>Aplicación web desplegada con Docker</h1>
        <p>Esta página la sirve un contenedor con <strong>Node.js</strong> y guarda su información en otro contenedor con
        <strong>MySQL</strong>. Los datos persisten en un volumen de Docker.</p>
        <p class="actions">
          <a class="btn" href="/registrar">Registrar datos</a>
          <a class="btn secondary" href="/datos">Ver base de datos</a>
        </p>
      </div>
      <img src="/contenedores.svg" alt="Ilustración de contenedores apilados" width="220" height="220">
    </section>

    <section class="grid2">
      <article class="card">
        <h2>Contenedor web</h2>
        <dl>
          <dt>Ejecutándose en Docker</dt><dd>${enDocker ? '<span class="badge ok">Sí (/.dockerenv)</span>' : '<span class="badge no">No, es un proceso local</span>'}</dd>
          <dt>ID del contenedor (hostname)</dt><dd><code>${esc(os.hostname())}</code></dd>
          <dt>Node.js</dt><dd>${esc(process.version)}</dd>
          <dt>Sistema</dt><dd>${esc(os.type())} ${esc(os.arch())}</dd>
          <dt>Tiempo activo</dt><dd>${Math.floor(process.uptime())} s</dd>
        </dl>
      </article>
      <article class="card">
        <h2>Contenedor de base de datos</h2>
        ${db ? `<dl>
          <dt>Estado</dt><dd><span class="badge ok">Conectado</span></dd>
          <dt>Host en la red de Docker</dt><dd><code>${esc(process.env.DB_HOST || 'db')}</code></dd>
          <dt>ID del contenedor MySQL</dt><dd><code>${esc(db.host)}</code></dd>
          <dt>Versión de MySQL</dt><dd>${esc(db.version)}</dd>
          <dt>Base de datos</dt><dd>${esc(db.base)}</dd>
          <dt>Registros</dt><dd>${db.clientes} clientes, ${db.pedidos} pedidos</dd>
        </dl>` : `<p><span class="badge no">Sin conexión</span> No se pudo conectar a MySQL (${esc(dbError)}). Revisa que el contenedor de la base de datos esté en marcha.</p>`}
      </article>
    </section>`;
  res.send(layout('inicio', 'Inicio', body, flashFrom(req.query)));
}));

// ----- Formularios de registro ---------------------------------------------
app.get('/registrar', h(async (req, res) => {
  const [clientes] = await pool.query('SELECT id_cliente, nombre FROM clientes ORDER BY nombre');
  const opciones = clientes.map((c) => `<option value="${c.id_cliente}">${esc(c.nombre)} (#${c.id_cliente})</option>`).join('');

  const body = `
    <h1>Registrar datos</h1>
    <p class="lead">Completa los formularios. Cada registro se guarda en MySQL y lo puedes ver en <a href="/datos">Ver base de datos</a>.</p>

    <section class="grid2">
      <form class="card" method="post" action="/clientes">
        <h2>1. Nuevo cliente</h2>
        <label>Nombre completo
          <input name="nombre" maxlength="80" required placeholder="Ej: Ana Torres" autocomplete="off">
        </label>
        <label>Correo electrónico
          <input type="email" name="correo" maxlength="100" required placeholder="ana@example.com" autocomplete="off">
        </label>
        <label>Fecha de nacimiento
          <input type="date" name="fecha_nacimiento" max="${today()}" required>
        </label>
        <label>Saldo a favor (COP)
          <input type="number" name="saldo" min="0" max="99999999.99" step="0.01" value="0">
        </label>
        <label class="check"><input type="checkbox" name="activo" value="1" checked> Cliente activo</label>
        <button class="btn" type="submit">Guardar cliente</button>
      </form>

      <form class="card" method="post" action="/pedidos">
        <h2>2. Nuevo pedido</h2>
        ${clientes.length ? '' : '<p class="hint">Primero registra al menos un cliente: cada pedido pertenece a un cliente.</p>'}
        <label>Cliente
          <select name="id_cliente" required ${clientes.length ? '' : 'disabled'}>
            <option value="">Selecciona...</option>${opciones}
          </select>
        </label>
        <label>Producto
          <input name="producto" maxlength="100" required placeholder="Ej: Teclado mecánico" autocomplete="off" ${clientes.length ? '' : 'disabled'}>
        </label>
        <div class="row">
          <label>Cantidad
            <input type="number" name="cantidad" min="1" max="32767" step="1" value="1" required ${clientes.length ? '' : 'disabled'}>
          </label>
          <label>Precio unitario (COP)
            <input type="number" name="precio_unitario" min="0" max="99999999.99" step="0.01" required placeholder="0.00" ${clientes.length ? '' : 'disabled'}>
          </label>
        </div>
        <label>Fecha del pedido
          <input type="date" name="fecha_pedido" value="${today()}" required ${clientes.length ? '' : 'disabled'}>
        </label>
        <label class="check"><input type="checkbox" name="entregado" value="1" ${clientes.length ? '' : 'disabled'}> Pedido entregado</label>
        <button class="btn" type="submit" ${clientes.length ? '' : 'disabled'}>Guardar pedido</button>
      </form>
    </section>

    <section class="card tools">
      <h2>Herramientas para la demostración</h2>
      <p>Carga de una vez <strong>15 clientes y 15 pedidos</strong> de ejemplo (datos ficticios), o deja las tablas vacías para repetir la prueba.</p>
      <div class="actions">
        <form method="post" action="/seed"><button class="btn secondary" type="submit">Cargar 15 + 15 datos de ejemplo</button></form>
        <form method="post" action="/reset" onsubmit="return confirm('Se borrarán TODOS los clientes y pedidos. ¿Continuar?');">
          <button class="btn danger" type="submit">Vaciar tablas</button>
        </form>
      </div>
    </section>`;
  res.send(layout('registrar', 'Registrar datos', body, flashFrom(req.query)));
}));

app.post('/clientes', h(async (req, res) => {
  const { error, valores } = validarCliente(req.body);
  if (error) return back(res, '/registrar', 'err', error);
  try {
    await pool.query(
      'INSERT INTO clientes (nombre, correo, fecha_nacimiento, activo, saldo) VALUES (?, ?, ?, ?, ?)',
      valores
    );
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return back(res, '/registrar', 'err', 'Ya existe un cliente con ese correo.');
    throw e;
  }
  back(res, '/datos', 'ok', `Cliente "${valores[0]}" guardado correctamente.`);
}));

app.post('/pedidos', h(async (req, res) => {
  const { error, valores } = validarPedido(req.body);
  if (error) return back(res, '/registrar', 'err', error);
  try {
    await pool.query(
      'INSERT INTO pedidos (id_cliente, producto, cantidad, precio_unitario, fecha_pedido, entregado) VALUES (?, ?, ?, ?, ?, ?)',
      valores
    );
  } catch (e) {
    if (e.code === 'ER_NO_REFERENCED_ROW_2') return back(res, '/registrar', 'err', 'El cliente seleccionado no existe.');
    throw e;
  }
  back(res, '/datos', 'ok', `Pedido de "${valores[1]}" guardado correctamente.`);
}));

app.post('/seed', h(async (req, res) => {
  const correos = CLIENTES_EJEMPLO.map((c) => c[1]);
  const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM clientes WHERE correo IN (?)', [correos]);
  if (n > 0) return back(res, '/registrar', 'err', 'Los datos de ejemplo ya están cargados. Usa "Vaciar tablas" si quieres repetirlos.');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const ids = [];
    for (const c of CLIENTES_EJEMPLO) {
      const [r] = await conn.query(
        'INSERT INTO clientes (nombre, correo, fecha_nacimiento, activo, saldo) VALUES (?, ?, ?, ?, ?)',
        c
      );
      ids.push(r.insertId);
    }
    for (const [i, producto, cantidad, precio, fecha, entregado] of PEDIDOS_EJEMPLO) {
      await conn.query(
        'INSERT INTO pedidos (id_cliente, producto, cantidad, precio_unitario, fecha_pedido, entregado) VALUES (?, ?, ?, ?, ?, ?)',
        [ids[i], producto, cantidad, precio, fecha, entregado]
      );
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  back(res, '/datos', 'ok', 'Se guardaron 15 clientes y 15 pedidos de ejemplo.');
}));

app.post('/reset', h(async (req, res) => {
  await pool.query('DELETE FROM pedidos');
  await pool.query('DELETE FROM clientes');
  await pool.query('ALTER TABLE pedidos AUTO_INCREMENT = 1');
  await pool.query('ALTER TABLE clientes AUTO_INCREMENT = 1');
  back(res, '/registrar', 'ok', 'Las tablas quedaron vacías.');
}));

// ----- Lo que hay guardado en la base de datos -----------------------------
async function leerDatos() {
  const [clientes] = await pool.query('SELECT * FROM clientes ORDER BY id_cliente');
  const [pedidos] = await pool.query(
    `SELECT p.*, c.nombre AS cliente
       FROM pedidos p JOIN clientes c ON c.id_cliente = p.id_cliente
      ORDER BY p.id_pedido`
  );
  return { clientes, pedidos };
}

app.get('/datos', h(async (req, res) => {
  const { clientes, pedidos } = await leerDatos();

  const filasClientes = clientes.map((c) => `
    <tr>
      <td>${c.id_cliente}</td><td>${esc(c.nombre)}</td><td>${esc(c.correo)}</td>
      <td>${esc(c.fecha_nacimiento)}</td><td>${yesNo(c.activo)}</td>
      <td class="num">${money(c.saldo)}</td><td>${esc(c.fecha_registro)}</td>
    </tr>`).join('');

  const filasPedidos = pedidos.map((p) => `
    <tr>
      <td>${p.id_pedido}</td><td>${p.id_cliente} &middot; ${esc(p.cliente)}</td><td>${esc(p.producto)}</td>
      <td class="num">${p.cantidad}</td><td class="num">${money(p.precio_unitario)}</td>
      <td>${esc(p.fecha_pedido)}</td><td>${yesNo(p.entregado)}</td>
    </tr>`).join('');

  const vacio = (cols, texto) => `<tr><td colspan="${cols}" class="empty">${texto}</td></tr>`;

  const body = `
    <h1>Contenido de la base de datos</h1>
    <p class="lead">Lectura directa de MySQL en este momento: <strong>${clientes.length}</strong> clientes y
    <strong>${pedidos.length}</strong> pedidos. También disponible como <a href="/api/datos">JSON</a>.</p>

    <section class="card">
      <h2>Tabla <code>clientes</code> <span class="count">${clientes.length}</span></h2>
      <div class="scroll"><table>
        <thead><tr><th>id_cliente</th><th>nombre</th><th>correo</th><th>fecha_nacimiento</th><th>activo</th><th>saldo</th><th>fecha_registro</th></tr></thead>
        <tbody>${filasClientes || vacio(7, 'Aún no hay clientes. <a href="/registrar">Registra el primero</a>.')}</tbody>
      </table></div>
    </section>

    <section class="card">
      <h2>Tabla <code>pedidos</code> <span class="count">${pedidos.length}</span></h2>
      <p class="hint">La columna <code>id_cliente</code> es la llave foránea que enlaza cada pedido con su cliente.</p>
      <div class="scroll"><table>
        <thead><tr><th>id_pedido</th><th>id_cliente</th><th>producto</th><th>cantidad</th><th>precio_unitario</th><th>fecha_pedido</th><th>entregado</th></tr></thead>
        <tbody>${filasPedidos || vacio(7, 'Aún no hay pedidos. <a href="/registrar">Registra el primero</a>.')}</tbody>
      </table></div>
    </section>`;
  res.send(layout('datos', 'Base de datos', body, flashFrom(req.query)));
}));

app.get('/api/datos', h(async (req, res) => {
  res.json(await leerDatos());
}));

// ----- Errores --------------------------------------------------------------
app.use((req, res) => {
  res.status(404).send(layout('', 'No encontrado', '<h1>Página no encontrada</h1><p><a href="/">Volver al inicio</a></p>'));
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const sinDb = ['ECONNREFUSED', 'ENOTFOUND', 'PROTOCOL_CONNECTION_LOST', 'ETIMEDOUT'].includes(err.code);
  const msg = sinDb
    ? 'No se pudo conectar con la base de datos. Verifica que su contenedor esté en ejecución.'
    : 'Ocurrió un error inesperado. Revisa los registros del contenedor (docker logs tienda-web).';
  res.status(500).send(layout('', 'Error', `<h1>Algo salió mal</h1><p>${esc(msg)}</p><p><a href="/">Volver al inicio</a></p>`));
});

app.listen(PORT, () => console.log(`Servidor web escuchando en el puerto ${PORT}`));
