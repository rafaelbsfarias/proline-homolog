type CounterMap = Record<string, number>;

export class MetricsService {
  private static instance: MetricsService;
  private counters: CounterMap = Object.create(null);

  static getInstance(): MetricsService {
    if (!MetricsService.instance) MetricsService.instance = new MetricsService();
    return MetricsService.instance;
  }

  inc(key: string, by: number = 1) {
    this.counters[key] = (this.counters[key] || 0) + by;
  }

  get(key: string): number {
    return this.counters[key] || 0;
  }

  snapshot(): CounterMap {
    return { ...this.counters };
  }
}
