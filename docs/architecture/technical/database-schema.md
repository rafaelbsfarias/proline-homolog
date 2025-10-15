# Database Schema Documentation

This document provides detailed documentation of the ProLine Hub database schema, including table structures, relationships, constraints, and indexing strategies.

## Schema Overview

The ProLine Hub database follows a normalized schema design with strategic denormalization for performance-critical queries. The schema supports multi-tenancy through schema isolation and enforces data integrity through foreign key constraints and check constraints.

## Core Tables

### Users and Profiles

#### profiles
Stores user profile information for all system users.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('client', 'partner', 'specialist', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### clients
Extended profile information for client users.

```sql
CREATE TABLE clients (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  cpf TEXT,
  birth_date DATE,
  emergency_contact TEXT,
  preferred_communication TEXT CHECK (preferred_communication IN ('email', 'sms', 'whatsapp'))
);
```

#### partners
Extended profile information for partner users.

```sql
CREATE TABLE partners (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  corporate_email TEXT,
  website TEXT,
  description TEXT,
  specialties TEXT[], -- Array of service categories
  rating NUMERIC(3,2) CHECK (rating >= 0 AND rating <= 5),
  is_verified BOOLEAN DEFAULT FALSE
);
```

#### specialists
Extended profile information for specialist users.

```sql
CREATE TABLE specialists (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  professional_registration TEXT,
  specialty_area TEXT,
  certifications TEXT[],
  experience_years INTEGER CHECK (experience_years >= 0)
);
```

### Vehicles and Addresses

#### addresses
Physical addresses for clients and service locations.

```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  street TEXT NOT NULL,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  address_type TEXT NOT NULL CHECK (address_type IN ('home', 'work', 'collect_point')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### vehicles
Registered vehicles in the system.

```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(profile_id) ON DELETE CASCADE,
  plate TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW()) + 1),
  color TEXT,
  chassis_number TEXT UNIQUE,
  renavam TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN (
    'registered', 'awaiting_collection', 'in_transit', 'in_analysis', 
    'analysis_completed', 'budget_approved', 'execution_started', 'completed'
  )),
  current_location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Service Management

#### service_orders
Main container for vehicle service workflows.

```sql
CREATE TABLE service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(profile_id) ON DELETE CASCADE,
  assigned_specialist_id UUID REFERENCES specialists(profile_id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'cancelled', 'on_hold'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  scheduled_date DATE,
  actual_completion_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### quotes
Service quotes provided by partners.

```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(profile_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending_admin_approval' CHECK (status IN (
    'pending_admin_approval', 'pending_client_approval', 'pending_partial_approval',
    'approved', 'rejected', 'expired', 'cancelled'
  )),
  total_value NUMERIC(10,2) NOT NULL CHECK (total_value >= 0),
  validity_days INTEGER DEFAULT 30 CHECK (validity_days > 0),
  notes TEXT,
  sent_to_admin_at TIMESTAMPTZ,
  approved_by_admin_at TIMESTAMPTZ,
  sent_to_client_at TIMESTAMPTZ,
  approved_by_client_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### services
Individual services within quotes.

```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  service_category TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_days INTEGER CHECK (estimated_days > 0),
  value NUMERIC(10,2) NOT NULL CHECK (value >= 0),
  parts_needed JSONB, -- Array of part requirements
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### quote_items
Detailed breakdown of quote services.

```sql
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  quantity NUMERIC(8,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10,2) NOT NULL GENERATED ALWAYS AS (quantity * unit_price) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Collections and Timeline

#### vehicle_collections
Scheduled vehicle collection information.

```sql
CREATE TABLE vehicle_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  collection_address_id UUID NOT NULL REFERENCES addresses(id),
  collection_date DATE NOT NULL,
  collection_time TIME,
  collection_fee NUMERIC(8,2) CHECK (collection_fee >= 0),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'missed'
  )),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### timeline_events
Chronological events in vehicle lifecycle.

```sql
CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Partner Checklists

#### partner_checklists
Main checklist containers for partners.

