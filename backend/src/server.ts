import 'dotenv/config';
import { app } from '@/app';
import { logger } from '@/utils/logger';

const PORT = process.env.PORT ?? 4000;

app.listen(PORT, () => {
  logger.info(`API server ready at http://localhost:${PORT}`);
});
