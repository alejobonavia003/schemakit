// Cada controlador maneja la lógica de un recurso.
// Cuando agreguen recursos nuevos (usuarios, productos, etc.)
// pueden copiar este archivo como plantilla.

import { prisma } from '../config/prisma.js';

export async function getExamples(req, res) {
  try {
    const examples = await prisma.example.findMany({
      orderBy: {
        id: 'asc',
      },
    });

    console.log('Ejemplos obtenidos:', examples);

    res.json({
      ok: true,
      data: examples,
    });
  } catch (error) {
    console.error('Error obteniendo examples:', error);

    res.status(500).json({
      ok: false,
      error: 'Error al obtener los ejemplos',
    });
  }
}

export async function getExampleById(req, res) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        error: 'El ID debe ser un número',
      });
    }

    const example = await prisma.example.findUnique({
      where: {
        id,
      },
    });

    if (!example) {
      return res.status(404).json({
        ok: false,
        error: 'Ejemplo no encontrado',
      });
    }

    res.json({
      ok: true,
      data: example,
    });
  } catch (error) {
    console.error('Error obteniendo example:', error);

    res.status(500).json({
      ok: false,
      error: 'Error al obtener el ejemplo',
    });
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