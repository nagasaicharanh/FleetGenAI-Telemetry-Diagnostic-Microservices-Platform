import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import Redis from "ioredis";
import { FleetState } from "./state";
import { startTelemetrySimulator } from "./simulator";
import { DiagnosticReport } from "./types";

const PORT = Number(process.env.PORT ?? 3000);
const REDIS_HOST = process.env.REDIS_HOST ?? "redis";
const REDIS_PORT = Number(process.env.REDIS_PORT ?? 6379);

const app = express();
app.use(cors());
app.use(express.json());

const state = new FleetState();
const redisClient = new Redis({ host: REDIS_HOST, port: REDIS_PORT });

startTelemetrySimulator(redisClient, (payload) => state.upsert(payload));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "gateway" });
});

app.get("/api/vehicles", (_req, res) => {
  res.json({ vehicles: state.getVehicles() });
});

app.get("/api/vehicles/:vin/history", (req, res) => {
  const limit = Number(req.query.limit ?? 60);
  const history = state.getHistory(req.params.vin, Number.isFinite(limit) ? limit : 60);
  res.json({ vin: req.params.vin, points: history });
});

app.get("/api/diagnostics", async (req, res, next) => {
  try {
    const requestedLimit = Number(req.query.limit ?? 20);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 20;
    const rawItems = await redisClient.lrange("diagnostics:feed", 0, limit - 1);
    const diagnostics = rawItems
      .map((raw): DiagnosticReport | null => {
        try {
          return JSON.parse(raw) as DiagnosticReport;
        } catch (error) {
          console.error("Failed to parse diagnostic payload from Redis", error);
          return null;
        }
      })
      .filter((item): item is DiagnosticReport => item !== null);

    res.json({ diagnostics });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Gateway error", error);
  res.status(500).json({ error: "Gateway failed to process request" });
});

app.listen(PORT, () => {
  console.log(`Gateway listening on port ${PORT}`);
});
