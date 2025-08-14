comandos uteis psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\dt"  
 List of relations Schema | Name | Type | Owner  
--------+--------------------+-------+---------- public | addresses | table | postgres public |
admins | table | postgres public | audit_logs | table | postgres public | clients | table | postgres
public | evaluations | table | postgres public | invoices | table | postgres public | partner_fees |
table | postgres public | partners | table | postgres public | parts | table | postgres public |
profiles | table | postgres public | quotes | table | postgres public | service_order_logs | table |
postgres public | service_orders | table | postgres public | services | table | postgres public |
specialists | table | postgres public | vehicles | table | postgres (16 rows)

psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\d clients"

##BKP DO BANCO PGPASSWORD=postgres pg*dump -U postgres -h 127.0.0.1 -p 54322 -d postgres -f
backup*$(date +%Y%m%d\_%H%M%S).sql --no-owner --no-privileges
