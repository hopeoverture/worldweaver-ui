drop extension if exists "pg_net";

drop trigger if exists "update_rate_limit_configs_updated_at" on "public"."rate_limit_configs";

drop trigger if exists "update_rate_limits_updated_at" on "public"."rate_limits";

drop policy "activity_insert" on "public"."activity_logs";

drop policy "activity_select" on "public"."activity_logs";

drop policy "Users can delete entities in editable worlds" on "public"."entities";

drop policy "Users can update entities in editable worlds" on "public"."entities";

drop policy "Users can view folders in accessible worlds" on "public"."folders";

drop policy "Users can update their own profile" on "public"."profiles";

drop policy "Users can view their own profile" on "public"."profiles";

drop policy "rate_limit_configs_system_only" on "public"."rate_limit_configs";

drop policy "rate_limits_system_only" on "public"."rate_limits";

drop policy "Users can create relationships in editable worlds" on "public"."relationships";

drop policy "Users can delete relationships in editable worlds" on "public"."relationships";

drop policy "Users can update relationships in editable worlds" on "public"."relationships";

drop policy "Users can delete templates in editable worlds" on "public"."templates";

drop policy "Users can update templates in editable worlds" on "public"."templates";

drop policy "Users can view accessible templates" on "public"."templates";

drop policy "Users can view bans for worlds they own" on "public"."world_bans";

drop policy "ban_delete_manage" on "public"."world_bans";

drop policy "ban_insert_manage" on "public"."world_bans";

drop policy "ban_update_manage" on "public"."world_bans";

drop policy "files_delete" on "public"."world_files";

drop policy "files_insert" on "public"."world_files";

drop policy "files_select" on "public"."world_files";

drop policy "invites_delete" on "public"."world_invites";

drop policy "invites_insert" on "public"."world_invites";

drop policy "invites_select" on "public"."world_invites";

drop policy "invites_update_accept" on "public"."world_invites";

drop policy "invites_update_manage" on "public"."world_invites";

drop policy "world_select_member" on "public"."worlds";

drop policy "Users can create entities in editable worlds" on "public"."entities";

drop policy "Users can view entities in accessible worlds" on "public"."entities";

drop policy "world_delete_owner" on "public"."worlds";

drop policy "world_insert" on "public"."worlds";

drop policy "world_update_owner" on "public"."worlds";

revoke delete on table "public"."activity_logs" from "anon";

revoke insert on table "public"."activity_logs" from "anon";

revoke references on table "public"."activity_logs" from "anon";

revoke select on table "public"."activity_logs" from "anon";

revoke trigger on table "public"."activity_logs" from "anon";

revoke truncate on table "public"."activity_logs" from "anon";

revoke update on table "public"."activity_logs" from "anon";

revoke delete on table "public"."activity_logs" from "authenticated";

revoke insert on table "public"."activity_logs" from "authenticated";

revoke references on table "public"."activity_logs" from "authenticated";

revoke select on table "public"."activity_logs" from "authenticated";

revoke trigger on table "public"."activity_logs" from "authenticated";

revoke truncate on table "public"."activity_logs" from "authenticated";

revoke update on table "public"."activity_logs" from "authenticated";

revoke delete on table "public"."activity_logs" from "service_role";

revoke insert on table "public"."activity_logs" from "service_role";

revoke references on table "public"."activity_logs" from "service_role";

revoke select on table "public"."activity_logs" from "service_role";

revoke trigger on table "public"."activity_logs" from "service_role";

revoke truncate on table "public"."activity_logs" from "service_role";

revoke update on table "public"."activity_logs" from "service_role";

revoke delete on table "public"."entities" from "anon";

revoke insert on table "public"."entities" from "anon";

revoke references on table "public"."entities" from "anon";

revoke select on table "public"."entities" from "anon";

revoke trigger on table "public"."entities" from "anon";

revoke truncate on table "public"."entities" from "anon";

revoke update on table "public"."entities" from "anon";

