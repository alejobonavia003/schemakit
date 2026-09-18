import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mainRouter from './routes/index.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { config } from './config/index.js';

const app = express();
const frontendDist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../frontend/dist',
);

// Middlewares globales
app.use(
  cors({
    origin: config.corsOrigins.length > 0 ? config.corsOrigins : true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rutas, todas bajo el prefijo /api
app.use('/api', mainRouter);

// En producción Express también puede servir el frontend compilado.
app.use(express.static(frontendDist));
app.get(/^\/(?!api(?:\/|$)).*/, (req, res, next) => {
  if (path.extname(req.path)) {
    return next();
  }

  res.sendFile(path.join(frontendDist, 'index.html'), (error) => {
    if (error) {
      next(error);
    }
  });
});

// Manejo de 404 y errores (siempre al final)
app.use(notFound);
app.use(errorHandler);

//RUTAS DE LA SOLUCION 1



//RUTAS DE LA SOLUCION 2





export default app;