```sql
CREATE TABLE partner_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(profile_id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL CHECK (context_type IN ('quote', 'inspection')),
  context_id UUID NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  template_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  UNIQUE (partner_id, vehicle_id, context_type, context_id, category)
);
```

#### partner_checklist_items
Individual checklist items.

```sql
CREATE TABLE partner_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES partner_checklists(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('OK', 'NOK', 'NA')),
  comment TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (checklist_id, item_key)
);
```

#### partner_checklist_evidences
Evidence media for checklist items.

```sql
CREATE TABLE partner_checklist_evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES partner_checklists(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'other')),
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### partner_part_requests
Part requests associated with checklist items.

```sql
CREATE TABLE partner_part_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES partner_checklists(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'approved', 'rejected', 'cancelled', 'ordered', 'received'
  )),
  title TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC(8,2) DEFAULT 1 CHECK (quantity > 0),
  unit TEXT,
  estimated_cost NUMERIC(10,2) CHECK (estimated_cost >= 0),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);
```

## Relationships and Constraints

### Primary Keys
All tables use UUID primary keys generated by `gen_random_uuid()` for security and scalability.

### Foreign Keys
Foreign key constraints ensure referential integrity and enable cascading deletes where appropriate.

### Unique Constraints
Unique constraints prevent duplicate data and enforce business rules:
- `profiles.user_id` - Each auth user maps to one profile
- `(partner_id, vehicle_id, context_type, context_id, category)` - Unique checklist per partner/vehicle/context/category combination

### Check Constraints
Check constraints validate data integrity:
- Status enumerations
- Date ranges
- Numeric value ranges
- Text format validations

## Indexing Strategy

### Primary Indexes
Primary keys automatically create B-tree indexes for optimal lookup performance.

### Foreign Key Indexes
All foreign key columns have corresponding indexes to optimize JOIN operations.

### Composite Indexes
Strategic composite indexes for common query patterns:
```sql
-- Lookup checklists by partner and vehicle
CREATE INDEX idx_partner_checklists_lookup 
  ON partner_checklists (partner_id, vehicle_id, context_type, context_id, category);

-- Find checklist items by checklist
CREATE INDEX idx_items_checklist ON partner_checklist_items (checklist_id);

-- Search timeline events by vehicle
CREATE INDEX idx_timeline_vehicle ON timeline_events (vehicle_id, event_date);

-- Filter quotes by status
CREATE INDEX idx_quotes_status ON quotes (status);
```

### Partial Indexes
Partial indexes for frequently filtered subsets:
```sql
-- Active quotes only
CREATE INDEX idx_quotes_active 
  ON quotes (partner_id, created_at DESC) 
  WHERE status IN ('approved', 'pending_admin_approval');

-- Recent timeline events
CREATE INDEX idx_timeline_recent 
  ON timeline_events (vehicle_id, event_date DESC) 
  WHERE event_date >= NOW() - INTERVAL '30 days';
```

## Views and Materialized Views

### Summary Views
Common query patterns abstracted into views:
```sql
-- Vehicle checklist summary
CREATE VIEW vw_vehicle_checklist_summary AS
SELECT 
  c.id as checklist_id,
  c.partner_id,
  c.vehicle_id,
  c.category,
  COUNT(i.id) as total_items,
  SUM(CASE WHEN i.status = 'OK' THEN 1 ELSE 0 END) as items_ok,
  SUM(CASE WHEN i.status = 'NOK' THEN 1 ELSE 0 END) as items_nok,
  COUNT(e.id) as evidence_count,
  MAX(c.updated_at) as last_updated
FROM partner_checklists c
LEFT JOIN partner_checklist_items i ON i.checklist_id = c.id
LEFT JOIN partner_checklist_evidences e ON e.checklist_id = c.id
GROUP BY c.id, c.partner_id, c.vehicle_id, c.category;
```

### Materialized Views
Performance-critical aggregations refreshed periodically:
```sql
-- Partner performance statistics
CREATE MATERIALIZED VIEW mv_partner_performance AS
SELECT 
  p.profile_id as partner_id,
  p.company_name,
  COUNT(DISTINCT q.id) as total_quotes,
  AVG(q.total_value) as avg_quote_value,
  COUNT(CASE WHEN q.status = 'approved' THEN 1 END) as approved_quotes,
  ROUND(
    COUNT(CASE WHEN q.status = 'approved' THEN 1 END) * 100.0 / 
    NULLIF(COUNT(*), 0), 2
  ) as approval_rate