revoke delete on table "public"."entities" from "authenticated";

revoke insert on table "public"."entities" from "authenticated";

revoke references on table "public"."entities" from "authenticated";

revoke select on table "public"."entities" from "authenticated";

revoke trigger on table "public"."entities" from "authenticated";

revoke truncate on table "public"."entities" from "authenticated";

revoke update on table "public"."entities" from "authenticated";

revoke delete on table "public"."entities" from "service_role";

revoke insert on table "public"."entities" from "service_role";

revoke references on table "public"."entities" from "service_role";

revoke select on table "public"."entities" from "service_role";

revoke trigger on table "public"."entities" from "service_role";

revoke truncate on table "public"."entities" from "service_role";

revoke update on table "public"."entities" from "service_role";

revoke delete on table "public"."folders" from "anon";

revoke insert on table "public"."folders" from "anon";

revoke references on table "public"."folders" from "anon";

revoke select on table "public"."folders" from "anon";

revoke trigger on table "public"."folders" from "anon";

revoke truncate on table "public"."folders" from "anon";

revoke update on table "public"."folders" from "anon";

revoke delete on table "public"."folders" from "authenticated";

revoke insert on table "public"."folders" from "authenticated";

revoke references on table "public"."folders" from "authenticated";

revoke select on table "public"."folders" from "authenticated";

revoke trigger on table "public"."folders" from "authenticated";

revoke truncate on table "public"."folders" from "authenticated";

revoke update on table "public"."folders" from "authenticated";

revoke delete on table "public"."folders" from "service_role";

revoke insert on table "public"."folders" from "service_role";

revoke references on table "public"."folders" from "service_role";

revoke select on table "public"."folders" from "service_role";

revoke trigger on table "public"."folders" from "service_role";

revoke truncate on table "public"."folders" from "service_role";

revoke update on table "public"."folders" from "service_role";

revoke delete on table "public"."profiles" from "anon";

revoke insert on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "anon";

revoke delete on table "public"."profiles" from "authenticated";

revoke insert on table "public"."profiles" from "authenticated";

revoke references on table "public"."profiles" from "authenticated";

revoke select on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."profiles" from "authenticated";

revoke update on table "public"."profiles" from "authenticated";

revoke delete on table "public"."profiles" from "service_role";

revoke insert on table "public"."profiles" from "service_role";

revoke references on table "public"."profiles" from "service_role";

revoke select on table "public"."profiles" from "service_role";

revoke trigger on table "public"."profiles" from "service_role";

revoke truncate on table "public"."profiles" from "service_role";

revoke update on table "public"."profiles" from "service_role";

revoke delete on table "public"."rate_limit_configs" from "anon";

revoke insert on table "public"."rate_limit_configs" from "anon";

revoke references on table "public"."rate_limit_configs" from "anon";

revoke select on table "public"."rate_limit_configs" from "anon";

revoke trigger on table "public"."rate_limit_configs" from "anon";

revoke truncate on table "public"."rate_limit_configs" from "anon";

revoke update on table "public"."rate_limit_configs" from "anon";

revoke delete on table "public"."rate_limit_configs" from "authenticated";

revoke insert on table "public"."rate_limit_configs" from "authenticated";

revoke references on table "public"."rate_limit_configs" from "authenticated";

revoke select on table "public"."rate_limit_configs" from "authenticated";

revoke trigger on table "public"."rate_limit_configs" from "authenticated";

revoke truncate on table "public"."rate_limit_configs" from "authenticated";

revoke update on table "public"."rate_limit_configs" from "authenticated";

revoke delete on table "public"."rate_limit_configs" from "service_role";

revoke insert on table "public"."rate_limit_configs" from "service_role";

revoke references on table "public"."rate_limit_configs" from "service_role";

revoke select on table "public"."rate_limit_configs" from "service_role";

revoke trigger on table "public"."rate_limit_configs" from "service_role";

revoke truncate on table "public"."rate_limit_configs" from "service_role";

revoke update on table "public"."rate_limit_configs" from "service_role";

