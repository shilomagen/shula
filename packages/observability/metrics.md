# NestJS OpenTelemetry Metrics Implementation

This document provides a comprehensive guide for implementing a generic metrics reporting system for NestJS applications with OpenTelemetry auto-instrumentation.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Core Components](#core-components)
  - [Metrics Service](#metrics-service)
  - [Metrics Decorators](#metrics-decorators)
  - [Metrics Module](#metrics-module)
- [Usage Examples](#usage-examples)
  - [Basic Counter Example](#basic-counter-example)
  - [Decorator Usage](#decorator-usage)
  - [Custom Labels and Dimensions](#custom-labels-and-dimensions)
- [Advanced Usage](#advanced-usage)
  - [Specialized Decorators](#specialized-decorators)
  - [Manual Measurement](#manual-measurement)
- [Best Practices](#best-practices)
  - [What To Do](#what-to-do)
  - [What Not To Do](#what-not-to-do)
- [Troubleshooting](#troubleshooting)

## Overview

This implementation provides a generic, reusable way to add metrics to your NestJS application with minimal code changes. It leverages OpenTelemetry's metrics API to track various aspects of your application, including:

- Method execution counts and durations
- Success and error rates
- Custom business metrics

The solution consists of three main components:
1. A central `MetricsService` for managing metric instances
2. A set of decorators for automatic method instrumentation
3. A global module for easy integration

## Setup

### Prerequisites

Ensure you have the required dependencies installed:

```bash
npm install @opentelemetry/api @opentelemetry/sdk-metrics @opentelemetry/exporter-prometheus
```

### Basic Installation

1. Copy the provided files into your project:
   - `metrics.service.ts`
   - `metrics.decorators.ts`
   - `metrics.module.ts`

2. Import the `MetricsModule` in your `app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    MetricsModule,
    // other modules...
  ],
})
export class AppModule {}
```

## Core Components

### Metrics Service

The `MetricsService` manages metric instances and provides methods for recording measurements.

```typescript
// metrics.service.ts
import { Injectable } from '@nestjs/common';
import { metrics, Counter, Histogram, ValueRecorder } from '@opentelemetry/api';

@Injectable()
export class MetricsService {
  private counters: Map<string, Counter> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private valueRecorders: Map<string, ValueRecorder> = new Map();
  private meter = metrics.getMeter('app-metrics');

  // Counter methods
  getCounter(name: string, description?: string, unit?: string, labels?: Record<string, string>): Counter {
    if (!this.counters.has(name)) {
      const counter = this.meter.createCounter(name, {
        description: description || `Counter for ${name}`,
        unit: unit || '1',
      });
      this.counters.set(name, counter);
    }
    return this.counters.get(name);
  }

  incrementCounter(name: string, value = 1, labels?: Record<string, string>): void {
    const counter = this.getCounter(name);
    counter.add(value, labels);
  }

  // Histogram methods
  getHistogram(name: string, description?: string, unit?: string): Histogram {
    if (!this.histograms.has(name)) {
      const histogram = this.meter.createHistogram(name, {
        description: description || `Histogram for ${name}`,
        unit: unit || 'ms',
      });
      this.histograms.set(name, histogram);
    }
    return this.histograms.get(name);
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const histogram = this.getHistogram(name);
    histogram.record(value, labels);
  }

  // Additional methods for other metric types can be added here
}
```

### Metrics Decorators

The decorators automatically instrument method execution with metrics.

```typescript
// metrics.decorators.ts
import { MetricsService } from './metrics.service';

export function TrackMetrics(metricName?: string, labels: Record<string, string> = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const actualMetricName = metricName || `${className}_${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      // Get the metrics service from the Nest.js container
      const metricsService = this.moduleRef?.get(MetricsService, { strict: false });
      
      if (!metricsService) {
        console.warn(`MetricsService not found, metrics for ${actualMetricName} will not be recorded`);
        return originalMethod.apply(this, args);
      }

      // Add method execution counter
      metricsService.incrementCounter(`${actualMetricName}_calls_total`, 1, {
        ...labels,
        class: className,
        method: propertyKey,
      });

      const startTime = Date.now();
      try {
        // Execute the original method
        const result = await originalMethod.apply(this, args);
        
        // Record success metric
        metricsService.incrementCounter(`${actualMetricName}_success_total`, 1, {
          ...labels,
          class: className,
          method: propertyKey,
        });
        
        return result;
      } catch (error) {
        // Record error metric
        metricsService.incrementCounter(`${actualMetricName}_error_total`, 1, {
          ...labels,
          class: className,
          method: propertyKey,
          error_type: error.name,
        });
        
        throw error;
      } finally {
        // Record duration metric
        const duration = Date.now() - startTime;
        metricsService.recordHistogram(`${actualMetricName}_duration_ms`, duration, {
          ...labels,
          class: className,
          method: propertyKey,
        });
      }
    };

    return descriptor;
  };
}
```

### Metrics Module

The global module makes the metrics service accessible throughout your application.

```typescript
// metrics.module.ts
import { Module, Global } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Global() // Make the module global so services can be accessed anywhere
@Module({
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
```

## Usage Examples

### Basic Counter Example

Here's how to use the `MetricsService` directly in a service:

```typescript
import { Injectable } from '@nestjs/common';
import { MetricsService } from './metrics/metrics.service';

@Injectable()
export class OrderService {
  constructor(private metricsService: MetricsService) {}

  async processOrder(order: any): Promise<void> {
    // Increment the orders counter
    this.metricsService.incrementCounter('orders_processed_total', 1, {
      paymentMethod: order.paymentMethod,
      customerType: order.customerType,
    });

    // Record order value in a histogram
    this.metricsService.recordHistogram('order_value', order.totalAmount, {
      currency: order.currency,
    });

    // Process the order...
  }
}
```

### Decorator Usage

To use the `TrackMetrics` decorator, ensure your service has access to the `ModuleRef`:

```typescript
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TrackMetrics } from './metrics/metrics.decorators';

@Injectable()
export class UserService {
  constructor(private moduleRef: ModuleRef) {} // Required for decorator to work

  @TrackMetrics('user_registration', { source: 'web' })
  async registerUser(userData: any): Promise<any> {
    // Your implementation...
    return { id: 'user-123', ...userData };
  }

  @TrackMetrics() // Uses default naming: UserService_getUserById
  async getUserById(id: string): Promise<any> {
    // Your implementation...
    return { id, name: 'Test User' };
  }
}
```

### Custom Labels and Dimensions

Adding custom dimensions to your metrics helps with filtering and analysis:

```typescript
// Using the service directly
this.metricsService.incrementCounter('api_requests_total', 1, {
  endpoint: '/users',
  method: 'GET',
  statusCode: '200',
  region: process.env.AWS_REGION,
});

// Using the decorator with custom labels
@TrackMetrics('database_operation', {
  operation: 'insert',
  table: 'users',
  database: 'main'
})
async insertUser(user: User): Promise<User> {
  // Implementation...
}
```

## Advanced Usage

### Specialized Decorators

You can create specialized decorators for specific use cases:

```typescript
// Additional specialized decorators in metrics.decorators.ts

/**
 * Track HTTP endpoint metrics
 */
export function TrackEndpoint(path?: string, method?: string) {
  return TrackMetrics('http_endpoint', { 
    path: path || 'unknown', 
    method: method || 'unknown' 
  });
}

/**
 * Track database operation metrics
 */
export function TrackDbOperation(operation: string, entity: string) {
  return TrackMetrics('db_operation', { operation, entity });
}

/**
 * Track external API call metrics
 */
export function TrackApiCall(service: string, endpoint: string) {
  return TrackMetrics('external_api_call', { service, endpoint });
}
```

Usage:

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TrackEndpoint, TrackDbOperation, TrackApiCall } from './metrics/metrics.decorators';

@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private moduleRef: ModuleRef,
  ) {}

  @Get(':id')
  @TrackEndpoint('/users/:id', 'GET')
  async getUser(@Param('id') id: string) {
    return this.userService.getUser(id);
  }

  @TrackDbOperation('query', 'users')
  async findUsersByEmail(email: string) {
    // Database operation...
  }

  @TrackApiCall('payment-gateway', 'process-payment')
  async processPayment(paymentData: any) {
    // External API call...
  }
}
```

### Manual Measurement

For more complex scenarios, you can manually time operations:

```typescript
async complexOperation() {
  const startTime = Date.now();
  
  // First phase
  await this.firstPhase();
  const firstPhaseDuration = Date.now() - startTime;
  this.metricsService.recordHistogram('complex_operation_phase1_ms', firstPhaseDuration);
  
  // Second phase
  const phase2Start = Date.now();
  await this.secondPhase();
  const secondPhaseDuration = Date.now() - phase2Start;
  this.metricsService.recordHistogram('complex_operation_phase2_ms', secondPhaseDuration);
  
  // Total duration
  const totalDuration = Date.now() - startTime;
  this.metricsService.recordHistogram('complex_operation_total_ms', totalDuration);
}
```

## Best Practices

### What To Do

✅ **Follow a consistent naming convention**
- Use snake_case for metric names
- Add suffixes like `_total`, `_count`, `_ms` to indicate the type of metric
- Example: `http_requests_total`, `order_processing_time_ms`

✅ **Use meaningful labels**
- Add labels for dimensions you'll want to filter or group by
- Common labels: service name, environment, region, endpoint, status code

✅ **Create meaningful metrics that provide business value**
- Technical metrics: API request counts, latencies, error rates
- Business metrics: order counts, user registrations, transaction values

✅ **Track both successes and failures**
- Create separate counters for successes and errors
- Add error type labels to error metrics

✅ **Document your metrics**
- Provide clear descriptions for all metrics
- Define the unit of measurement (seconds, bytes, counts, etc.)

✅ **Use histograms for durations and values with distributions**
- Request durations
- Response sizes
- Business values (order amounts, item counts)

✅ **Cache metric objects**
- The implementation caches metric objects by name in the MetricsService
- Avoid creating new metric objects for each measurement

### What Not To Do

❌ **Avoid high-cardinality labels**
- Don't use unique IDs, timestamps, or full URLs as label values
- Bad example: using a user ID as a label value would create a metric per user

❌ **Don't over-instrument**
- Focus on critical paths and meaningful operations
- Avoid adding metrics to every tiny function

❌ **Don't ignore error cases**
- Always add try/catch blocks and record errors
- The decorator handles this automatically

❌ **Don't create metrics with overly generic names**
- Bad: `counter`, `requests`
- Good: `payment_processing_requests_total`, `user_registration_failures_total`

❌ **Don't create a new metric for each environment or service**
- Use labels instead: `{ environment: 'production', service: 'user-api' }`

❌ **Don't expose sensitive information in metrics**
- Never include PII, credentials, or sensitive business data in metric names or labels

❌ **Don't create too many metrics**
- Each unique combination of metric name and labels is stored separately
- Too many metrics can impact performance and increase costs

## Troubleshooting

### Decorator not recording metrics

If the decorator isn't recording metrics:

1. Ensure you've injected `ModuleRef` in your service:
```typescript
constructor(private moduleRef: ModuleRef) {}
```

2. Verify the `MetricsModule` is imported in your app module.

3. Check for warnings in your logs about `MetricsService not found`.

### Performance Impact

If you notice performance degradation:

1. Reduce the number of metrics and labels
2. Use sampling for high-volume operations
3. Consider using a more efficient metrics backend

### Missing Data

If metrics are missing:

1. Verify your OpenTelemetry exporter configuration
2. Check that the metric names match between creation and query
3. Ensure label names are consistent

### Module Resolution Issues

If you get dependency injection errors:

1. Make sure `MetricsModule` is imported in your root module
2. Verify you're using the `@Global()` decorator on `MetricsModule`
3. Check circular dependency warnings in your NestJS startup logs