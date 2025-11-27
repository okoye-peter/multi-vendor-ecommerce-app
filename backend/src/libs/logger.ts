import winston from 'winston';
import path from 'path';

const logger = winston.createLogger({
    level: 'error',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: path.join(process.cwd(), 'logs', 'error.log'),
            level: 'error'
        })
    ]
});

export default logger;