revoke delete on table "public"."rate_limits" from "anon";

revoke insert on table "public"."rate_limits" from "anon";

revoke references on table "public"."rate_limits" from "anon";

revoke select on table "public"."rate_limits" from "anon";

revoke trigger on table "public"."rate_limits" from "anon";

revoke truncate on table "public"."rate_limits" from "anon";

revoke update on table "public"."rate_limits" from "anon";

revoke delete on table "public"."rate_limits" from "authenticated";

revoke insert on table "public"."rate_limits" from "authenticated";

revoke references on table "public"."rate_limits" from "authenticated";

revoke select on table "public"."rate_limits" from "authenticated";

revoke trigger on table "public"."rate_limits" from "authenticated";

revoke truncate on table "public"."rate_limits" from "authenticated";

revoke update on table "public"."rate_limits" from "authenticated";

revoke delete on table "public"."rate_limits" from "service_role";

revoke insert on table "public"."rate_limits" from "service_role";

revoke references on table "public"."rate_limits" from "service_role";

revoke select on table "public"."rate_limits" from "service_role";

revoke trigger on table "public"."rate_limits" from "service_role";

revoke truncate on table "public"."rate_limits" from "service_role";

revoke update on table "public"."rate_limits" from "service_role";

revoke delete on table "public"."relationships" from "anon";

revoke insert on table "public"."relationships" from "anon";

revoke references on table "public"."relationships" from "anon";

revoke select on table "public"."relationships" from "anon";

revoke trigger on table "public"."relationships" from "anon";

revoke truncate on table "public"."relationships" from "anon";

revoke update on table "public"."relationships" from "anon";

revoke delete on table "public"."relationships" from "authenticated";

revoke insert on table "public"."relationships" from "authenticated";

revoke references on table "public"."relationships" from "authenticated";

revoke select on table "public"."relationships" from "authenticated";

revoke trigger on table "public"."relationships" from "authenticated";

revoke truncate on table "public"."relationships" from "authenticated";

revoke update on table "public"."relationships" from "authenticated";

revoke delete on table "public"."relationships" from "service_role";

revoke insert on table "public"."relationships" from "service_role";

revoke references on table "public"."relationships" from "service_role";

revoke select on table "public"."relationships" from "service_role";

revoke trigger on table "public"."relationships" from "service_role";

revoke truncate on table "public"."relationships" from "service_role";

revoke update on table "public"."relationships" from "service_role";

revoke delete on table "public"."templates" from "anon";

revoke insert on table "public"."templates" from "anon";

revoke references on table "public"."templates" from "anon";

revoke select on table "public"."templates" from "anon";

revoke trigger on table "public"."templates" from "anon";

revoke truncate on table "public"."templates" from "anon";

revoke update on table "public"."templates" from "anon";

revoke delete on table "public"."templates" from "authenticated";

revoke insert on table "public"."templates" from "authenticated";

revoke references on table "public"."templates" from "authenticated";

revoke select on table "public"."templates" from "authenticated";

revoke trigger on table "public"."templates" from "authenticated";

revoke truncate on table "public"."templates" from "authenticated";

revoke update on table "public"."templates" from "authenticated";

revoke delete on table "public"."templates" from "service_role";

revoke insert on table "public"."templates" from "service_role";

revoke references on table "public"."templates" from "service_role";

revoke select on table "public"."templates" from "service_role";

revoke trigger on table "public"."templates" from "service_role";

revoke truncate on table "public"."templates" from "service_role";

revoke update on table "public"."templates" from "service_role";

revoke delete on table "public"."world_bans" from "anon";

revoke insert on table "public"."world_bans" from "anon";

revoke references on table "public"."world_bans" from "anon";

revoke select on table "public"."world_bans" from "anon";

revoke trigger on table "public"."world_bans" from "anon";

revoke truncate on table "public"."world_bans" from "anon";

revoke update on table "public"."world_bans" from "anon";