FROM partners p
LEFT JOIN quotes q ON q.partner_id = p.profile_id
GROUP BY p.profile_id, p.company_name;

-- Refresh every hour
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_partner_performance;
```

## Security and Access Control

### Row Level Security (RLS)
RLS policies ensure users can only access their own data:
```sql
-- Enable RLS on partner_checklists
ALTER TABLE partner_checklists ENABLE ROW LEVEL SECURITY;

-- Partners can only see their own checklists
CREATE POLICY partner_checklist_select_policy 
ON partner_checklists FOR SELECT 
USING (partner_id = auth.uid());

CREATE POLICY partner_checklist_insert_policy 
ON partner_checklists FOR INSERT 
WITH CHECK (partner_id = auth.uid());
```

### Data Encryption
Sensitive data is encrypted at rest:
- Password hashes using bcrypt
- Personal identification numbers encrypted
- Financial data encrypted in application layer

## Performance Considerations

### Connection Pooling
Database connections are pooled to handle concurrent requests efficiently.

### Query Optimization
Queries are analyzed and optimized using:
- `EXPLAIN ANALYZE` for execution plan analysis
- Index usage monitoring
- Query result caching for repeated operations

### Data Archiving
Old data is archived to separate tables to maintain performance:
```sql
-- Archive completed service orders older than 2 years
CREATE TABLE service_orders_archive (LIKE service_orders INCLUDING ALL);

-- Monthly archiving job moves old records
INSERT INTO service_orders_archive 
SELECT * FROM service_orders 
WHERE status = 'completed' 
AND updated_at < NOW() - INTERVAL '2 years';

DELETE FROM service_orders 
WHERE status = 'completed' 
AND updated_at < NOW() - INTERVAL '2 years';
```

## Backup and Recovery

### Automated Backups
Daily backups with point-in-time recovery:
- Full database dumps nightly
- WAL (Write-Ahead Log) archiving continuously
- Backup retention for 30 days

### Disaster Recovery
Cross-region backup strategy:
- Primary region with live database
- Secondary region with standby database
- Automated failover procedures

## Monitoring and Maintenance

### Health Checks
Regular monitoring of:
- Database connection health
- Query performance metrics
- Index fragmentation levels
- Storage utilization

### Maintenance Windows
Scheduled maintenance for:
- Index rebuilding and vacuuming
- Statistics updates
- Log rotation and cleanup
- Backup verification

## Schema Evolution

### Migration Strategy
Schema changes are managed through:
- Version-controlled migration scripts
- Automated testing of migrations
- Rollback procedures for failed migrations
- Staged deployment across environments

### Deprecation Policy
Deprecated tables and columns:
- Marked with `_deprecated` suffix
- Maintained for 6 months after deprecation
- Gradually removed after migration period

## Best Practices Enforcement

### Naming Conventions
- All table and column names in snake_case
- Primary keys named `id`
- Foreign keys named `{referenced_table}_id`
- Timestamp columns named `created_at` and `updated_at`

### Data Types
Consistent use of appropriate data types:
- UUID for identifiers
- TIMESTAMPTZ for all timestamps
- NUMERIC for monetary values
- TEXT for variable-length strings
- JSONB for structured data

### Constraints
Explicit constraints for data integrity:
- NOT NULL for required fields
- CHECK constraints for value validation
- FOREIGN KEY constraints for referential integrity
- UNIQUE constraints for business rules

## Conclusion

The ProLine Hub database schema is designed for scalability, security, and maintainability. The normalized structure with strategic denormalization ensures data integrity while providing the flexibility needed for the complex business workflows. Regular monitoring and maintenance procedures ensure optimal performance and reliability for all system operations.