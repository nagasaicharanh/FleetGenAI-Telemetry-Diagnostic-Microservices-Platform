export interface SensorData {
  vin: string;
  speed: number;
  engineTemp: number;
  errorCode: string | null;
  timestamp: number;
}

export interface DiagnosticReport {
  vin: string;
  report: string;
  timestamp: number;
  source: "groq" | "worker_error";
}
