import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import analysisRoutes from './routes/analysis';
import strategyRoutes from './routes/strategy';
import backtestRoutes from './routes/backtest';
import executeRoutes from './routes/execute';
import journalRoutes from './routes/journal';
import marketplaceRoutes from './routes/marketplace';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/analysis', analysisRoutes);
app.use('/api/strategy', strategyRoutes);
app.use('/api/backtest', backtestRoutes);
app.use('/api/execute', executeRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/marketplace', marketplaceRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`TradePulse API running on :${PORT}`));
