# API Documentation

This directory contains all documentation related to the ProLine Hub API, organized by type and purpose.

## Directory Structure

### [specs/](./specs/)
Contains API specifications and contracts.

- **[api-spec.md](./specs/api-spec.md)** - Main API specification for partner checklists/vision
- **[openapi/](./specs/openapi/)** - OpenAPI specifications for different services

### [guides/](./guides/)
Implementation guides and versioning strategies.

- **[api-versioning-strategy.md](./guides/api-versioning-strategy.md)** - Strategy for API version management
- **[partner-service-v2/](./guides/partner-service-v2/)** - Documentation for Partner Service v2
  - **[partner-service-v2.md](./guides/partner-service-v2/partner-service-v2.md)** - Main documentation for Partner Service v2

### [reference/](./reference/)
Reference materials and standardized documentation.

## Overview

The ProLine Hub API provides RESTful endpoints for managing partner services, checklists, vehicle collections, quotes, and more. The API follows modern best practices including:

- JWT-based authentication
- Standardized error handling
- Consistent response formats
- Proper versioning strategies
- Comprehensive validation

## Versioning

Currently, the API has two major versions:

1. **v1** - Legacy version (deprecated)
2. **v2** - Current version with improved architecture

For detailed information about versioning strategy and migration paths, see [api-versioning-strategy.md](./guides/api-versioning-strategy.md).

## Authentication

All endpoints require authentication via JWT tokens:

```
Authorization: Bearer <your-jwt-token>
```

Different user roles have different access levels:
- `partner` - Partner users
- `admin` - Administrative users
- `customer` - Client users
- `specialist` - Specialist users

## Key API Areas

1. **Partner Services** - Management of services offered by partners
2. **Checklists** - Vehicle inspection checklists for partners
3. **Collections** - Vehicle pickup and delivery management
4. **Quotes** - Service quotation and approval workflows
5. **Vehicles** - Vehicle information and status management

For implementation details of specific services, refer to the appropriate documentation in the [guides/](./guides/) directory.