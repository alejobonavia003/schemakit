import { Router } from 'express';
import exampleRoutes from './example.routes.js';

const router = Router();

// Ruta de salud, útil para verificar que el server esté vivo
router.get('/health', (req, res) => {
  res.json({ ok: true, message: 'API funcionando correctamente' });
});

// Cada nuevo recurso se monta acá con su propio prefijo.
// Ejemplo: router.use('/users', userRoutes);
router.use('/examples', exampleRoutes);

export default router;