revoke delete on table "public"."world_bans" from "authenticated";

revoke insert on table "public"."world_bans" from "authenticated";

revoke references on table "public"."world_bans" from "authenticated";

revoke select on table "public"."world_bans" from "authenticated";

revoke trigger on table "public"."world_bans" from "authenticated";

revoke truncate on table "public"."world_bans" from "authenticated";

revoke update on table "public"."world_bans" from "authenticated";

revoke delete on table "public"."world_bans" from "service_role";

revoke insert on table "public"."world_bans" from "service_role";

revoke references on table "public"."world_bans" from "service_role";

revoke select on table "public"."world_bans" from "service_role";

revoke trigger on table "public"."world_bans" from "service_role";

revoke truncate on table "public"."world_bans" from "service_role";

revoke update on table "public"."world_bans" from "service_role";

revoke delete on table "public"."world_files" from "anon";

revoke insert on table "public"."world_files" from "anon";

revoke references on table "public"."world_files" from "anon";

revoke select on table "public"."world_files" from "anon";

revoke trigger on table "public"."world_files" from "anon";

revoke truncate on table "public"."world_files" from "anon";

revoke update on table "public"."world_files" from "anon";

revoke delete on table "public"."world_files" from "authenticated";

revoke insert on table "public"."world_files" from "authenticated";

revoke references on table "public"."world_files" from "authenticated";

revoke select on table "public"."world_files" from "authenticated";

revoke trigger on table "public"."world_files" from "authenticated";

revoke truncate on table "public"."world_files" from "authenticated";

revoke update on table "public"."world_files" from "authenticated";

revoke delete on table "public"."world_files" from "service_role";

revoke insert on table "public"."world_files" from "service_role";

revoke references on table "public"."world_files" from "service_role";

revoke select on table "public"."world_files" from "service_role";

revoke trigger on table "public"."world_files" from "service_role";

revoke truncate on table "public"."world_files" from "service_role";

revoke update on table "public"."world_files" from "service_role";

revoke delete on table "public"."world_invites" from "anon";

revoke insert on table "public"."world_invites" from "anon";

revoke references on table "public"."world_invites" from "anon";

revoke select on table "public"."world_invites" from "anon";

revoke trigger on table "public"."world_invites" from "anon";

revoke truncate on table "public"."world_invites" from "anon";

revoke update on table "public"."world_invites" from "anon";

revoke delete on table "public"."world_invites" from "authenticated";

revoke insert on table "public"."world_invites" from "authenticated";

revoke references on table "public"."world_invites" from "authenticated";

revoke select on table "public"."world_invites" from "authenticated";

revoke trigger on table "public"."world_invites" from "authenticated";

revoke truncate on table "public"."world_invites" from "authenticated";

revoke update on table "public"."world_invites" from "authenticated";

revoke delete on table "public"."world_invites" from "service_role";

revoke insert on table "public"."world_invites" from "service_role";

revoke references on table "public"."world_invites" from "service_role";

revoke select on table "public"."world_invites" from "service_role";

revoke trigger on table "public"."world_invites" from "service_role";

revoke truncate on table "public"."world_invites" from "service_role";

revoke update on table "public"."world_invites" from "service_role";

revoke delete on table "public"."world_members" from "anon";

revoke insert on table "public"."world_members" from "anon";

revoke references on table "public"."world_members" from "anon";

revoke select on table "public"."world_members" from "anon";

revoke trigger on table "public"."world_members" from "anon";

revoke truncate on table "public"."world_members" from "anon";

revoke update on table "public"."world_members" from "anon";

revoke delete on table "public"."world_members" from "authenticated";

revoke insert on table "public"."world_members" from "authenticated";

revoke references on table "public"."world_members" from "authenticated";

revoke select on table "public"."world_members" from "authenticated";

revoke trigger on table "public"."world_members" from "authenticated";

revoke truncate on table "public"."world_members" from "authenticated";

revoke update on table "public"."world_members" from "authenticated";

revoke delete on table "public"."world_members" from "service_role";

