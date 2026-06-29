import morgan, { StreamOptions } from 'morgan';
import { logger } from '../utils/logger';

const stream: StreamOptions = {
  write: (message) => logger.http(message.trim()),
};

export const requestLogger = morgan(
  ':remote-addr :method :url :status :res[content-length] - :response-time ms',
  { stream },
);
