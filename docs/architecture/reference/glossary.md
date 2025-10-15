# Architectural Terminology Glossary

This document provides definitions for key architectural terms used throughout the ProLine Hub system.

## General Terms

### Client
An end user who owns vehicles and uses the ProLine Hub platform to manage vehicle services, collections, and inspections.

### Partner
A service provider (mechanic, body shop, painter, electrician, etc.) who performs vehicle services for clients through the ProLine Hub platform.

### Vehicle
A client-owned automobile registered in the system, identified by plate number, make, model, and year.

### Service Order
A formal request for vehicle services, linking a vehicle to specific inspection and collection requirements.

### Quote
A service proposal created by a partner for a specific vehicle and service order, including pricing and service details.

### Inspection
A detailed examination of a vehicle's condition conducted by a specialist, resulting in findings and service recommendations.

## Technical Terms

### Context
A normalized reference structure `(context_type, context_id)` used to link checklists and other artifacts to either a quote or inspection. Context types include:
- `quote` - Links to a quote identifier
- `inspection` - Links to an inspection identifier

### Category
A classification of partner services, such as `mechanic`, `body`, `paint`, `electrical`, etc. Each category may have specific checklist templates and workflows.

### Checklist
A structured assessment tool used by partners to evaluate vehicle conditions, consisting of items with OK/NOK/NA statuses, comments, and supporting evidence.

### Item Key
A stable, semantic identifier for checklist items (e.g., `engine.oil.level`, `brakes.front.discs`), used to maintain consistency across template versions.

### Evidence
Supporting media (images, videos) attached to checklist items to document findings and conditions.

### Template
A versioned definition of checklist items for a specific category, ensuring consistency of item keys and presentation.

### Anomaly
A derived finding from checklist items marked as NOK, aggregated for analysis and reporting purposes.

### Part Request
A procurement request for vehicle parts linked to specific checklist items, initiated by partners and managed through the system.

### Service Category
A classification system that groups related services and determines which partners can provide specific types of work.

## Domain-Specific Terms

### Collection
The process of picking up a vehicle from a client location or designated collection point for service delivery.

### Timeline Event
A chronological record of significant activities and status changes in a vehicle's journey through the ProLine Hub system.

### Status Transition
A change in the state of a vehicle, service order, quote, or other entity, triggered by specific business events or user actions.

### Role-Based Access Control (RBAC)
A security model that restricts system access based on user roles (client, partner, admin, specialist).

### Multi-Tenant Architecture
A software architecture pattern where a single instance of the application serves multiple clients (tenants) with isolated data and configurations.

## Integration Terms

### API Endpoint
A specific URL and HTTP method combination that exposes a particular function or data resource through the ProLine Hub API.

### Webhook
An HTTP callback mechanism that enables real-time notifications between the ProLine Hub system and external services.

### Authentication Token
A secure credential (JWT) used to authenticate and authorize API requests, containing user identity and role information.

### Rate Limiting
A technique used to control the frequency of API requests to prevent abuse and ensure fair resource allocation.

### Idempotency
The property of an operation that ensures identical requests produce the same result regardless of how many times they are executed.

## Data Management Terms

### Entity Relationship Diagram (ERD)
A visual representation of database tables and their relationships, showing primary keys, foreign keys, and cardinality.

### Migration Script
A database script that applies structural or data changes to evolve the system schema over time.

### Data Integrity
The accuracy, consistency, and reliability of data throughout its lifecycle in the ProLine Hub system.

### Audit Trail
A chronological record of system activities that provides documentary evidence of operations for accountability and security purposes.

### Soft Delete
A data deletion strategy that marks records as inactive rather than physically removing them from the database.

## Performance Terms

### Caching
A technique for storing frequently accessed data in temporary storage locations to reduce database queries and improve response times.

### Indexing
Database optimization techniques that improve the speed of data retrieval operations on specific table columns.

### Pagination
A technique for dividing large result sets into smaller, manageable chunks to improve performance and user experience.

### Concurrency Control
Methods used to manage simultaneous operations on shared resources to prevent conflicts and ensure data consistency.

### Load Balancing
The distribution of workloads across multiple computing resources to optimize resource use and maximize throughput.