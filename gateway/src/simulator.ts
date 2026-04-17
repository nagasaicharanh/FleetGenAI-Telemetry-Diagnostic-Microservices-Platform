import Redis from "ioredis";
import { SensorData } from "./types";

const VIN_LIST = ["VIN-001", "VIN-002", "VIN-003", "VIN-004", "VIN-005"];

const publishTelemetry = async (
  redisPublisher: Redis,
  payload: SensorData,
): Promise<void> => {
  await redisPublisher.publish("telemetry_stream", JSON.stringify(payload));
};

const generatePayload = (vin: string): SensorData => {
  const anomaly = Math.random() < 0.02;
  const speed = Math.round(Math.random() * 160);
  const engineTemp = anomaly
    ? 116 + Math.round(Math.random() * 14)
    : 75 + Math.round(Math.random() * 30);

  return {
    vin,
    speed,
    engineTemp,
    errorCode: anomaly ? "P0217" : null,
    timestamp: Date.now(),
  };
};

export const startTelemetrySimulator = (
  redisPublisher: Redis,
  onTelemetry: (payload: SensorData) => void,
): NodeJS.Timeout => {
  return setInterval(async () => {
    const payloads = VIN_LIST.map((vin) => generatePayload(vin));

    await Promise.all(
      payloads.map(async (payload) => {
        onTelemetry(payload);
        await publishTelemetry(redisPublisher, payload);
      }),
    );
  }, 1_000);
};
