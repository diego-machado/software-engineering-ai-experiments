import { Router, Request, Response } from 'express';
import * as flightService from '../services/flightService';

const router = Router();

router.get('/search', async (req: Request, res: Response) => {
  const { origin, destination, date } = req.query;

  if (!origin || !destination || !date) {
    res.status(400).json({
      error: 'Missing required query parameters: origin, destination, date',
    });
    return;
  }

  try {
    const results = await flightService.searchFlights({
      origin: String(origin),
      destination: String(destination),
      date: String(date),
    });

    res.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

export default router;
