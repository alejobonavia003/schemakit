import app from './app.js';
import { config } from './config/index.js';

app.listen(config.port, () => {
  console.log(`🚀 lucio111 corriendo en http://localhost:${config.port}`);
  console.log(`   Entorno: ${config.nodeEnv}`);
});
