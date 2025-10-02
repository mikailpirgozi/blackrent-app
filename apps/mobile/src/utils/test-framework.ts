/**
 * 🧪 Comprehensive Testing Framework
 * Advanced testing utilities for BlackRent Mobile App
 */

import { logger } from './logger';
import { performanceMonitor } from './performance-monitor';

interface TestCase {
  id: string;
  name: string;
  description: string;
  category: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeout: number;
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  test: () => Promise<TestResult>;
}

interface TestResult {
  passed: boolean;
  duration: number;
  error?: Error;
  details?: any;
  performance?: {
    memoryUsage: number;
    renderTime: number;
    apiResponseTime: number;
  };
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: TestCase[];
  beforeAll?: () => Promise<void>;
  afterAll?: () => Promise<void>;
  beforeEach?: () => Promise<void>;
  afterEach?: () => Promise<void>;
}

interface TestReport {
  id: string;
  timestamp: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalDuration: number;
  coverage?: number;
  results: Array<{
    testId: string;
    testName: string;
    result: TestResult;
  }>;
  performance: {
    averageMemoryUsage: number;
    averageRenderTime: number;
    averageApiResponseTime: number;
  };
}

class TestFramework {
  private testSuites: Map<string, TestSuite> = new Map();
  private testResults: Map<string, TestResult> = new Map();
  private isRunning = false;
  private currentReport: TestReport | null = null;

  /**
   * Register a test suite
   */
  registerSuite(suite: TestSuite): void {
    this.testSuites.set(suite.id, suite);
    logger.debug(`Test suite registered: ${suite.name}`);
  }

  /**
   * Register a single test case
   */
  registerTest(suiteId: string, test: TestCase): void {
    const suite = this.testSuites.get(suiteId);
    if (suite) {
      suite.tests.push(test);
      logger.debug(`Test case registered: ${test.name} in suite ${suite.name}`);
    } else {
      logger.error(`Test suite not found: ${suiteId}`);
    }
  }

