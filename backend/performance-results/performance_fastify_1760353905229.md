# 📊 Performance Test Report

**Server Type:** Fastify
**Timestamp:** 2025-10-13T11:11:45.227Z
**API URL:** http://localhost:3000/api
**Iterations per endpoint:** 10

## 📈 Overall Statistics

- **Average Response Time:** 141.24ms
- **Fastest Endpoint:** Customers List (73.40ms)
- **Slowest Endpoint:** Rentals List (274.50ms)

## 📋 Detailed Results

| Endpoint | Avg Time | Min Time | Max Time | Success Rate |
|----------|----------|----------|----------|-------------|
| Health Check | 0.0ms | 0ms | 0ms | 0% |
| Vehicles List | 80.9ms | 47ms | 359ms | 100% |
| Rentals List | 274.5ms | 248ms | 387ms | 100% |
| Customers List | 73.4ms | 46ms | 275ms | 100% |
| Expenses List | 174.1ms | 151ms | 198ms | 100% |
| Insurances List | 103.3ms | 93ms | 109ms | 100% |

## 🎯 Performance Grade

**Grade: A ⭐⭐**

Very good performance. Average response time under 200ms.
