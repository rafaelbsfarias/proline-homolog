# API Error Codes Reference

This document provides a standardized reference for all error codes used in the ProLine Hub API.

## Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "details": {} // Optional additional details
  }
}
```

## Standard Error Codes

### Authentication Errors

| Code | HTTP Status | Description | Common Causes |
|------|-------------|-------------|---------------|
| `UNAUTHORIZED_ERROR` | 401 | Missing or invalid authentication token | Empty Authorization header, expired JWT, malformed token |
| `FORBIDDEN_ERROR` | 403 | Access denied to requested resource | Insufficient permissions, role mismatch |

### Validation Errors

| Code | HTTP Status | Description | Common Causes |
|------|-------------|-------------|---------------|
| `VALIDATION_ERROR` | 400 | Invalid input data | Missing required fields, incorrect data types, out-of-range values |
| `INVALID_PARAMETERS` | 400 | Invalid query or path parameters | Malformed UUIDs, invalid enum values |

### Resource Errors

| Code | HTTP Status | Description | Common Causes |
|------|-------------|-------------|---------------|
| `NOT_FOUND_ERROR` | 404 | Requested resource not found | Non-existent ID, deleted resource |
| `CONFLICT_ERROR` | 409 | Resource conflict | Duplicate entries, concurrent modifications |

### Rate Limiting

| Code | HTTP Status | Description | Common Causes |
|------|-------------|-------------|---------------|
| `RATE_LIMITED` | 429 | Too many requests | Exceeded rate limits, burst traffic |

### Server Errors

| Code | HTTP Status | Description | Common Causes |
|------|-------------|-------------|---------------|
| `INTERNAL_ERROR` | 500 | Unexpected server error | Unhandled exceptions, database issues |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable | Maintenance, overloaded servers |

## Service-Specific Error Codes

### Partner Services

| Code | HTTP Status | Description | Context |
|------|-------------|-------------|---------|
| `PARTNER_SERVICE_NOT_FOUND` | 404 | Partner service not found | Attempt to access non-existent service |
| `PARTNER_SERVICE_CONFLICT` | 409 | Partner service conflict | Attempt to create duplicate service |

### Checklists

| Code | HTTP Status | Description | Context |
|------|-------------|-------------|---------|
| `CHECKLIST_NOT_FOUND` | 404 | Checklist not found | Attempt to access non-existent checklist |
| `CHECKLIST_ALREADY_SUBMITTED` | 409 | Checklist already submitted | Attempt to modify submitted checklist |

### Collections

| Code | HTTP Status | Description | Context |
|------|-------------|-------------|---------|
| `COLLECTION_NOT_FOUND` | 404 | Collection not found | Attempt to access non-existent collection |
| `COLLECTION_DATE_CONFLICT` | 409 | Collection date conflict | Attempt to set conflicting dates |

### Quotes

| Code | HTTP Status | Description | Context |
|------|-------------|-------------|---------|
| `QUOTE_NOT_FOUND` | 404 | Quote not found | Attempt to access non-existent quote |
| `QUOTE_STATUS_CONFLICT` | 409 | Quote status conflict | Attempt to change quote to invalid status |

## Implementation Guidelines

### For API Developers

1. **Always use standardized error codes** from this reference
2. **Provide meaningful error messages** that help clients understand and fix issues
3. **Include relevant details** when possible to aid debugging
4. **Log error details** for monitoring and troubleshooting

### For API Consumers

1. **Handle all documented error codes** in your client implementations
2. **Use error codes for programmatic decisions**, not error messages
3. **Display user-friendly messages** based on error codes and details
4. **Implement retry logic** with exponential backoff for rate-limited requests

## Adding New Error Codes

When introducing new error codes:

1. **Document them** in this reference
2. **Ensure uniqueness** of error codes
3. **Follow naming conventions** (UPPER_SNAKE_CASE)
4. **Include appropriate HTTP status codes**
5. **Provide clear descriptions** and example scenarios

## Versioning

This error code reference is versioned alongside the API. Breaking changes to error codes will be introduced in major API versions with proper deprecation notices.