revoke insert on table "public"."world_members" from "service_role";

revoke references on table "public"."world_members" from "service_role";

revoke select on table "public"."world_members" from "service_role";

revoke trigger on table "public"."world_members" from "service_role";

revoke truncate on table "public"."world_members" from "service_role";

revoke update on table "public"."world_members" from "service_role";

revoke delete on table "public"."worlds" from "anon";

revoke insert on table "public"."worlds" from "anon";

revoke references on table "public"."worlds" from "anon";

revoke select on table "public"."worlds" from "anon";

revoke trigger on table "public"."worlds" from "anon";

revoke truncate on table "public"."worlds" from "anon";

revoke update on table "public"."worlds" from "anon";

revoke delete on table "public"."worlds" from "authenticated";

revoke insert on table "public"."worlds" from "authenticated";

revoke references on table "public"."worlds" from "authenticated";

revoke select on table "public"."worlds" from "authenticated";

revoke trigger on table "public"."worlds" from "authenticated";

revoke truncate on table "public"."worlds" from "authenticated";

revoke update on table "public"."worlds" from "authenticated";

revoke delete on table "public"."worlds" from "service_role";

revoke insert on table "public"."worlds" from "service_role";

revoke references on table "public"."worlds" from "service_role";

revoke select on table "public"."worlds" from "service_role";

revoke trigger on table "public"."worlds" from "service_role";

revoke truncate on table "public"."worlds" from "service_role";

revoke update on table "public"."worlds" from "service_role";

alter table "public"."activity_logs" drop constraint "activity_logs_user_id_fkey";

alter table "public"."activity_logs" drop constraint "activity_logs_world_id_fkey";

alter table "public"."rate_limit_configs" drop constraint "rate_limit_configs_bucket_key";

alter table "public"."world_files" drop constraint "world_files_uploaded_by_fkey";

alter table "public"."worlds" drop constraint "worlds_owner_id_fkey";

drop function if exists "public"."accept_world_invite"(invite_token text);

drop function if exists "public"."check_rate_limit"(p_key_hash text, p_bucket text, p_max_requests integer, p_window_seconds integer);

drop function if exists "public"."cleanup_expired_rate_limits"();

drop function if exists "public"."schedule_rate_limit_cleanup"();

alter table "public"."activity_logs" drop constraint "activity_logs_pkey";

alter table "public"."rate_limit_configs" drop constraint "rate_limit_configs_pkey";

alter table "public"."rate_limits" drop constraint "rate_limits_pkey";

drop index if exists "public"."activity_logs_pkey";

drop index if exists "public"."idx_activity_logs_created_at";

drop index if exists "public"."idx_activity_logs_user_id";

drop index if exists "public"."idx_activity_logs_world_id";

drop index if exists "public"."idx_entities_world_template_updated";

drop index if exists "public"."idx_entities_world_updated";

drop index if exists "public"."idx_entities_world_updated_at";

drop index if exists "public"."idx_rate_limit_configs_bucket_active";

drop index if exists "public"."idx_rate_limits_key_bucket_window";

drop index if exists "public"."idx_rate_limits_window_end";

drop index if exists "public"."idx_templates_system_name";

drop index if exists "public"."idx_templates_world_category_name";

drop index if exists "public"."idx_templates_world_name";

drop index if exists "public"."idx_world_files_world_id";

drop index if exists "public"."idx_world_invites_email";

drop index if exists "public"."idx_worlds_is_archived";

drop index if exists "public"."rate_limit_configs_bucket_key";

drop index if exists "public"."rate_limit_configs_pkey";

drop index if exists "public"."rate_limits_pkey";

drop index if exists "public"."ux_relationships_pair_type";

drop table "public"."activity_logs";

drop table "public"."rate_limit_configs";

drop table "public"."rate_limits";

alter table "public"."entities" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."folders" drop column "data";

alter table "public"."folders" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."profiles" drop column "data";

