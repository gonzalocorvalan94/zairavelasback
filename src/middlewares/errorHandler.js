const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = err.message || 'Error en el servidor';
  res.status(status).json({ message });
};

export default errorHandler;