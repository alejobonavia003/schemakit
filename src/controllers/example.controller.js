import { prisma } from '../config/prisma.js';

export async function getExamples(req, res, next) {
  try {
    const examples = await prisma.example.findMany({
      orderBy: { id: 'asc' },
    });

    res.json({ ok: true, data: examples });
  } catch (error) {
    next(error);
  }
}

export async function getExampleById(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({
      ok: false,
      error: { message: 'El ID debe ser un número entero positivo' },
    });
  }

  try {
    const example = await prisma.example.findUnique({ where: { id } });

    if (!example) {
      return res.status(404).json({
        ok: false,
        error: { message: 'Ejemplo no encontrado' },
      });
    }

    res.json({ ok: true, data: example });
  } catch (error) {
    next(error);
  }
}

export async function createExample(req, res, next) {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';

  if (!name) {
    return res.status(400).json({
      ok: false,
      error: { message: 'El campo name es obligatorio' },
    });
  }

  try {
    const example = await prisma.example.create({
      data: { name },
    });

    res.status(201).json({ ok: true, data: example });
  } catch (error) {
    next(error);
  }
}

export async function createExample(req, res) {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        ok: false,
        error: 'El campo name es obligatorio',
      });
    }

    const example = await prisma.example.create({
      data: {
        name,
      },
    });

    res.status(201).json({
      ok: true,
      data: example,
    });
  } catch (error) {
    console.error('Error creando example:', error);

    res.status(500).json({
      ok: false,
      error: 'Error al crear el ejemplo',
    });
  }
}