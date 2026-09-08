export function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  console.error(`[ERROR] ${status} - ${err.message}`);

  res.status(status).json({
    ok: false,
    error: {
      message: err.message || 'Error interno del servidor',
      status,
    },
  });
}
