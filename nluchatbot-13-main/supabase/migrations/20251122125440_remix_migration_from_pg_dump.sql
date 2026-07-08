CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: annotations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.annotations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    dataset_id uuid,
    user_id uuid NOT NULL,
    text text NOT NULL,
    intent text,
    entities jsonb DEFAULT '[]'::jsonb,
    auto_predicted boolean DEFAULT false,
    confidence_score numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: datasets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.datasets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    file_type text NOT NULL,
    file_size integer NOT NULL,
    preview_data jsonb,
    row_count integer DEFAULT 0,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: evaluations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    dataset_id uuid,
    evaluator_id uuid NOT NULL,
    accuracy numeric(5,2),
    f1_score numeric(5,2),
    precision_score numeric(5,2),
    recall_score numeric(5,2),
    notes text,
    evaluated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: trained_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trained_models (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    user_id uuid NOT NULL,
    model_name text NOT NULL,
    model_type text DEFAULT 'spacy'::text NOT NULL,
    training_data_count integer DEFAULT 0,
    accuracy numeric,
    status text DEFAULT 'training'::text,
    model_path text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: workspaces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workspaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: annotations annotations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annotations
    ADD CONSTRAINT annotations_pkey PRIMARY KEY (id);


--
-- Name: datasets datasets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.datasets
    ADD CONSTRAINT datasets_pkey PRIMARY KEY (id);


--
-- Name: evaluations evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: trained_models trained_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trained_models
    ADD CONSTRAINT trained_models_pkey PRIMARY KEY (id);


--
-- Name: workspaces workspaces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_pkey PRIMARY KEY (id);


--
-- Name: annotations update_annotations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_annotations_updated_at BEFORE UPDATE ON public.annotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: trained_models update_trained_models_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_trained_models_updated_at BEFORE UPDATE ON public.trained_models FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: workspaces update_workspaces_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: annotations annotations_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annotations
    ADD CONSTRAINT annotations_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.datasets(id) ON DELETE SET NULL;


--
-- Name: annotations annotations_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annotations
    ADD CONSTRAINT annotations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: datasets datasets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.datasets
    ADD CONSTRAINT datasets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: datasets datasets_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.datasets
    ADD CONSTRAINT datasets_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: evaluations evaluations_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.datasets(id) ON DELETE SET NULL;


--
-- Name: evaluations evaluations_evaluator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_evaluator_id_fkey FOREIGN KEY (evaluator_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: evaluations evaluations_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: trained_models trained_models_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trained_models
    ADD CONSTRAINT trained_models_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: workspaces workspaces_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: annotations Users can create annotations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create annotations" ON public.annotations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: evaluations Users can create evaluations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create evaluations" ON public.evaluations FOR INSERT WITH CHECK ((auth.uid() = evaluator_id));


--
-- Name: trained_models Users can create models; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create models" ON public.trained_models FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: workspaces Users can create workspaces; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create workspaces" ON public.workspaces FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: annotations Users can delete own annotations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own annotations" ON public.annotations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: datasets Users can delete own datasets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own datasets" ON public.datasets FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: trained_models Users can delete own models; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own models" ON public.trained_models FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: workspaces Users can delete own workspaces; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own workspaces" ON public.workspaces FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: annotations Users can update own annotations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own annotations" ON public.annotations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: evaluations Users can update own evaluations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own evaluations" ON public.evaluations FOR UPDATE USING ((auth.uid() = evaluator_id));


--
-- Name: trained_models Users can update own models; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own models" ON public.trained_models FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: workspaces Users can update own workspaces; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own workspaces" ON public.workspaces FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: datasets Users can upload datasets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can upload datasets" ON public.datasets FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: evaluations Users can view all evaluations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all evaluations" ON public.evaluations FOR SELECT USING (true);


--
-- Name: annotations Users can view own annotations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own annotations" ON public.annotations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: datasets Users can view own datasets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own datasets" ON public.datasets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: trained_models Users can view own models; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own models" ON public.trained_models FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: workspaces Users can view own workspaces; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own workspaces" ON public.workspaces FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: annotations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;

--
-- Name: datasets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

--
-- Name: evaluations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: trained_models; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trained_models ENABLE ROW LEVEL SECURITY;

--
-- Name: workspaces; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


