// Cada controlador maneja la lógica de un recurso.
// Cuando agreguen recursos nuevos (usuarios, productos, etc.)
// pueden copiar este archivo como plantilla.

export function getExamples(req, res) {
  res.json({
    ok: true,
    data: [
      { id: 1, name: 'Ejemplo 1' },
      { id: 2, name: 'Ejemplo 2' },
    ],
  });
}

export function getExampleById(req, res) {
  const { id } = req.params;
  res.json({
    ok: true,
    data: { id: Number(id), name: `Ejemplo ${id}` },
  });
}

export function createExample(req, res) {
  const body = req.body;
  res.status(201).json({
    ok: true,
    data: body,
  });
}