alter table "public"."relationships" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."templates" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."world_bans" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."world_files" drop column "file_name";

alter table "public"."world_files" add column "updated_at" timestamp with time zone not null default now();

alter table "public"."world_files" alter column "file_size" set data type bigint using "file_size"::bigint;

alter table "public"."world_files" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."world_invites" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."world_members" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."worlds" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."worlds" alter column "owner_id" set default auth.uid();

alter table "public"."worlds" alter column "user_id" set not null;

CREATE INDEX idx_entities_folder_id ON public.entities USING btree (folder_id);

CREATE INDEX idx_entities_template_id ON public.entities USING btree (template_id);

CREATE INDEX idx_folders_parent_folder_id ON public.folders USING btree (parent_folder_id);

CREATE INDEX idx_relationships_from_entity_id ON public.relationships USING btree (from_entity_id);

CREATE INDEX idx_relationships_to_entity_id ON public.relationships USING btree (to_entity_id);

CREATE INDEX idx_world_bans_banned_by_user_id ON public.world_bans USING btree (banned_by_user_id);

CREATE INDEX idx_world_bans_banned_user_id ON public.world_bans USING btree (banned_user_id);

CREATE INDEX idx_world_files_uploaded_by ON public.world_files USING btree (uploaded_by);

CREATE INDEX idx_world_invites_invited_by ON public.world_invites USING btree (invited_by);

CREATE INDEX idx_worlds_owner_id ON public.worlds USING btree (user_id);

CREATE UNIQUE INDEX world_files_world_id_file_path_key ON public.world_files USING btree (world_id, file_path);

alter table "public"."world_files" add constraint "world_files_world_id_file_path_key" UNIQUE using index "world_files_world_id_file_path_key";

alter table "public"."world_files" add constraint "world_files_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) not valid;

alter table "public"."world_files" validate constraint "world_files_uploaded_by_fkey";

alter table "public"."worlds" add constraint "worlds_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) not valid;

