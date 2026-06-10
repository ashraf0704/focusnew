import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import {authMiddleware} from './middleware/authMiddleware.js';
import {errorHandler} from './middleware/errorHandler.js';
import {aiLimiter, paymentLimiter, authLimiter} from './middleware/rateLimiter.js';
import {aiRouter} from './routes/ai.js';
import {authRouter} from './routes/auth.js';
import {badgesRouter} from './routes/badges.js';
import {decksRouter} from './routes/decks.js';
import {paymentsRouter} from './routes/payments.js';
import {profileRouter} from './routes/profile.js';
import {pushRouter} from './routes/push.js';
import {sessionsRouter} from './routes/sessions.js';
import {subjectsRouter} from './routes/subjects.js';
import {tasksRouter} from './routes/tasks.js';
import {vaultRouter} from './routes/vault.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const allowedOrigins = new Set(['http://localhost:3000', process.env.APP_URL].filter(Boolean) as string[]);

app.use(cors({
  origin(origin, callback) {
    // Allow any origin in local development to avoid CORS blocks across web, emulator, and physical mobile devices
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({limit: '2mb'}));

app.get('/health', (_req, res) => res.json({ok: true}));
app.use('/api/auth', authLimiter, authRouter);
app.use('/api', authMiddleware);
app.use('/api/profile', profileRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/decks', decksRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/badges', badgesRouter);
app.use('/api/vault', vaultRouter);
app.use('/api/ai', aiLimiter, aiRouter);
app.use('/api/payments', paymentLimiter, paymentsRouter);
app.use('/api/push', pushRouter);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Focus Buddy API listening on http://localhost:${port}`);
});