  /**
   * Run all test suites
   */
  async runAllTests(): Promise<TestReport> {
    if (this.isRunning) {
      throw new Error('Tests are already running');
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    logger.info('🧪 Starting comprehensive test run...');

    try {
      const reportId = this.generateId();
      this.currentReport = {
        id: reportId,
        timestamp: startTime,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        totalDuration: 0,
        results: [],
        performance: {
          averageMemoryUsage: 0,
          averageRenderTime: 0,
          averageApiResponseTime: 0,
        },
      };

      // Run all test suites
      for (const [suiteId, suite] of this.testSuites) {
        await this.runTestSuite(suite);
      }

      // Calculate final metrics
      this.currentReport.totalDuration = Date.now() - startTime;
      this.calculatePerformanceAverages();

      logger.info(`✅ Test run completed: ${this.currentReport.passedTests}/${this.currentReport.totalTests} passed`);
      
      return this.currentReport;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run a specific test suite
   */
  async runTestSuite(suite: TestSuite): Promise<void> {
    logger.info(`📋 Running test suite: ${suite.name}`);

    try {
      // Run beforeAll hook
      if (suite.beforeAll) {
        await suite.beforeAll();
      }

      // Run each test
      for (const test of suite.tests) {
        await this.runSingleTest(suite, test);
      }

      // Run afterAll hook
      if (suite.afterAll) {
        await suite.afterAll();
      }
    } catch (error) {
      logger.error(`Test suite failed: ${suite.name}`, error);
    }
  }

  /**
   * Run a single test case
   */
  async runSingleTest(suite: TestSuite, test: TestCase): Promise<void> {
    const testStartTime = Date.now();
    
    logger.debug(`🔬 Running test: ${test.name}`);

    try {
      // Run beforeEach hook
      if (suite.beforeEach) {
        await suite.beforeEach();
      }

      // Run test setup
      if (test.setup) {
        await test.setup();
      }

      // Start performance monitoring
      const memoryBefore = performanceMonitor.getMemoryUsage();
      performanceMonitor.startMeasurement(`test_${test.id}`);

      // Run the actual test with timeout
      const result = await this.runWithTimeout(test.test, test.timeout);
      
      // End performance monitoring
      const duration = performanceMonitor.endMeasurement(`test_${test.id}`, 'renderTime');
      const memoryAfter = performanceMonitor.getMemoryUsage();

      // Enhance result with performance data
      result.duration = duration;
      result.performance = {
        memoryUsage: memoryAfter - memoryBefore,
        renderTime: duration,
        apiResponseTime: 0, // Would be measured in actual API tests
      };

      // Store result
      this.testResults.set(test.id, result);
      
      if (this.currentReport) {
        this.currentReport.totalTests++;
        this.currentReport.results.push({
          testId: test.id,
          testName: test.name,
          result,
        });

        if (result.passed) {
          this.currentReport.passedTests++;
          logger.debug(`✅ Test passed: ${test.name} (${duration}ms)`);
        } else {
          this.currentReport.failedTests++;
          logger.error(`❌ Test failed: ${test.name}`, result.error);
        }
      }

      // Run test teardown
      if (test.teardown) {
        await test.teardown();
      }

      // Run afterEach hook
      if (suite.afterEach) {
        await suite.afterEach();
      }
    } catch (error) {
      // Handle test execution errors
      const result: TestResult = {
        passed: false,
        duration: Date.now() - testStartTime,
        error: error instanceof Error ? error : new Error('Unknown test error'),
      };

      this.testResults.set(test.id, result);
      
      if (this.currentReport) {
        this.currentReport.totalTests++;
        this.currentReport.failedTests++;
        this.currentReport.results.push({
          testId: test.id,
          testName: test.name,
          result,
        });
      }

      logger.error(`❌ Test execution failed: ${test.name}`, error);
    }
  }

  /**
   * Run function with timeout
   */
  private async runWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Test timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timer));
    });
  }

  /**
   * Calculate performance averages
   */
  private calculatePerformanceAverages(): void {
    if (!this.currentReport || this.currentReport.results.length === 0) {
      return;
    }

    const results = this.currentReport.results;
    const totalMemory = results.reduce((sum, r) => 
      sum + (r.result.performance?.memoryUsage || 0), 0);
    const totalRenderTime = results.reduce((sum, r) => 
      sum + (r.result.performance?.renderTime || 0), 0);
    const totalApiTime = results.reduce((sum, r) => 
      sum + (r.result.performance?.apiResponseTime || 0), 0);

    this.currentReport.performance = {
      averageMemoryUsage: totalMemory / results.length,
      averageRenderTime: totalRenderTime / results.length,
      averageApiResponseTime: totalApiTime / results.length,
    };
  }

  /**
   * Get test results
   */
  getTestResults(): Map<string, TestResult> {
    return new Map(this.testResults);
  }

  /**
   * Get latest test report
   */
  getLatestReport(): TestReport | null {
    return this.currentReport;
  }

  /**
   * Clear all test results
   */
  clearResults(): void {
    this.testResults.clear();
    this.currentReport = null;
    logger.debug('Test results cleared');
  }

  /**
   * Generate test report
   */
  generateReport(format: 'json' | 'html' | 'junit' = 'json'): string {
    if (!this.currentReport) {
      throw new Error('No test report available');
    }

    switch (format) {
      case 'json':
        return JSON.stringify(this.currentReport, null, 2);
      case 'html':
        return this.generateHTMLReport();
      case 'junit':
        return this.generateJUnitReport();
      default:
        return JSON.stringify(this.currentReport, null, 2);
    }
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(): string {
    if (!this.currentReport) return '';

    const report = this.currentReport;
    const passRate = ((report.passedTests / report.totalTests) * 100).toFixed(1);

    return `
<!DOCTYPE html>
<html>
<head>
    <title>BlackRent Mobile - Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .stats { display: flex; gap: 20px; margin-bottom: 20px; }
        .stat { background: white; padding: 15px; border-radius: 8px; border: 1px solid #ddd; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .test-result { padding: 10px; border-bottom: 1px solid #eee; }
        .test-passed { background: #d4edda; }
        .test-failed { background: #f8d7da; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 BlackRent Mobile - Test Report</h1>
        <p>Generated: ${new Date(report.timestamp).toLocaleString()}</p>
        <p>Duration: ${report.totalDuration}ms</p>
    </div>
    
    <div class="stats">
        <div class="stat">
            <h3>Total Tests</h3>
            <p>${report.totalTests}</p>
        </div>
        <div class="stat">
            <h3 class="passed">Passed</h3>
            <p>${report.passedTests}</p>
        </div>
        <div class="stat">
            <h3 class="failed">Failed</h3>
            <p>${report.failedTests}</p>
        </div>
        <div class="stat">
            <h3>Pass Rate</h3>
            <p>${passRate}%</p>
        </div>
    </div>
    
    <h2>Test Results</h2>
    ${report.results.map(r => `
        <div class="test-result ${r.result.passed ? 'test-passed' : 'test-failed'}">
            <h4>${r.result.passed ? '✅' : '❌'} ${r.testName}</h4>
            <p>Duration: ${r.result.duration}ms</p>
            ${r.result.error ? `<p>Error: ${r.result.error.message}</p>` : ''}
        </div>
    `).join('')}
</body>
</html>`;
  }

  /**
   * Generate JUnit XML report
   */
  private generateJUnitReport(): string {
    if (!this.currentReport) return '';

    const report = this.currentReport;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites tests="${report.totalTests}" failures="${report.failedTests}" time="${report.totalDuration / 1000}">
    <testsuite name="BlackRent Mobile Tests" tests="${report.totalTests}" failures="${report.failedTests}" time="${report.totalDuration / 1000}">
        ${report.results.map(r => `
        <testcase name="${r.testName}" time="${r.result.duration / 1000}">
            ${!r.result.passed ? `<failure message="${r.result.error?.message || 'Test failed'}">${r.result.error?.stack || ''}</failure>` : ''}
        </testcase>
        `).join('')}
    </testsuite>
</testsuites>`;
  }

  /**
   * Utility method to generate unique IDs
   */
  private generateId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global test framework instance
export const testFramework = new TestFramework();

/**
 * Helper function to create test cases
 */
export function createTest(
  name: string,
  testFn: () => Promise<TestResult>,
  options: Partial<Omit<TestCase, 'id' | 'name' | 'test'>> = {}
): TestCase {
  return {
    id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: options.description || name,
    category: options.category || 'unit',
    priority: options.priority || 'medium',
    timeout: options.timeout || 30000, // 30 seconds default
    setup: options.setup,
    teardown: options.teardown,
    test: testFn,
  };
}

/**
 * Helper function to create test suites
 */
export function createTestSuite(
  name: string,
  tests: TestCase[],
  options: Partial<Omit<TestSuite, 'id' | 'name' | 'tests'>> = {}
): TestSuite {
  return {
    id: `suite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: options.description || name,
    tests,
    beforeAll: options.beforeAll,
    afterAll: options.afterAll,
    beforeEach: options.beforeEach,
    afterEach: options.afterEach,
  };
}

