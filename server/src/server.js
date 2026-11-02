import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { createApp } from './app.js';

await connectDb();
const app = createApp();
const server = app.listen(env.port, () => console.log(`GrowWise API listening on http://localhost:${env.port} (${env.nodeEnv})`));
const shutdown = () => server.close(() => process.exit(0));
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