alter table "public"."worlds" validate constraint "worlds_owner_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_owner_as_member()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.world_members (world_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'admin');
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.user_has_world_access(world_uuid uuid, user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Check if user is owner
  IF EXISTS (
    SELECT 1 FROM public.worlds 
    WHERE id = world_uuid AND owner_id = user_uuid
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if world is public
  IF EXISTS (
    SELECT 1 FROM public.worlds 
    WHERE id = world_uuid AND is_public = TRUE
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a member
  IF EXISTS (
    SELECT 1 FROM public.world_members 
    WHERE world_id = world_uuid AND user_id = user_uuid
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$function$
;


  create policy "folder_select"
  on "public"."folders"
  as permissive
  for select
  to public
using (user_has_world_access(world_id, ( SELECT auth.uid() AS uid)));



  create policy "Users can insert own profile"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = id));



  create policy "Users can update own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = id));



  create policy "Users can view own profile"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((( SELECT auth.uid() AS uid) = id));



  create policy "relationship_select"
  on "public"."relationships"
  as permissive
  for select
  to public
using (user_has_world_access(world_id, ( SELECT auth.uid() AS uid)));



  create policy "template_select"
  on "public"."templates"
  as permissive
  for select
  to public
using (user_has_world_access(world_id, ( SELECT auth.uid() AS uid)));



  create policy "ban_manage"
  on "public"."world_bans"
  as permissive
  for all
  to public
using (((world_id IN ( SELECT worlds.id
   FROM worlds
  WHERE (worlds.user_id = ( SELECT auth.uid() AS uid)))) OR (world_id IN ( SELECT world_members.world_id
   FROM world_members
  WHERE ((world_members.user_id = ( SELECT auth.uid() AS uid)) AND (world_members.role = 'admin'::world_member_role))))));



  create policy "Users can delete files they uploaded or are admins"
  on "public"."world_files"
  as permissive
  for delete
  to authenticated
using (((uploaded_by = ( SELECT auth.uid() AS uid)) OR (world_id IN ( SELECT worlds.id
   FROM worlds
  WHERE (worlds.user_id = ( SELECT auth.uid() AS uid)))) OR (world_id IN ( SELECT world_members.world_id
   FROM world_members
  WHERE ((world_members.user_id = ( SELECT auth.uid() AS uid)) AND (world_members.role = 'admin'::world_member_role))))));



  create policy "Users can update files they uploaded"
  on "public"."world_files"
  as permissive
  for update
  to authenticated
using (((uploaded_by = ( SELECT auth.uid() AS uid)) OR (world_id IN ( SELECT worlds.id
   FROM worlds
  WHERE (worlds.user_id = ( SELECT auth.uid() AS uid)))) OR (world_id IN ( SELECT world_members.world_id
   FROM world_members
  WHERE ((world_members.user_id = ( SELECT auth.uid() AS uid)) AND (world_members.role = 'admin'::world_member_role))))))
with check (((uploaded_by = ( SELECT auth.uid() AS uid)) OR (world_id IN ( SELECT worlds.id
   FROM worlds
  WHERE (worlds.user_id = ( SELECT auth.uid() AS uid)))) OR (world_id IN ( SELECT world_members.world_id
   FROM world_members
  WHERE ((world_members.user_id = ( SELECT auth.uid() AS uid)) AND (world_members.role = 'admin'::world_member_role))))));



  create policy "Users can view files from their worlds"
  on "public"."world_files"
  as permissive
  for select
  to authenticated
using (((world_id IN ( SELECT worlds.id
   FROM worlds
  WHERE (worlds.user_id = ( SELECT auth.uid() AS uid)))) OR (world_id IN ( SELECT world_members.world_id
   FROM world_members
  WHERE (world_members.user_id = ( SELECT auth.uid() AS uid))))));



  create policy "World owners and editors can insert files"
  on "public"."world_files"
  as permissive
  for insert
  to authenticated
with check (((world_id IN ( SELECT worlds.id
   FROM worlds
  WHERE (worlds.user_id = ( SELECT auth.uid() AS uid)))) OR (world_id IN ( SELECT world_members.world_id
   FROM world_members
  WHERE ((world_members.user_id = ( SELECT auth.uid() AS uid)) AND (world_members.role = ANY (ARRAY['admin'::world_member_role, 'editor'::world_member_role])))))));



  create policy "Users can access worlds"
  on "public"."worlds"
  as permissive
  for select
  to authenticated, anon
using (user_has_world_access(id, ( SELECT auth.uid() AS uid)));



  create policy "Users can create worlds"
  on "public"."worlds"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = owner_id));



  create policy "Users can delete their own worlds"
  on "public"."worlds"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = owner_id));



  create policy "Users can update their own worlds"
  on "public"."worlds"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = owner_id))
with check ((( SELECT auth.uid() AS uid) = owner_id));



  create policy "Users can view their own worlds"
  on "public"."worlds"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = owner_id));



  create policy "Users can create entities in editable worlds"
  on "public"."entities"
  as permissive
  for insert
  to authenticated
with check (((world_id IN ( SELECT worlds.id
   FROM worlds
  WHERE (worlds.user_id = ( SELECT auth.uid() AS uid)))) OR (world_id IN ( SELECT world_members.world_id
   FROM world_members
  WHERE ((world_members.user_id = ( SELECT auth.uid() AS uid)) AND (world_members.role = ANY (ARRAY['admin'::world_member_role, 'editor'::world_member_role])))))));



  create policy "Users can view entities in accessible worlds"
  on "public"."entities"
  as permissive
  for select
  to authenticated, anon
using (user_has_world_access(world_id, ( SELECT auth.uid() AS uid)));



  create policy "world_delete_owner"
  on "public"."worlds"
  as permissive
  for delete
  to public
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "world_insert"
  on "public"."worlds"
  as permissive
  for insert
  to public
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "world_update_owner"
  on "public"."worlds"
  as permissive
  for update
  to public
using ((user_id = ( SELECT auth.uid() AS uid)));



