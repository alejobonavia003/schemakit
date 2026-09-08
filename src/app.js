import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mainRouter from './routes/index.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rutas, todas bajo el prefijo /api
app.use('/api', mainRouter);

// Manejo de 404 y errores (siempre al final)
app.use(notFound);
app.use(errorHandler);

export default app;
