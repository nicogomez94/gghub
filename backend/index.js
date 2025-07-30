import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Inicializar base de datos SQLite
let db;
(async () => {
  db = await open({
    filename: './db.sqlite',
    driver: sqlite3.Database
  });
  await db.exec(`CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    departamento TEXT NOT NULL,
    fecha TEXT NOT NULL,
    ingreso_bruto REAL NOT NULL,
    limpieza REAL DEFAULT 0,
    ropa_blanca REAL DEFAULT 0,
    comisiones REAL DEFAULT 0,
    otros REAL DEFAULT 0
  )`);
})();

// Crear reserva
app.post('/api/reservas', async (req, res) => {
  const { departamento, fecha, ingreso_bruto, limpieza, ropa_blanca, comisiones, otros } = req.body;
  const result = await db.run(
    `INSERT INTO reservas (departamento, fecha, ingreso_bruto, limpieza, ropa_blanca, comisiones, otros) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [departamento, fecha, ingreso_bruto, limpieza, ropa_blanca, comisiones, otros]
  );
  res.json({ id: result.lastID });
});

// Editar reserva
app.put('/api/reservas/:id', async (req, res) => {
  const { id } = req.params;
  const { departamento, fecha, ingreso_bruto, limpieza, ropa_blanca, comisiones, otros } = req.body;
  await db.run(
    `UPDATE reservas SET departamento=?, fecha=?, ingreso_bruto=?, limpieza=?, ropa_blanca=?, comisiones=?, otros=? WHERE id=?`,
    [departamento, fecha, ingreso_bruto, limpieza, ropa_blanca, comisiones, otros, id]
  );
  res.json({ ok: true });
});

// Eliminar reserva
app.delete('/api/reservas/:id', async (req, res) => {
  const { id } = req.params;
  await db.run(`DELETE FROM reservas WHERE id=?`, [id]);
  res.json({ ok: true });
});

// Obtener reservas (opcional: por mes y/o departamento)
app.get('/api/reservas', async (req, res) => {
  const { mes, departamento } = req.query;
  let query = 'SELECT * FROM reservas WHERE 1=1';
  const params = [];
  if (mes) {
    query += ' AND substr(fecha, 1, 7) = ?';
    params.push(mes);
  }
  if (departamento) {
    query += ' AND departamento = ?';
    params.push(departamento);
  }
  const reservas = await db.all(query, params);
  res.json(reservas);
});

// Resumen mensual por departamento
app.get('/api/resumen/por-departamento', async (req, res) => {
  const { mes } = req.query;
  const resumen = await db.all(
    `SELECT departamento, substr(fecha, 1, 7) as mes,
      SUM(ingreso_bruto) as total_ingresos,
      SUM(limpieza + ropa_blanca + comisiones + otros) as total_gastos,
      SUM(ingreso_bruto - (limpieza + ropa_blanca + comisiones + otros)) as ganancia_neta
    FROM reservas
    WHERE substr(fecha, 1, 7) = ?
    GROUP BY departamento, mes`,
    [mes]
  );
  res.json(resumen);
});

// Resumen total por mes
app.get('/api/resumen/total', async (req, res) => {
  const { mes } = req.query;
  const resumen = await db.get(
    `SELECT substr(fecha, 1, 7) as mes,
      SUM(ingreso_bruto) as total_ingresos,
      SUM(limpieza + ropa_blanca + comisiones + otros) as total_gastos,
      SUM(ingreso_bruto - (limpieza + ropa_blanca + comisiones + otros)) as ganancia_neta
    FROM reservas
    WHERE substr(fecha, 1, 7) = ?`,
    [mes]
  );
  res.json(resumen);
});

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
