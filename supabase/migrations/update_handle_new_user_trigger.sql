
-- Update the handle_new_user function to use metadata from signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, name, pin, role, branch_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'pin', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'barber'),
    '1'
  );
  RETURN NEW;
END;
$function$;
