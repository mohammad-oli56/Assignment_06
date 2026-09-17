import { createClient } from 'redis';
import config from '../config';

 export const Redisclient = createClient({
    username:config.REDIS_USER,
    password:config.REDIS_PASSWORD,
    socket: {
        host: config.REDIS_HOST,
        port: Number(config.REDIS_PORT)
    }
});