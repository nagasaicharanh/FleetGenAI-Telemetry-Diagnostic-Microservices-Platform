import { SensorData } from "./types";

const HISTORY_LIMIT = 180;

export class FleetState {
  private readonly latestByVin = new Map<string, SensorData>();
  private readonly historyByVin = new Map<string, SensorData[]>();

  upsert(data: SensorData): void {
    this.latestByVin.set(data.vin, data);

    const history = this.historyByVin.get(data.vin) ?? [];
    history.push(data);
    if (history.length > HISTORY_LIMIT) {
      history.splice(0, history.length - HISTORY_LIMIT);
    }

    this.historyByVin.set(data.vin, history);
  }

  getVehicles(): SensorData[] {
    return [...this.latestByVin.values()].sort((a, b) => a.vin.localeCompare(b.vin));
  }

  getHistory(vin: string, limit: number): SensorData[] {
    const history = this.historyByVin.get(vin) ?? [];
    return history.slice(-Math.max(1, limit));
  }
}
