import { Injectable } from '@nestjs/common';
import { metrics, Meter, Counter, Histogram } from '@opentelemetry/api';

@Injectable()
export class MetricsService {
  private counters: Map<string, Counter> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private meter: Meter;

  constructor() {
    this.meter = metrics.getMeter('app-metrics');
  }

  /**
   * Get or create a counter metric
   */
  getCounter(name: string, description?: string, unit?: string): Counter {
    if (!this.counters.has(name)) {
      const counter = this.meter.createCounter(name, {
        description: description || `Counter for ${name}`,
        unit: unit || '1',
      });
      this.counters.set(name, counter);
    }
    return this.counters.get(name)!;
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(
    name: string,
    value = 1,
    labels?: Record<string, string>
  ): void {
    const counter = this.getCounter(name);
    counter.add(value, labels);
  }

  /**
   * Get or create a histogram metric
   */
  getHistogram(name: string, description?: string, unit?: string): Histogram {
    if (!this.histograms.has(name)) {
      const histogram = this.meter.createHistogram(name, {
        description: description || `Histogram for ${name}`,
        unit: unit || 'ms',
      });
      this.histograms.set(name, histogram);
    }
    return this.histograms.get(name)!;
  }

  /**
   * Record a value in a histogram metric
   */
  recordHistogram(
    name: string,
    value: number,
    labels?: Record<string, string>
  ): void {
    const histogram = this.getHistogram(name);
    histogram.record(value, labels);
  }
}
