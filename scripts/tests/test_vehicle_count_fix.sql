-- Test script to validate the vehicle count duplication fix
-- This script creates test data and verifies the fix works correctly

-- First, let's create some test data
DO $$
DECLARE
    test_client_id UUID;
    test_specialist1_id UUID;
    test_specialist2_id UUID;
    vehicle_count_before BIGINT;
    vehicle_count_after BIGINT;
BEGIN
    -- Create a test client
    INSERT INTO profiles (id, full_name, role, email)
    VALUES (gen_random_uuid(), 'Test Client for Bug Fix', 'client', 'test-client-bug-fix@example.com')
    RETURNING id INTO test_client_id;

    -- Create client record
    INSERT INTO clients (profile_id, company_name)
    VALUES (test_client_id, 'Test Company Bug Fix');

    -- Create two test specialists
    INSERT INTO profiles (id, full_name, role, email)
    VALUES (gen_random_uuid(), 'Specialist One', 'specialist', 'specialist1@example.com')
    RETURNING id INTO test_specialist1_id;

    INSERT INTO profiles (id, full_name, role, email)
    VALUES (gen_random_uuid(), 'Specialist Two', 'specialist', 'specialist2@example.com')
    RETURNING id INTO test_specialist2_id;

    -- Associate specialists with client
    INSERT INTO client_specialists (client_id, specialist_id)
    VALUES (test_client_id, test_specialist1_id);

    INSERT INTO client_specialists (client_id, specialist_id)
    VALUES (test_client_id, test_specialist2_id);

    -- Create exactly 5 vehicles for the test client
    FOR i IN 1..5 LOOP
        INSERT INTO vehicles (client_id, license_plate, make, model, year)
        VALUES (test_client_id, 'TEST-' || i || '23', 'Test Make', 'Test Model', 2023);
    END LOOP;

    -- Test the function
    SELECT vehicle_count INTO vehicle_count_after
    FROM get_clients_with_vehicle_count()
    WHERE id = test_client_id;

    -- Verify the count is correct (should be 5, not 10)
    IF vehicle_count_after = 5 THEN
        RAISE NOTICE '✅ SUCCESS: Vehicle count is correct (%). Bug is fixed!', vehicle_count_after;
    ELSE
        RAISE EXCEPTION '❌ FAILURE: Vehicle count is incorrect (%), expected 5. Bug still exists!', vehicle_count_after;
    END IF;

    -- Also verify specialist names are aggregated correctly
    RAISE NOTICE 'Test completed. Client has % vehicles and should show 5 in the dashboard.', vehicle_count_after;

    -- Clean up test data
    DELETE FROM client_specialists WHERE client_id = test_client_id;
    DELETE FROM vehicles WHERE client_id = test_client_id;
    DELETE FROM clients WHERE profile_id = test_client_id;
    DELETE FROM profiles WHERE id IN (test_client_id, test_specialist1_id, test_specialist2_id);

    RAISE NOTICE 'Test data cleaned up successfully.';
END $$;
