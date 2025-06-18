# Enterprise Bulk Operations Platform

A high-performance solution for **large-scale data operations** built with **Express.js, Node.js, MongoDB, Redis, and Kafka**. Designed to process **CSV-based updates** with enterprise-grade reliability, monitoring, and fault tolerance.

---

## Technology Framework
| **Component** | **Purpose** |
|--------------|----------|
| **Express.js & Node.js** | RESTful API backend |
| **MongoDB** | Persistent storage for operation metadata |
| **Kafka** | Distributed message broker for asynchronous processing |
| **Elasticsearch** | Advanced logging capability (planned for future release) |
| **Redis** | Distributed caching and rate control |
| **Postman** | Endpoint testing and validation |

---

## Architecture Overview

![image](https://github.com/user-attachments/assets/fd91db97-ae1a-41c0-be04-c5afd85fe8ff)


This platform is designed to handle high-volume bulk operations (like uploading and processing contact data) in a reliable, scalable, and fault-tolerant way. It uses microservices architecture, event-driven communication via Kafka, distributed caching, object storage, and MongoDB for metadata and entity management.


### ***How It Works*** ###
The architecture enables seamless submission, processing, and monitoring of bulk action tasks. It ensures high availability, deduplication, fault tolerance, and transparency through metrics and retry mechanisms.

1. Request Handling:
   - **User Interaction:** Users initiate operations by submitting bulk requests (e.g., uploading a contact CSV) via POST /bulk-actions.
   - **API Gateway:** Requests go through the API Gateway which routes traffic securely and ensures authentication/authorization.
   - **Load Balancer:** Balances traffic load across services to maintain high availability and scalability.
2. Traffic Management:
   - The API Gateway and Load Balancer act as the first layer of defense and routing.
   - Authentication and rate-limiting are enforced using distributed Cache before processing proceeds.
3. Operation Orchestration:
   - Accepts the request and stores Action Metadata in MongoDB.
   - Stores the uploaded Action File (CSV) in File Storage.
   - Maintains a Scheduler Service to orchestrate and trigger downstream processing.
4. Data Processing Pipeline:
   - Pulls Action Metadata.
   - Parses and validates records.
   - Checks for email duplication using Cache.
   - Failed messages are routed to Dead Letter Queue (DLQ) for debugging and optional retries.
   - Records are inserted/updated in MongoDB.
   - A subset of logs or indexing is written to ElasticSearch for searchability (e.g., logs of bulk uploads).
   - Each record is tagged with status, audit trails, and error messages (if any).
5. Progress Monitoring
   The Bulk Action Service provides APIs to monitor progress and fetch stats:
   - GET /bulk-actions – List all submitted bulk actions.
   - GET /bulk-actions/{actionId} – Details of a specific action.
   - GET /bulk-actions/{actionId}/stats – Statistical view including processed, failed, and pending counts.
   Progress data is periodically updated in MongoDB and optionally cached.
6. Key Features
   - **Scalability:** Kafka decouples ingestion from processing for scalability.
   - **Resilience:** DLQ and Retry mechanisms ensure fault tolerance.
   - **Deduplication:** Ensured using distributed cache.
   - **Search & Monitoring:** ElasticSearch and MongoDB provide visibility and traceability.
   - **Separation of Concerns:** Clear separation between ingestion, processing, storage, and monitoring.

---

## Enterprise Capabilities

### Throughput Control System (Implemented)

A sophisticated traffic management layer protects system resources and ensures equitable usage across enterprise customers.

#### Key Components:
- Operations require `accountId` attribution for traffic governance and analytics
- Redis-powered traffic management with distributed counter architecture
- Graceful request throttling with HTTP 429 responses when thresholds are exceeded

#### Technical Architecture:
- Dedicated throttling layer (`rateLimit.middleware.ts`) pre-processes all incoming requests
- Advanced sliding window mechanism for precise traffic measurement
- Self-healing counters with automatic expiration to optimize memory utilization
- Environment-specific configuration supporting different SLAs per deployment

### Intelligent Deduplication Engine (Proposed Design)

Automated detection and handling of duplicate records using distributed data structures for maximum efficiency.

#### Implementation Strategy:
- Leverages **Redis Sets** for high-performance uniqueness verification using `actionId` as namespace
- Post-production validation that flags email collisions before expensive database operations
- Records with duplicate emails receive "DUPLICATE" classification and "SKIPPED" status
- Complete visibility with comprehensive duplicate metrics in operation statistics

#### Business Value:
- Guarantees single-instance processing to prevent duplicate database operations
- Horizontally scalable architecture with externalized state management
- Full audit capabilities through comprehensive logging of skipped records
- Negligible performance overhead through optimized Redis operations

### Time-Targeted Processing (Proposed Design)

Enables precise timing control for operations to support business needs like off-hours processing and coordinated campaigns.

#### Implementation Strategy:
- API supports future execution through the `scheduledAt` parameter using ISO 8601 datetime format
- Operations remain in "SCHEDULED" state until their designated execution window
- Dedicated time-based dispatcher evaluates pending operations on configurable intervals
- Seamless transition to standard "QUEUED" status when execution time arrives

#### Request Format:
```json
{
  "actionType": "BULK_UPDATE",
  "entityType": "Contact",
  "file": "contacts.csv",
  "scheduledAt": "2025-11-22T23:15:00Z"
}
```

#### Technical Architecture:
- MongoDB TTL index-based job storage for efficient time-based queries
- Background scheduler service with configurable polling frequency
- Comprehensive retry mechanisms for handling execution failures

---

## Demonstration Materials

### Interactive Demo

[Demo link will be added soon]

---

## API Testing Resources

A complete Postman collection is available for testing all endpoints.
https://github.com/dgupta786/bulk-action-service/blob/main/Bulk%20Action%20APIs.postman_collection.json

---

## REST API Reference

### Initiate Bulk Operation
**Endpoint:** POST /bulk-actions

**Request Body:**
```
{
  "actionType": "BULK_UPDATE",
  "entityType": "Contact",
  "file": test.csv
}
```
**Response:**
```
{
    "actionId": "6853022036be030cdf6728eb",
    "status": "QUEUED",
    "message": "Success! Your bulk action has been queued for processing."
}
```

### Retrieve All Operations
**Endpoint:** GET /bulk-actions

**Response Sample:**
```
[
    {
        "actionId": "6853125fb5f7146ba8e71fc7",
        "actionType": "BULK_UPDATE",
        "entityType": "Contact",
        "status": "COMPLETED",
        "totalCount": 3510,
        "processedCount": 3510,
        "successCount": 0,
        "failureCount": 0,
        "skippedCount": 0,
        "createdAt": "2025-06-18T19:24:15.835Z"
    },
    {
        "actionId": "6853022036be030cdf6728eb",
        "actionType": "BULK_UPDATE",
        "entityType": "Contact",
        "status": "COMPLETED",
        "totalCount": 3510,
        "processedCount": 3510,
        "successCount": 0,
        "failureCount": 0,
        "skippedCount": 0,
        "createdAt": "2025-06-18T18:14:56.821Z"
    }
]
```

### Retrieve Operation Details
**Endpoint:** GET /bulk-actions/{actionId}

**Response Sample:**
```
{
    "actionId": "6853022036be030cdf6728eb",
    "actionType": "BULK_UPDATE",
    "entityType": "Contact",
    "status": "COMPLETED",
    "totalCount": 3510,
    "processedCount": 3510,
    "successCount": 0,
    "failureCount": 0,
    "skippedCount": 0,
    "createdAt": "2025-06-18T18:14:56.821Z"
}
```

### Retrieve Operation Metrics
**Endpoint:** GET /bulk-actions/{actionId}/stats

**Response Sample:**
```
{
    "actionId": "6853022036be030cdf6728eb",
    "totalCount": 3510,
    "processedCount": 3510,
    "successCount": 0,
    "failureCount": 0,
    "skippedCount": 0
}
```

---

## Development Guide

### Repository Setup
```
git clone https://github.com/dgupta786/bulk-action-service.git
cd bulk-action-service
```

### Dependency Installation (Node.js v16)
```
npm install
```

### Configuration
Create a `.env` file in the project root with the following parameters:
```
MONGO_DB_URI=mongodb://localhost:27017
BATCH_SIZE=100
KAFKA_BROKER=localhost:9092
KAFKA_TOPIC=bulk-action
PORT=3000
REDIS_URI=localhost:6379
RATE_LIMIT_MAX=5
RATE_LIMIT_WINDOW_MS=60000
```

### Launch Development Server
```
npm run dev
```