/**
 * Assertion helpers
 */
export const assert = {
  /**
   * Assert that a value is truthy
   */
  isTrue(value: any, message?: string): void {
    if (!value) {
      throw new Error(message || `Expected truthy value, got: ${value}`);
    }
  },

  /**
   * Assert that a value is falsy
   */
  isFalse(value: any, message?: string): void {
    if (value) {
      throw new Error(message || `Expected falsy value, got: ${value}`);
    }
  },

  /**
   * Assert that two values are equal
   */
  equals(actual: any, expected: any, message?: string): void {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  },

  /**
   * Assert that two values are deeply equal
   */
  deepEquals(actual: any, expected: any, message?: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  },

  /**
   * Assert that a function throws an error
   */
  async throws(fn: () => Promise<any> | any, message?: string): Promise<void> {
    try {
      await fn();
      throw new Error(message || 'Expected function to throw an error');
    } catch (error) {
      // Expected behavior
    }
  },

  /**
   * Assert that a value is defined
   */
  isDefined(value: any, message?: string): void {
    if (value === undefined || value === null) {
      throw new Error(message || `Expected defined value, got: ${value}`);
    }
  },

  /**
   * Assert that a value is of a specific type
   */
  isType(value: any, expectedType: string, message?: string): void {
    const actualType = typeof value;
    if (actualType !== expectedType) {
      throw new Error(message || `Expected type ${expectedType}, got ${actualType}`);
    }
  },

  /**
   * Assert that an array contains a value
   */
  contains(array: any[], value: any, message?: string): void {
    if (!Array.isArray(array) || !array.includes(value)) {
      throw new Error(message || `Expected array to contain ${value}`);
    }
  },

  /**
   * Assert that a string matches a regex pattern
   */
  matches(str: string, pattern: RegExp, message?: string): void {
    if (!pattern.test(str)) {
      throw new Error(message || `Expected "${str}" to match pattern ${pattern}`);
    }
  },
};

/**
 * Mock helpers
 */
export const mock = {
  /**
   * Create a mock function
   */
  fn<T extends (...args: any[]) => any>(implementation?: T): T & {
    calls: Parameters<T>[];
    results: ReturnType<T>[];
    reset: () => void;
  } {
    const calls: Parameters<T>[] = [];
    const results: ReturnType<T>[] = [];

    const mockFn = ((...args: Parameters<T>) => {
      calls.push(args);
      const result = implementation ? implementation(...args) : undefined;
      results.push(result);
      return result;
    }) as T & {
      calls: Parameters<T>[];
      results: ReturnType<T>[];
      reset: () => void;
    };

    mockFn.calls = calls;
    mockFn.results = results;
    mockFn.reset = () => {
      calls.length = 0;
      results.length = 0;
    };

    return mockFn;
  },

  /**
   * Create a mock object
   */
  object<T extends object>(partial: Partial<T> = {}): T {
    return new Proxy(partial as T, {
      get(target, prop) {
        if (prop in target) {
          return target[prop as keyof T];
        }
        return mock.fn();
      },
    });
  },
};

/**
 * Performance testing helpers
 */
export const performance = {
  /**
   * Measure execution time
   */
  async measureTime<T>(fn: () => Promise<T> | T): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    return { result, duration };
  },

  /**
   * Measure memory usage
   */
  measureMemory<T>(fn: () => T): { result: T; memoryDelta: number } {
    const memoryBefore = performanceMonitor.getMemoryUsage();
    const result = fn();
    const memoryAfter = performanceMonitor.getMemoryUsage();
    return { result, memoryDelta: memoryAfter - memoryBefore };
  },

  /**
   * Benchmark function execution
   */
  async benchmark(
    fn: () => Promise<any> | any,
    iterations: number = 100
  ): Promise<{
    averageTime: number;
    minTime: number;
    maxTime: number;
    totalTime: number;
  }> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const { duration } = await performance.measureTime(fn);
      times.push(duration);
    }

    return {
      averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      totalTime: times.reduce((sum, time) => sum + time, 0),
    };
  },
};
