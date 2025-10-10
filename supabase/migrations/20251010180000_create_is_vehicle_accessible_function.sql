CREATE OR REPLACE FUNCTION public.is_vehicle_accessible(p_vehicle_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_role TEXT;
    v_user_id UUID;
    v_is_accessible BOOLEAN;
BEGIN
    -- Get the ID of the currently authenticated user
    v_user_id := auth.uid();

    -- Get the user's role directly from the public.profiles table
    SELECT role INTO v_user_role FROM public.profiles WHERE id = v_user_id;

    RAISE NOTICE '[is_vehicle_accessible] START: user_id=%, user_role=%, vehicle_id=%', v_user_id, v_user_role, p_vehicle_id;

    -- Default to not accessible
    v_is_accessible := FALSE;

    -- 1. Admins and specialists have universal access
    IF v_user_role IN ('admin', 'specialist') THEN
        v_is_accessible := TRUE;
        RAISE NOTICE '[is_vehicle_accessible] STEP 1: Access GRANTED based on role (admin/specialist).';
    ELSE
        RAISE NOTICE '[is_vehicle_accessible] STEP 1: Access DENIED based on role. Role is not admin or specialist.';
    END IF;

    -- 2. Check for client access if not already granted
    IF NOT v_is_accessible THEN
        RAISE NOTICE '[is_vehicle_accessible] STEP 2: Checking client access.';
        SELECT EXISTS (
            SELECT 1
            FROM public.vehicles v
            JOIN public.clients c ON v.client_id = c.id
            WHERE v.id = p_vehicle_id AND c.profile_id = v_user_id
        ) INTO v_is_accessible;
        IF v_is_accessible THEN
            RAISE NOTICE '[is_vehicle_accessible] STEP 2: Access GRANTED as client owner.';
        END IF;
    END IF;

    -- 3. Check for partner access if not already granted
    IF NOT v_is_accessible AND v_user_role = 'partner' THEN
        RAISE NOTICE '[is_vehicle_accessible] STEP 3: Checking partner access.';
        SELECT EXISTS (
            SELECT 1
            FROM public.quotes q
            WHERE q.vehicle_id = p_vehicle_id AND q.partner_id = v_user_id
        ) INTO v_is_accessible;
        IF v_is_accessible THEN
            RAISE NOTICE '[is_vehicle_accessible] STEP 3: Access GRANTED as partner on quote.';
        END IF;
    END IF;

    RAISE NOTICE '[is_vehicle_accessible] END: Final result for vehicle % is %', p_vehicle_id, v_is_accessible;
    RETURN v_is_accessible;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_vehicle_accessible(UUID) IS 'Checks if the current authenticated user has access to a given vehicle by looking up their role from the profiles table. Includes debugging notices.';