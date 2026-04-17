import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SensorData = {
  vin: string;
  speed: number;
  engineTemp: number;
  errorCode: string | null;
  timestamp: number;
};

type DiagnosticReport = {
  vin: string;
  report: string;
  timestamp: number;
  source: "groq" | "worker_error";
};

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL ?? "http://localhost:3000";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${GATEWAY_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

function App() {
  const [vehicles, setVehicles] = useState<SensorData[]>([]);
  const [selectedVin, setSelectedVin] = useState<string>("VIN-001");
  const [history, setHistory] = useState<SensorData[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticReport[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVehiclesAndDiagnostics = async (): Promise<void> => {
      try {
        const [vehiclesData, diagnosticsData] = await Promise.all([
          fetchJson<{ vehicles: SensorData[] }>("/api/vehicles"),
          fetchJson<{ diagnostics: DiagnosticReport[] }>("/api/diagnostics?limit=20"),
        ]);
        setVehicles(vehiclesData.vehicles);
        setDiagnostics(diagnosticsData.diagnostics);
        if (!vehiclesData.vehicles.find((vehicle) => vehicle.vin === selectedVin) && vehiclesData.vehicles[0]) {
          setSelectedVin(vehiclesData.vehicles[0].vin);
        }
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load gateway data.");
      }
    };

    void loadVehiclesAndDiagnostics();
    const intervalId = setInterval(() => {
      void loadVehiclesAndDiagnostics();
    }, 2_000);
    return () => clearInterval(intervalId);
  }, [selectedVin]);

  useEffect(() => {
    if (!selectedVin) {
      return;
    }

    const loadHistory = async (): Promise<void> => {
      try {
        const historyData = await fetchJson<{ points: SensorData[] }>(
          `/api/vehicles/${encodeURIComponent(selectedVin)}/history?limit=90`,
        );
        setHistory(historyData.points);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load telemetry history.");
      }
    };

    void loadHistory();
    const intervalId = setInterval(() => {
      void loadHistory();
    }, 1_500);
    return () => clearInterval(intervalId);
  }, [selectedVin]);

  const latestSelectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.vin === selectedVin) ?? null,
    [selectedVin, vehicles],
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 lg:p-6">
        <header className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h1 className="text-2xl font-semibold tracking-tight">FleetGenAI Control Room</h1>
          <p className="text-sm text-slate-400">Live telemetry + GenAI diagnostics</p>
        </header>

        {error ? (
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-medium">Telemetry Stream</h2>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                Vehicle
                <select
                  className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1"
                  value={selectedVin}
                  onChange={(event) => setSelectedVin(event.target.value)}
                >
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.vin} value={vehicle.vin}>
                      {vehicle.vin}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#94a3b8"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis yAxisId="speed" stroke="#38bdf8" domain={[0, 180]} />
                  <YAxis yAxisId="temp" orientation="right" stroke="#f97316" domain={[60, 140]} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid #334155" }}
                    labelFormatter={(value) => new Date(Number(value)).toLocaleString()}
                  />
                  <Legend />
                  <Line yAxisId="speed" type="monotone" dataKey="speed" stroke="#38bdf8" dot={false} name="Speed km/h" />
                  <Line
                    yAxisId="temp"
                    type="monotone"
                    dataKey="engineTemp"
                    stroke="#f97316"
                    dot={false}
                    name="Engine Temp C"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {latestSelectedVehicle ? (
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <p className="text-slate-400">Speed</p>
                  <p className="text-xl font-semibold">{latestSelectedVehicle.speed} km/h</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <p className="text-slate-400">Engine Temp</p>
                  <p className="text-xl font-semibold">{latestSelectedVehicle.engineTemp} C</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <p className="text-slate-400">Error Code</p>
                  <p className="text-xl font-semibold">{latestSelectedVehicle.errorCode ?? "None"}</p>
                </div>
              </div>
            ) : null}
          </article>

          <aside className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-medium">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              GenAI Alert Feed
            </h2>
            <div className="flex max-h-[30rem] flex-col gap-2 overflow-y-auto pr-1">
              {diagnostics.length === 0 ? (
                <p className="text-sm text-slate-400">No diagnostics yet. Waiting for anomaly events...</p>
              ) : (
                diagnostics.map((diagnostic) => (
                  <article key={`${diagnostic.vin}-${diagnostic.timestamp}`} className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm">
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">{diagnostic.vin}</span>
                      <span>{new Date(diagnostic.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-200">{diagnostic.report}</p>
                  </article>
                ))
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

export default App;
