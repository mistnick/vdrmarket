--
-- PostgreSQL database dump
--

\restrict juvFWMJYPQE1u8odlxtfNjLtjpedIaVMJ5SXszyEdjhnbpBLhpn0Qor8iazGDHH

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.views DROP CONSTRAINT IF EXISTS "views_viewerEmail_fkey";
ALTER TABLE IF EXISTS ONLY public.views DROP CONSTRAINT IF EXISTS "views_linkId_fkey";
ALTER TABLE IF EXISTS ONLY public.views DROP CONSTRAINT IF EXISTS "views_documentId_fkey";
ALTER TABLE IF EXISTS ONLY public.user_permissions DROP CONSTRAINT IF EXISTS "user_permissions_permissionId_fkey";
ALTER TABLE IF EXISTS ONLY public.team_members DROP CONSTRAINT IF EXISTS "team_members_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.team_members DROP CONSTRAINT IF EXISTS "team_members_teamId_fkey";
ALTER TABLE IF EXISTS ONLY public.team_invitations DROP CONSTRAINT IF EXISTS "team_invitations_teamId_fkey";
ALTER TABLE IF EXISTS ONLY public.tags DROP CONSTRAINT IF EXISTS "tags_teamId_fkey";
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS "sessions_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS "role_permissions_permissionId_fkey";
ALTER TABLE IF EXISTS ONLY public.recovery_codes DROP CONSTRAINT IF EXISTS "recovery_codes_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.questions DROP CONSTRAINT IF EXISTS "questions_dataRoomId_fkey";
ALTER TABLE IF EXISTS ONLY public.questions DROP CONSTRAINT IF EXISTS "questions_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public.questions DROP CONSTRAINT IF EXISTS "questions_assignedToId_fkey";
ALTER TABLE IF EXISTS ONLY public.questions DROP CONSTRAINT IF EXISTS "questions_askedById_fkey";
ALTER TABLE IF EXISTS ONLY public.qa_categories DROP CONSTRAINT IF EXISTS "qa_categories_dataRoomId_fkey";
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS "notifications_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.notification_preferences DROP CONSTRAINT IF EXISTS "notification_preferences_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.links DROP CONSTRAINT IF EXISTS "links_documentId_fkey";
ALTER TABLE IF EXISTS ONLY public.links DROP CONSTRAINT IF EXISTS "links_createdBy_fkey";
ALTER TABLE IF EXISTS ONLY public.link_allowed_emails DROP CONSTRAINT IF EXISTS "link_allowed_emails_linkId_fkey";
ALTER TABLE IF EXISTS ONLY public.folders DROP CONSTRAINT IF EXISTS "folders_teamId_fkey";
ALTER TABLE IF EXISTS ONLY public.folders DROP CONSTRAINT IF EXISTS "folders_parentId_fkey";
ALTER TABLE IF EXISTS ONLY public.folders DROP CONSTRAINT IF EXISTS "folders_ownerId_fkey";
ALTER TABLE IF EXISTS ONLY public.folders DROP CONSTRAINT IF EXISTS "folders_dataRoomId_fkey";
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS "documents_teamId_fkey";
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS "documents_ownerId_fkey";
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS "documents_folderId_fkey";
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS "documents_dataRoomId_fkey";
ALTER TABLE IF EXISTS ONLY public.document_versions DROP CONSTRAINT IF EXISTS "document_versions_documentId_fkey";
ALTER TABLE IF EXISTS ONLY public.document_versions DROP CONSTRAINT IF EXISTS "document_versions_createdById_fkey";
ALTER TABLE IF EXISTS ONLY public.document_tags DROP CONSTRAINT IF EXISTS "document_tags_tagId_fkey";
ALTER TABLE IF EXISTS ONLY public.document_tags DROP CONSTRAINT IF EXISTS "document_tags_documentId_fkey";
ALTER TABLE IF EXISTS ONLY public.document_metadata DROP CONSTRAINT IF EXISTS "document_metadata_documentId_fkey";
ALTER TABLE IF EXISTS ONLY public.data_rooms DROP CONSTRAINT IF EXISTS "data_rooms_teamId_fkey";
ALTER TABLE IF EXISTS ONLY public.data_room_permissions DROP CONSTRAINT IF EXISTS "data_room_permissions_dataRoomId_fkey";
ALTER TABLE IF EXISTS ONLY public.comments DROP CONSTRAINT IF EXISTS "comments_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.comments DROP CONSTRAINT IF EXISTS "comments_parentId_fkey";
ALTER TABLE IF EXISTS ONLY public.comments DROP CONSTRAINT IF EXISTS "comments_documentId_fkey";
ALTER TABLE IF EXISTS ONLY public.comment_mentions DROP CONSTRAINT IF EXISTS "comment_mentions_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.comment_mentions DROP CONSTRAINT IF EXISTS "comment_mentions_commentId_fkey";
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS "audit_logs_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS "audit_logs_teamId_fkey";
ALTER TABLE IF EXISTS ONLY public.answers DROP CONSTRAINT IF EXISTS "answers_questionId_fkey";
ALTER TABLE IF EXISTS ONLY public.answers DROP CONSTRAINT IF EXISTS "answers_answeredBy_fkey";
ALTER TABLE IF EXISTS ONLY public.accounts DROP CONSTRAINT IF EXISTS "accounts_userId_fkey";
DROP INDEX IF EXISTS public."views_viewedAt_idx";
DROP INDEX IF EXISTS public."views_linkId_idx";
DROP INDEX IF EXISTS public."views_documentId_idx";
DROP INDEX IF EXISTS public.verification_tokens_token_key;
DROP INDEX IF EXISTS public.verification_tokens_identifier_token_key;
DROP INDEX IF EXISTS public."users_passwordResetToken_key";
DROP INDEX IF EXISTS public."users_isActive_idx";
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public."user_permissions_userId_teamId_permissionId_key";
DROP INDEX IF EXISTS public."user_permissions_userId_teamId_idx";
DROP INDEX IF EXISTS public.teams_slug_key;
DROP INDEX IF EXISTS public."team_members_teamId_userId_key";
DROP INDEX IF EXISTS public.team_invitations_token_key;
DROP INDEX IF EXISTS public."team_invitations_teamId_email_key";
DROP INDEX IF EXISTS public."tags_teamId_name_key";
DROP INDEX IF EXISTS public."tags_teamId_idx";
DROP INDEX IF EXISTS public."sessions_userId_idx";
DROP INDEX IF EXISTS public."sessions_sessionToken_key";
DROP INDEX IF EXISTS public."role_permissions_role_permissionId_key";
DROP INDEX IF EXISTS public.role_permissions_role_idx;
DROP INDEX IF EXISTS public."recovery_codes_userId_idx";
DROP INDEX IF EXISTS public.recovery_codes_code_key;
DROP INDEX IF EXISTS public.questions_status_idx;
DROP INDEX IF EXISTS public."questions_dataRoomId_idx";
DROP INDEX IF EXISTS public."questions_bidderGroup_idx";
DROP INDEX IF EXISTS public."questions_assignedToId_idx";
DROP INDEX IF EXISTS public."questions_askedById_idx";
DROP INDEX IF EXISTS public."qa_categories_dataRoomId_name_key";
DROP INDEX IF EXISTS public."qa_categories_dataRoomId_idx";
DROP INDEX IF EXISTS public.permissions_name_key;
DROP INDEX IF EXISTS public."notifications_userId_idx";
DROP INDEX IF EXISTS public."notifications_createdAt_idx";
DROP INDEX IF EXISTS public."notification_preferences_userId_key";
DROP INDEX IF EXISTS public."notification_preferences_userId_idx";
DROP INDEX IF EXISTS public.links_slug_key;
DROP INDEX IF EXISTS public.links_slug_idx;
DROP INDEX IF EXISTS public."links_documentId_idx";
DROP INDEX IF EXISTS public."link_allowed_emails_linkId_email_key";
DROP INDEX IF EXISTS public."folders_teamId_idx";
DROP INDEX IF EXISTS public."folders_parentId_idx";
DROP INDEX IF EXISTS public."folders_dataRoomId_idx";
DROP INDEX IF EXISTS public."documents_teamId_idx";
DROP INDEX IF EXISTS public."documents_ownerId_idx";
DROP INDEX IF EXISTS public."documents_folderId_idx";
DROP INDEX IF EXISTS public."documents_dataRoomId_idx";
DROP INDEX IF EXISTS public."document_versions_documentId_versionNumber_key";
DROP INDEX IF EXISTS public."document_versions_documentId_idx";
DROP INDEX IF EXISTS public."document_versions_createdById_idx";
DROP INDEX IF EXISTS public."document_tags_tagId_idx";
DROP INDEX IF EXISTS public."document_tags_documentId_tagId_key";
DROP INDEX IF EXISTS public."document_tags_documentId_idx";
DROP INDEX IF EXISTS public.document_metadata_key_idx;
DROP INDEX IF EXISTS public."document_metadata_documentId_key_key";
DROP INDEX IF EXISTS public."document_metadata_documentId_idx";
DROP INDEX IF EXISTS public."data_rooms_teamId_idx";
DROP INDEX IF EXISTS public."data_room_permissions_dataRoomId_email_key";
DROP INDEX IF EXISTS public."comments_userId_idx";
DROP INDEX IF EXISTS public."comments_parentId_idx";
DROP INDEX IF EXISTS public."comments_documentId_idx";
DROP INDEX IF EXISTS public."comment_mentions_userId_read_idx";
DROP INDEX IF EXISTS public."comment_mentions_commentId_userId_key";
DROP INDEX IF EXISTS public."audit_logs_userId_idx";
DROP INDEX IF EXISTS public."audit_logs_teamId_idx";
DROP INDEX IF EXISTS public."audit_logs_resourceType_resourceId_idx";
DROP INDEX IF EXISTS public."audit_logs_createdAt_idx";
DROP INDEX IF EXISTS public."answers_questionId_idx";
DROP INDEX IF EXISTS public."answers_answeredBy_idx";
DROP INDEX IF EXISTS public."accounts_provider_providerAccountId_key";
ALTER TABLE IF EXISTS ONLY public.views DROP CONSTRAINT IF EXISTS views_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.user_permissions DROP CONSTRAINT IF EXISTS user_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.teams DROP CONSTRAINT IF EXISTS teams_pkey;
ALTER TABLE IF EXISTS ONLY public.team_members DROP CONSTRAINT IF EXISTS team_members_pkey;
ALTER TABLE IF EXISTS ONLY public.team_invitations DROP CONSTRAINT IF EXISTS team_invitations_pkey;
ALTER TABLE IF EXISTS ONLY public.tags DROP CONSTRAINT IF EXISTS tags_pkey;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.recovery_codes DROP CONSTRAINT IF EXISTS recovery_codes_pkey;
ALTER TABLE IF EXISTS ONLY public.questions DROP CONSTRAINT IF EXISTS questions_pkey;
ALTER TABLE IF EXISTS ONLY public.qa_categories DROP CONSTRAINT IF EXISTS qa_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.permissions DROP CONSTRAINT IF EXISTS permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.notification_preferences DROP CONSTRAINT IF EXISTS notification_preferences_pkey;
ALTER TABLE IF EXISTS ONLY public.links DROP CONSTRAINT IF EXISTS links_pkey;
ALTER TABLE IF EXISTS ONLY public.link_allowed_emails DROP CONSTRAINT IF EXISTS link_allowed_emails_pkey;
ALTER TABLE IF EXISTS ONLY public.folders DROP CONSTRAINT IF EXISTS folders_pkey;
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS documents_pkey;
ALTER TABLE IF EXISTS ONLY public.document_versions DROP CONSTRAINT IF EXISTS document_versions_pkey;
ALTER TABLE IF EXISTS ONLY public.document_tags DROP CONSTRAINT IF EXISTS document_tags_pkey;
ALTER TABLE IF EXISTS ONLY public.document_metadata DROP CONSTRAINT IF EXISTS document_metadata_pkey;
ALTER TABLE IF EXISTS ONLY public.data_rooms DROP CONSTRAINT IF EXISTS data_rooms_pkey;
ALTER TABLE IF EXISTS ONLY public.data_room_permissions DROP CONSTRAINT IF EXISTS data_room_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.comments DROP CONSTRAINT IF EXISTS comments_pkey;
ALTER TABLE IF EXISTS ONLY public.comment_mentions DROP CONSTRAINT IF EXISTS comment_mentions_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.answers DROP CONSTRAINT IF EXISTS answers_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts DROP CONSTRAINT IF EXISTS accounts_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
DROP TABLE IF EXISTS public.views;
DROP TABLE IF EXISTS public.verification_tokens;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.user_permissions;
DROP TABLE IF EXISTS public.teams;
DROP TABLE IF EXISTS public.team_members;
DROP TABLE IF EXISTS public.team_invitations;
DROP TABLE IF EXISTS public.tags;
DROP TABLE IF EXISTS public.sessions;
DROP TABLE IF EXISTS public.role_permissions;
DROP TABLE IF EXISTS public.recovery_codes;
DROP TABLE IF EXISTS public.questions;
DROP TABLE IF EXISTS public.qa_categories;
DROP TABLE IF EXISTS public.permissions;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.notification_preferences;
DROP TABLE IF EXISTS public.links;
DROP TABLE IF EXISTS public.link_allowed_emails;
DROP TABLE IF EXISTS public.folders;
DROP TABLE IF EXISTS public.documents;
DROP TABLE IF EXISTS public.document_versions;
DROP TABLE IF EXISTS public.document_tags;
DROP TABLE IF EXISTS public.document_metadata;
DROP TABLE IF EXISTS public.data_rooms;
DROP TABLE IF EXISTS public.data_room_permissions;
DROP TABLE IF EXISTS public.comments;
DROP TABLE IF EXISTS public.comment_mentions;
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.answers;
DROP TABLE IF EXISTS public.accounts;
DROP TABLE IF EXISTS public._prisma_migrations;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


ALTER TABLE public.accounts OWNER TO postgres;

--
-- Name: answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.answers (
    id text NOT NULL,
    "questionId" text NOT NULL,
    "answerText" text NOT NULL,
    "answeredBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.answers OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    "teamId" text,
    "userId" text,
    action text NOT NULL,
    "resourceType" text NOT NULL,
    "resourceId" text NOT NULL,
    metadata jsonb,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: comment_mentions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comment_mentions (
    id text NOT NULL,
    "commentId" text NOT NULL,
    "userId" text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.comment_mentions OWNER TO postgres;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id text NOT NULL,
    "documentId" text NOT NULL,
    "userId" text NOT NULL,
    content text NOT NULL,
    "parentId" text,
    "isPrivate" boolean DEFAULT false NOT NULL,
    resolved boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- Name: data_room_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.data_room_permissions (
    id text NOT NULL,
    "dataRoomId" text NOT NULL,
    email text NOT NULL,
    level text DEFAULT 'viewer'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.data_room_permissions OWNER TO postgres;

--
-- Name: data_rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.data_rooms (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "teamId" text NOT NULL,
    "isPublic" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.data_rooms OWNER TO postgres;

--
-- Name: document_metadata; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_metadata (
    id text NOT NULL,
    "documentId" text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    type text DEFAULT 'text'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.document_metadata OWNER TO postgres;

--
-- Name: document_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_tags (
    id text NOT NULL,
    "documentId" text NOT NULL,
    "tagId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.document_tags OWNER TO postgres;

--
-- Name: document_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_versions (
    id text NOT NULL,
    "documentId" text NOT NULL,
    "versionNumber" integer NOT NULL,
    file text NOT NULL,
    "fileSize" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    comment text,
    "createdById" text NOT NULL,
    "fileName" text,
    "fileType" text,
    metadata jsonb
);


ALTER TABLE public.document_versions OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    file text NOT NULL,
    "fileType" text NOT NULL,
    "fileSize" integer NOT NULL,
    versions integer DEFAULT 1 NOT NULL,
    "teamId" text NOT NULL,
    "ownerId" text NOT NULL,
    "folderId" text,
    "dataRoomId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: folders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.folders (
    id text NOT NULL,
    name text NOT NULL,
    "teamId" text NOT NULL,
    "ownerId" text NOT NULL,
    "parentId" text,
    "dataRoomId" text,
    path text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.folders OWNER TO postgres;

--
-- Name: link_allowed_emails; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.link_allowed_emails (
    id text NOT NULL,
    "linkId" text NOT NULL,
    email text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.link_allowed_emails OWNER TO postgres;

--
-- Name: links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.links (
    id text NOT NULL,
    slug text NOT NULL,
    "documentId" text NOT NULL,
    name text,
    description text,
    "createdBy" text NOT NULL,
    password text,
    "expiresAt" timestamp(3) without time zone,
    "allowDownload" boolean DEFAULT true NOT NULL,
    "allowNotification" boolean DEFAULT true NOT NULL,
    "emailProtected" boolean DEFAULT false NOT NULL,
    "emailAuthenticated" boolean DEFAULT false NOT NULL,
    "domainSlug" text,
    "enableTracking" boolean DEFAULT true NOT NULL,
    "enableFeedback" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.links OWNER TO postgres;

--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_preferences (
    id text NOT NULL,
    "userId" text NOT NULL,
    "emailEnabled" boolean DEFAULT true NOT NULL,
    "emailLinkViewed" boolean DEFAULT true NOT NULL,
    "emailDocumentShared" boolean DEFAULT true NOT NULL,
    "emailTeamInvitation" boolean DEFAULT true NOT NULL,
    "emailCommentMention" boolean DEFAULT true NOT NULL,
    "emailQAActivity" boolean DEFAULT true NOT NULL,
    "inAppEnabled" boolean DEFAULT true NOT NULL,
    "desktopEnabled" boolean DEFAULT false NOT NULL,
    "digestEnabled" boolean DEFAULT false NOT NULL,
    "digestFrequency" text DEFAULT 'daily'::text NOT NULL,
    "digestTime" text DEFAULT '09:00'::text NOT NULL,
    "soundEnabled" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.notification_preferences OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: qa_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.qa_categories (
    id text NOT NULL,
    "dataRoomId" text NOT NULL,
    name text NOT NULL,
    description text,
    color text,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.qa_categories OWNER TO postgres;

--
-- Name: questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.questions (
    id text NOT NULL,
    "dataRoomId" text NOT NULL,
    "categoryId" text,
    "questionText" text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    "askedById" text NOT NULL,
    "assignedToId" text,
    "bidderGroup" text,
    "isPrivate" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.questions OWNER TO postgres;

--
-- Name: recovery_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recovery_codes (
    id text NOT NULL,
    code text NOT NULL,
    used boolean DEFAULT false NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.recovery_codes OWNER TO postgres;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id text NOT NULL,
    role text NOT NULL,
    "permissionId" text NOT NULL,
    granted boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL,
    browser text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    device text,
    "ipAddress" text,
    "lastActivity" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    location text,
    os text,
    "userAgent" text
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tags (
    id text NOT NULL,
    "teamId" text NOT NULL,
    name text NOT NULL,
    color text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.tags OWNER TO postgres;

--
-- Name: team_invitations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.team_invitations (
    id text NOT NULL,
    "teamId" text NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.team_invitations OWNER TO postgres;

--
-- Name: team_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.team_members (
    id text NOT NULL,
    "teamId" text NOT NULL,
    "userId" text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.team_members OWNER TO postgres;

--
-- Name: teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teams (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo text,
    plan text DEFAULT 'free'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "accentColor" text,
    "brandColor" text,
    "customDomain" text,
    "watermarkEnabled" boolean DEFAULT true NOT NULL,
    "watermarkOpacity" double precision DEFAULT 0.3,
    "watermarkText" text
);


ALTER TABLE public.teams OWNER TO postgres;

--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_permissions (
    id text NOT NULL,
    "userId" text NOT NULL,
    "teamId" text NOT NULL,
    "permissionId" text NOT NULL,
    granted boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_permissions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text,
    email text NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    image text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    password text,
    "passwordResetExpiry" timestamp(3) without time zone,
    "passwordResetToken" text,
    "twoFactorEnabled" boolean DEFAULT false NOT NULL,
    "twoFactorSecret" text,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verification_tokens (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.verification_tokens OWNER TO postgres;

--
-- Name: views; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.views (
    id text NOT NULL,
    "linkId" text NOT NULL,
    "documentId" text NOT NULL,
    "viewerEmail" text,
    "viewerName" text,
    verified boolean DEFAULT false NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    country text,
    city text,
    "viewedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    duration integer,
    "completionRate" double precision,
    "downloadedAt" timestamp(3) without time zone
);


ALTER TABLE public.views OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
9be05d82-9c34-457c-bac0-eb87097e0892	5d76952ddb7672f0baef84035c397c714461697ec3642225409910c6d056a14a	2025-11-25 20:29:14.7247+00	20251120143257_init	\N	\N	2025-11-25 20:29:14.610772+00	1
aeb72abd-9d85-4753-9f26-89b60f6bb984	105c5ea2418f0daec568182dbc02dc9523d2c025297613672aa584868cb0873b	2025-11-25 20:29:14.726939+00	20251120154702_add_password_field	\N	\N	2025-11-25 20:29:14.725294+00	1
c9fde5a7-adaf-46fa-8f9e-98f35184d55d	6872d7256e800e62245a87e12f798a03f4c7540ac8e6596d25cf2f407ca6566b	2025-11-25 20:29:14.730394+00	20251120212733_add_branding_fields	\N	\N	2025-11-25 20:29:14.727373+00	1
529baa0a-0afa-41d5-8cd9-ccde1743802b	f89c97215c016472dda63f2a1979c753da2bbb301c0e828241d6e90db7960ad8	2025-11-25 20:29:14.751971+00	20251123110010_add_permissions_system	\N	\N	2025-11-25 20:29:14.731007+00	1
5e10ae45-a378-4698-bd0a-919dbd41ab00	c55d2e36a73c3007d4f2479ac8c2915544d67ccf775c60f14adef4d955386752	2025-11-25 20:29:14.763029+00	20251124091112_init_search	\N	\N	2025-11-25 20:29:14.752555+00	1
2d38f305-f82b-4f1e-b22b-2cc8a27dd79f	91276830e6da54436bb7e20fa650a0f18d79e649d68642b8d234bc74bdc1ffc0	2025-11-25 20:29:14.857077+00	20251124115144_add_notification_preferences	\N	\N	2025-11-25 20:29:14.763673+00	1
\.


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounts (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: answers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.answers (id, "questionId", "answerText", "answeredBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, "teamId", "userId", action, "resourceType", "resourceId", metadata, "ipAddress", "userAgent", "createdAt") FROM stdin;
cmif1ro8k000101p9l2zbqrcz	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-25 20:47:35.54
cmif1u9ln000101p9w90eo5y6	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-25 20:49:36.539
cmif1unww000301p9p7i5d9lo	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-25 20:49:55.088
cmif1v3xb000501p9262adocs	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-25 20:50:15.838
cmif1z66w000701p94x9709wz	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-25 20:53:25.4
cmif24rvb000901p9u8h592ot	\N	cmif15e8h00032o7kgm3bctkd	USER_LOGIN	USER	cmif15e8h00032o7kgm3bctkd	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-25 20:57:46.775
cmif273mb000b01p9kwugncdu	\N	cmif15e8h00032o7kgm3bctkd	USER_LOGIN	USER	cmif15e8h00032o7kgm3bctkd	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-25 20:59:35.315
cmif2bv1g000f01p9oomr6zpw	\N	cmif2bv0y000c01p9w5ocbl1d	USER_SIGNUP	USER	cmif2bv0y000c01p9w5ocbl1d	{"method": "credentials", "teamId": "cmif2bv1b000d01p9pjgurcbv"}	\N	\N	2025-11-25 21:03:17.476
cmif2c8t2000h01p9n36pyq3b	\N	cmif2bv0y000c01p9w5ocbl1d	USER_LOGIN	USER	cmif2bv0y000c01p9w5ocbl1d	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-25 21:03:35.318
cmif2vnuh000j01p9ng3t2w25	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-25 21:18:41.273
cmif3icar000l01p9c9jmgiiw	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-25 21:36:19.395
cmifnkxj0000n01p94un6w3kg	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-26 06:58:12.54
cmifnpnbm000101p1uhruwian	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-26 07:01:52.594
cmifo006z000101p1iixq9np8	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-26 07:09:55.835
cmifoeie2000101o5w8g65dvg	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-26 07:21:12.602
cmifoezh1000301o5wj89hew4	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-26 07:21:34.741
cmifooaps000101mn5njp13oa	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-26 07:28:49.216
cmifooua0000301mn9w5tewy5	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-26 07:29:14.568
cmig1gdgg000501mnukpxya4z	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-26 13:26:34.528
cmig1grl8000901mnrmg9ccsf	\N	cmig1grki000601mnjpxn2k5f	USER_SIGNUP	USER	cmig1grki000601mnjpxn2k5f	{"method": "credentials", "teamId": "cmig1grl1000701mngzj93csv"}	\N	\N	2025-11-26 13:26:52.844
cmig1gx8w000b01mnc84jmnja	\N	cmig1grki000601mnjpxn2k5f	USER_LOGIN	USER	cmig1grki000601mnjpxn2k5f	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-26 13:27:00.176
cmig1izwj000d01mnwmjudvfe	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-26 13:28:36.931
cmig1r26b000101pg8na32hjw	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-26 13:34:53.123
cmig20zmj000101s5mwvp4iah	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-26 13:42:36.379
cmig2hcss000101o1w5ty13zo	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-26 13:55:19.948
cmig2qudj000101t70vr3xko4	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-26 14:02:42.631
cmig6w1l0000001luqb8o6g5c	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202"}	\N	\N	2025-11-26 15:58:43.715
cmig6wbok000201lu2vjtnwud	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-26 15:58:56.804
cmig8xkwk000001p2uwv1gf60	\N	cmig1grki000601mnjpxn2k5f	USER_LOGOUT	USER	cmig1grki000601mnjpxn2k5f	{"ip": "178.128.69.202"}	\N	\N	2025-11-26 16:55:54.644
cmig8y2vp000201p2bak3lhcw	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-26 16:56:17.941
cmig8y35y000301p2om8k3q7h	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202"}	\N	\N	2025-11-26 16:56:18.31
cmig9ease000101pru1ie0xlf	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-26 17:08:54.686
cmig9eb4d000201prxrei5w2t	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202"}	\N	\N	2025-11-26 17:08:55.117
cmig9ze0z000001qjsn3beug9	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"provider": "credentials"}	\N	\N	2025-11-26 17:25:18.659
cmiga1liu000201qjb8gigrpj	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202", "method": "credentials"}	\N	\N	2025-11-26 17:27:01.686
cmiga1luf000301qj9kvb4ucw	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "178.128.69.202"}	\N	\N	2025-11-26 17:27:02.103
cmigagkf1000101qjj0sq1awr	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "172.18.0.1", "method": "credentials"}	\N	\N	2025-11-26 17:38:40.092
cmigagkqi000201qjyi4zd0vt	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "172.18.0.1"}	\N	\N	2025-11-26 17:38:40.506
cmigaz1tj000101po395q8ld1	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1", "method": "credentials"}	\N	\N	2025-11-26 17:53:02.455
cmigb21q7000301pop4ac0zx6	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1", "method": "credentials"}	\N	\N	2025-11-26 17:55:22.303
cmigb221l000401porw5rxcy6	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 17:55:22.713
cmigbcijy000501poxc7fyu93	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:03:30.67
cmigbctet000701pofyhkk6g7	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1", "method": "credentials"}	\N	\N	2025-11-26 18:03:44.741
cmigbctqv000801po5ojgo25d	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:03:45.175
cmigbd8tu000a01potmlfst2j	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1", "method": "credentials"}	\N	\N	2025-11-26 18:04:04.722
cmigbd95a000b01pooc3dzufi	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:04:05.134
cmigbpyru000101nk76347gq0	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1", "method": "credentials"}	\N	\N	2025-11-26 18:13:58.218
cmigbpzcv000201nkum2caow4	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:13:58.975
cmigbwz6o000001uhko494i38	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"provider": "credentials"}	\N	\N	2025-11-26 18:19:25.344
cmigbwzr0000101uhljgek6et	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:19:26.076
cmigbxcty000201uhiezho4o4	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:19:43.03
cmigbxqiq000301uhq5xs99n3	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:20:00.77
cmigbxzpb000401uhtikngfmq	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:20:12.671
cmigby9sc000501uh5iei164q	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:20:25.74
cmigbyjk7000601uh214egtb8	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:20:38.407
cmigbyt05000701uhjiz2ocfu	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:20:50.645
cmigbyt11000801uh3l1l7x43	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:20:50.677
cmigc0u0f000901uh21x4llu9	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:22:25.263
cmigc0v2y000a01uhsqsglnk7	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:22:26.65
cmigc0yon000b01uhy1vi1baw	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:22:31.319
cmigc11gr000c01uhu27gc337	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:22:34.923
cmigc123s000d01uh2ytwupez	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:22:35.751
cmigc12ip000e01uhnwoyxige	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:22:36.289
cmigc13uo000f01uh1pkpa098	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:22:38.015
cmigc13x0000g01uhky90gn54	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:22:38.1
cmigc17sf000h01uh63mtqk5a	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:22:43.119
cmigc3b6h000i01uhakoxw3x3	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:24:20.825
cmigc3b6q000j01uh3cpj8qn4	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:24:20.834
cmigc3c7t000k01uhkf99lb60	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:24:22.169
cmigc3r75000l01uhlyyk1p16	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:24:41.585
cmigc3yp2000m01uhvmletr8r	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:24:51.302
cmigc7t7z000n01uhnve8lrc9	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"provider": "credentials"}	\N	\N	2025-11-26 18:27:50.831
cmigc7tjk000o01uhszgrhalk	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:27:51.248
cmigc7xcg000p01uhw2z3wize	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:27:56.176
cmigcggu4000001qxvx2volkq	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"provider": "credentials"}	\N	\N	2025-11-26 18:34:34.683
cmigcgh9q000101qx4hdf1i1v	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:34:35.246
cmigcgoy8000201qx6sclfpqq	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:34:45.2
cmigchda5000401qx3jtl0xaj	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	invited	team_member	cmigchda0000301qxyrq6qma6	{"role": "member", "email": "test.invite@example.com", "emailSent": true}	\N	\N	2025-11-26 18:35:16.733
cmigcqrv3000001lwxngnm3p7	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"provider": "credentials"}	\N	\N	2025-11-26 18:42:35.535
cmigcqsbr000101lwsdmhbkwv	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:42:36.135
cmigcqvsj000201lwqvpg8esi	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:42:40.627
cmigcs5gf000401lwow7975nu	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	invited	team_member	cmigcs5c1000301lwpmnx91if	{"role": "viewer", "email": "pending.test@example.com", "emailSent": true}	\N	\N	2025-11-26 18:43:39.807
cmigctjw7000501lw0ebwkw8x	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:44:45.175
cmigctn0q000601lw4xx5inyn	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:44:49.225
cmigctn16000701lwll9xflw9	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:44:49.242
cmigcto1j000801lwvrmua9mg	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "192.168.65.1"}	\N	\N	2025-11-26 18:44:50.551
cmigd8vai000001mmt0fwzo4k	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"provider": "credentials"}	\N	\N	2025-11-26 18:56:39.786
cmigd8vvu000101mm93yegxay	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 18:56:40.554
cmigd8z6z000201mmoyf5f5ga	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 18:56:44.843
cmigdclsm000301mm1ji7z8hh	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 18:59:34.102
cmigdcott000401mmv4dof3le	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 18:59:38.033
cmigdcvrx000701mmijyrbqfo	cmigdcvrn000501mm5iej1mvy	cmif15e5u00002o7ka0uxh9ph	created	team	cmigdcvrn000501mm5iej1mvy	{"teamName": "Beta Team", "teamSlug": "beta-team"}	\N	\N	2025-11-26 18:59:47.037
cmigdcw48000801mmk8zovoyy	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 18:59:47.48
cmigdd0v5000901mmuk0harbf	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 18:59:53.633
cmigdd0x4000a01mmphs5w9cc	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 18:59:53.703
cmigdd5eo000b01mmi5qiaxp4	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 18:59:59.52
cmigdd6hd000c01mmkqwcj0yp	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:00:00.913
cmigdd7gt000d01mmrc842wik	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:00:02.189
cmigddfox000e01mmffimcfcm	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:00:12.849
cmigddfpa000f01mmcakdhf8j	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:00:12.862
cmigddl75000g01mm4bgldfl3	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:00:19.985
cmigdm3c3000i01mmuhdaeby9	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"provider": "credentials"}	\N	\N	2025-11-26 19:06:56.739
cmigdm3oj000j01mmh4aueq4y	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:06:57.187
cmigdm8cf000k01mmi99hyeig	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:07:03.231
cmigdp1c4000m01mm4y7fl1zf	cmigdcvrn000501mm5iej1mvy	cmif15e5u00002o7ka0uxh9ph	created	document	cmigdp1bp000l01mmoxfdhbxi	{"fileSize": 418840, "fileType": "application/pdf", "documentName": "CI-FG-24.pdf"}	\N	\N	2025-11-26 19:09:14.116
cmigdp2uc000n01mmbgkpxyw3	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:09:16.068
cmigdp8rk000o01mmrzervy37	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:09:23.744
cmigdpigz000q01mmk1kgdguy	cmigdcvrn000501mm5iej1mvy	cmif15e5u00002o7ka0uxh9ph	created	document	cmigdpigs000p01mmt54fkrxy	{"fileSize": 1517007, "fileType": "application/pdf", "documentName": "AdvancedManagement_Insead.pdf"}	\N	\N	2025-11-26 19:09:36.322
cmigdpiix000s01mmtzl1ow0v	cmigdcvrn000501mm5iej1mvy	cmif15e5u00002o7ka0uxh9ph	created	document	cmigdpiin000r01mmlau5ctok	{"fileSize": 695402, "fileType": "application/pdf", "documentName": "passaporto-FG.pdf"}	\N	\N	2025-11-26 19:09:36.393
cmigdpik3000u01mmi9oxty2e	cmigdcvrn000501mm5iej1mvy	cmif15e5u00002o7ka0uxh9ph	created	document	cmigdpik0000t01mmcoosjrks	{"fileSize": 904195, "fileType": "application/pdf", "documentName": "Vision-sheet.pdf"}	\N	\N	2025-11-26 19:09:36.435
cmigdpk12000v01mmr9syvont	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:09:38.342
cmigdqg44000x01mmak8di1s9	cmigdcvrn000501mm5iej1mvy	cmif15e5u00002o7ka0uxh9ph	shared	link	cmigdqg3s000w01mm3nyt3ro1	{"linkSlug": "p5_mSIVAt-", "documentId": "cmigdpik0000t01mmcoosjrks", "hasPassword": false, "documentName": "Vision-sheet.pdf"}	\N	\N	2025-11-26 19:10:19.924
cmigdqgfj000y01mmmtksbk9m	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:10:20.335
cmige5vii000201sigoize8yc	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:22:19.722
cmige62cb000301sizy4u9ppm	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:22:28.571
cmige65cu000401siw5voyb7t	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:22:32.478
cmige68j7000501si0yh9gka9	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:22:36.595
cmige6bjj000601sirvog9zpp	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:22:40.495
cmige6cm7000701sih4ohunbh	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:22:41.887
cmige6djs000801si1srylcmz	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:22:43.096
cmige6ez3000901siagioyq6l	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:22:44.943
cmige6gzr000a01sim3s1twhb	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:22:47.559
cmige6jcj000b01si0v1h3zsf	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:22:50.611
cmige6zjr000c01simbdhzw1z	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:23:11.607
cmige722j000d01sic8um92ho	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:23:14.875
cmige77zo000e01si3a00l200	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:23:22.548
cmige7b42000f01sijh6ucb6i	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:23:26.594
cmigembmt000001lh9571an75	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"provider": "credentials"}	\N	\N	2025-11-26 19:35:07.109
cmigemc0g000101lhzesyywc5	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:35:07.6
cmigemhcr000201lh0sf4bbce	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:35:14.523
cmigemo62000301lh84n7fmg0	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:35:23.354
cmigemo7g000401lhh5suuq06	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:35:23.404
cmigemr9k000501lhd5cen23b	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:35:27.368
cmigemstr000601lh7sdt0xr8	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:35:29.391
cmigemupg000701lhj339c1za	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:35:31.828
cmigendil000901lht8e8xx71	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	folder	cmigendi9000801lhh6e2w9z8	{"path": "/Risorse Umane", "folderName": "Risorse Umane"}	\N	\N	2025-11-26 19:35:56.205
cmigendt0000a01lh1rqzr9er	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:35:56.58
cmigenhyx000b01lhr4os1vko	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:36:01.977
cmigenlk5000c01lh8sj0ec4e	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:36:06.629
cmigeo2cy000e01lhhga3h9lq	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	dataroom	cmigeo2co000d01lhckcm825c	{"isPublic": false, "dataRoomName": "DR BeatData"}	\N	\N	2025-11-26 19:36:28.402
cmigeo2nx000f01lhovvdzizm	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:36:28.797
cmigeodft000g01lhu7yh9ih4	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:36:42.761
cmigepgun000h01lhd92x7e4f	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:37:33.839
cmigepnmc000i01lhwt813sho	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:37:42.612
cmigepp2b000j01lhtttopm8z	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:37:44.483
cmigeptbi000k01lhs04urksr	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:37:49.998
cmigeptdk000l01lhsbx9ruf4	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:37:50.071
cmigepuwy000m01lhibgwtg1g	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:37:52.066
cmigepuy6000n01lhduxej0g3	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:37:52.11
cmigepxl4000o01lhas3x9m2i	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:37:55.528
cmigeuewk000p01lhfop87q5a	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:41:24.596
cmigeufl3000q01lhfc9cv5e3	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:41:25.479
cmigeug9p000r01lhrx9n7lj0	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:41:26.365
cmigeuk03000s01lhd6xic0be	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:41:31.203
cmigeul6g000u01lhlwrqqtrl	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:41:32.728
cmigeuu1t000v01lhf886nq68	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:41:44.225
cmigeuuh8000w01lhf0doog3f	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:41:44.78
cmigevcfk000x01lhzs7ygjr7	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:42:08.048
cmigevch7000y01lhva9gqt84	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:42:08.107
cmigevhe9000z01lhwh00cbrx	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:42:14.481
cmigevhfb001001lhjb7zlxnh	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:42:14.519
cmigevhsz001101lh45d2zbwx	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:42:15.011
cmigewvxq001201lh92v26ipu	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:43:19.982
cmigewxx6001301lhnqx5ryw7	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:43:22.554
cmigex6ou001401lhag50okog	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:43:33.918
cmigex7m8001501lhlhmm3l8p	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:43:35.12
cmigez58r001601lhnx341c1m	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:45:05.355
cmigf1566001701lhubqoyvsp	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:46:38.574
cmigf16bw001801lhbiqafo28	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:46:40.076
cmigf19iv001901lh3ks55z9b	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:46:44.215
cmigf1czu001a01lhfn2zwvdo	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:46:48.714
cmigf1fe0001b01lhulg4ae8j	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:46:51.816
cmigf89zf000001p53z7dxsom	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:52:11.403
cmigf8e7u000101p5i8vo8rv0	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:52:16.89
cmigf8hzu000201p5f8igte4q	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:52:21.786
cmigf8k46000301p5slzfudx6	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:52:24.534
cmigf8l33000401p5i1owphah	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:52:25.791
cmigf96b4000501p580amqtoj	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:52:53.296
cmigf9ca0000601p5f1ioamu0	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:53:01.032
cmigf9d37000701p5cx6pjfpp	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:53:02.083
cmigf9flv000801p53miqxq94	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:53:05.347
cmigf9jz2000901p5qg2csfnz	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:53:11.006
cmigf9mb0000a01p575f87837	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:53:14.028
cmigf9r6s000b01p5rk5noayz	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:53:20.356
cmigf9vxt000c01p5xnu68bv8	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 19:53:26.513
cmigg1knl000001p3cxtn32yz	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:14:58.257
cmigg1ony000101p3e7db89m8	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:15:03.454
cmigg1qzi000201p3fxprpj13	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:15:06.462
cmigg335x000301p3iavdcfe2	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:16:08.901
cmigg372a000401p3brmj034l	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:16:13.954
cmigg3o51000501p30yzq6n4o	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:16:36.085
cmigg3p6x000601p32htxm433	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:16:37.449
cmigg3ypw000701p3mjhyk3b4	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:16:49.796
cmigglbl0000001rz3n0ldyz2	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:30:19.62
cmigglwkp000101rzd8b7vlws	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:30:46.825
cmigglz40000201rztnz495op	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:30:50.112
cmigguk3c000001mej8jvlik9	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:37:30.552
cmiggxct2000101meg740495o	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:39:41.078
cmiggxdrw000201melwsktqje	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:39:42.332
cmigh6avx000001p20cuzt2ax	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:46:38.493
cmigh6wme000101p2d11g9aj0	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:47:06.662
cmigh6yn1000201p246to0q4i	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:47:09.277
cmighb3r2000301p2hm1dyof5	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:50:22.526
cmighbc4v000401p20a73xcl6	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:50:33.391
cmighbgyz000501p2ip1ioadz	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:50:39.659
cmighbkv6000601p21me8fg0w	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:50:44.706
cmighbkxe000701p2qiz9z5f8	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:50:44.786
cmighbr6p000801p2z49nw7yo	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:50:52.897
cmighbsvk000901p2jkbngisp	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 20:50:55.088
cmighxlpw000001k39nupzpek	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 21:07:52.244
cmighxnl1000101k3bq4jhw6r	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 21:07:54.661
cmighyr02000201k34ctwj5cd	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 21:08:45.746
cmighyt8j000301k3a57dsti4	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 21:08:48.643
cmighztnp000401k3ge0drgdg	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 21:09:35.845
cmigi2z35000501k34z0yrswl	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 21:12:02.849
cmigi33uc000601k351wwturw	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 21:12:09.012
cmigi34hr000701k3znxtmisq	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 21:12:09.854
cmigi34jb000801k37p3aa0lv	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 21:12:09.91
cmigi56ce000901k3wgrf0q6d	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 21:13:45.566
cmigip2f4000001pgpphi1fom	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 21:29:13.6
cmigip4n4000101pg7eprb608	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 21:29:16.48
cmigipaaw000201pguyu5akoe	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 21:29:23.816
cmigipq03000401pgxwsre8ok	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigippzu000301pgpetftoaa	{"fileSize": 3628, "fileType": "application/pdf", "documentName": "audit_promate.pdf"}	\N	\N	2025-11-26 21:29:44.163
cmigipq13000601pgqdyx28ir	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigipq10000501pgonapirbl	{"fileSize": 427483, "fileType": "application/pdf", "documentName": "cessazione luce.pdf"}	\N	\N	2025-11-26 21:29:44.199
cmigipq1y000801pgaaogilis	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigipq1v000701pg5mfpgwfz	{"fileSize": 407930, "fileType": "application/pdf", "documentName": "cessazione_luce_edison.pdf"}	\N	\N	2025-11-26 21:29:44.23
cmigiqi9x000a01pg3b7jsag5	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqi9o000901pgxk9hsa2g	{"fileSize": 7243, "fileType": "text/markdown", "documentName": "EMAIL-SETUP.md"}	\N	\N	2025-11-26 21:30:20.805
cmigiqiao000c01pg70hl2xd0	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqial000b01pgjui481in	{"fileSize": 9009, "fileType": "text/markdown", "documentName": "FEATURES-COMPLETED.md"}	\N	\N	2025-11-26 21:30:20.832
cmigiqibj000e01pgfov3gk5c	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqibf000d01pg3abjgj4m	{"fileSize": 234273, "fileType": "image/png", "documentName": "dashboard.png"}	\N	\N	2025-11-26 21:30:20.863
cmigiqicd000g01pgw0xr9hgo	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqic8000f01pganq4uk1t	{"fileSize": 9078, "fileType": "text/markdown", "documentName": "UI-FLOW.md"}	\N	\N	2025-11-26 21:30:20.893
cmigiqidn000i01pglelwojhs	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqidl000h01pg1knuqkpb	{"fileSize": 3234, "fileType": "text/markdown", "documentName": "REDIS.md"}	\N	\N	2025-11-26 21:30:20.939
cmigiqieb000k01pgvo60mcys	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqie7000j01pg048d7enu	{"fileSize": 11528, "fileType": "text/markdown", "documentName": "SESSION-SUMMARY-21-NOV-2025.md"}	\N	\N	2025-11-26 21:30:20.963
cmigiqiez000m01pgzmv76ide	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqiew000l01pgoaccx426	{"fileSize": 12431, "fileType": "text/markdown", "documentName": "IMPLEMENTATION-SUMMARY.md"}	\N	\N	2025-11-26 21:30:20.987
cmigiqifl000o01pgo0zvb11n	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqifi000n01pgf15ded9w	{"fileSize": 9742, "fileType": "text/markdown", "documentName": "CHANGELOG-21-NOV-2025.md"}	\N	\N	2025-11-26 21:30:21.009
cmigiqig7000q01pg9cskj8x7	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqig4000p01pgn1l8dsio	{"fileSize": 6968, "fileType": "text/markdown", "documentName": "DOCKER-OPTIMIZATION.md"}	\N	\N	2025-11-26 21:30:21.031
cmigiqih8000s01pgzbx5a72f	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqigx000r01pgz5vw6oc1	{"fileSize": 15240, "fileType": "text/markdown", "documentName": "01-ANALISI-PAPERMARK.md"}	\N	\N	2025-11-26 21:30:21.068
cmigiqihv000u01pgnd4rl6xz	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqiht000t01pgbwswmgdv	{"fileSize": 27950, "fileType": "text/markdown", "documentName": "04-STRUTTURA-PROGETTO.md"}	\N	\N	2025-11-26 21:30:21.091
cmigiqiii000w01pghn6uw9bi	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqiig000v01pgx8mk48o9	{"fileSize": 34090, "fileType": "text/markdown", "documentName": "03-ARCHITETTURA-TECNICA.md"}	\N	\N	2025-11-26 21:30:21.114
cmigiqij7000y01pgocccawl8	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqij5000x01pgxsdmh3e3	{"fileSize": 43149, "fileType": "text/markdown", "documentName": "MOCKUP-ANALYSIS.md"}	\N	\N	2025-11-26 21:30:21.139
cmigiqiju001001pgnmrx5fyv	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqijr000z01pgxe3t0gv4	{"fileSize": 6423, "fileType": "text/markdown", "documentName": "DOCKER-SIMPLIFICATION.md"}	\N	\N	2025-11-26 21:30:21.162
cmigiqikj001201pgquyo2jpq	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqikg001101pgtb1szly7	{"fileSize": 1659, "fileType": "text/markdown", "documentName": "TESTING.md"}	\N	\N	2025-11-26 21:30:21.187
cmigiqil6001401pg75cbpa5a	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqil3001301pgd730z64w	{"fileSize": 9772, "fileType": "text/markdown", "documentName": "MISSING-FEATURES-COMPLETE-LIST.md"}	\N	\N	2025-11-26 21:30:21.21
cmigiqilq001601pgpqtvtzsq	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqilo001501pgszqegdcs	{"fileSize": 5194, "fileType": "text/markdown", "documentName": "AUTHENTIK-SETUP.md"}	\N	\N	2025-11-26 21:30:21.23
cmigiqimc001801pg6h4ao5wh	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqim9001701pgwbmik96k	{"fileSize": 7250, "fileType": "text/markdown", "documentName": "DEPLOYMENT.md"}	\N	\N	2025-11-26 21:30:21.252
cmigiqimy001a01pgwkh3x949	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqimv001901pgkw9mpdqz	{"fileSize": 6230, "fileType": "text/markdown", "documentName": "DESIGN-SYSTEM.md"}	\N	\N	2025-11-26 21:30:21.274
cmigiqinj001c01pgadntm13t	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqinh001b01pg3t8pm1xm	{"fileSize": 14379, "fileType": "text/markdown", "documentName": "PROJECT-COMPLETE-SUMMARY.md"}	\N	\N	2025-11-26 21:30:21.295
cmigiqio4001e01pge8idl4p1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqio2001d01pgx7jsumt9	{"fileSize": 15679, "fileType": "text/markdown", "documentName": "02-REQUISITI-FUNZIONALI.md"}	\N	\N	2025-11-26 21:30:21.316
cmigiqioq001g01pgkvaksb0w	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqion001f01pgeze8dquo	{"fileSize": 11832, "fileType": "text/markdown", "documentName": "NEXT-STEPS.md"}	\N	\N	2025-11-26 21:30:21.338
cmigiqiph001i01pgpdbqy7a6	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqipe001h01pgq4pzrw5r	{"fileSize": 6361, "fileType": "text/markdown", "documentName": "FASE-2-3-SUMMARY.md"}	\N	\N	2025-11-26 21:30:21.365
cmigiqiq2001k01pgn9tov1p8	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqipz001j01pgex9dxmir	{"fileSize": 5402, "fileType": "text/markdown", "documentName": "LOGIN-REDESIGN.md"}	\N	\N	2025-11-26 21:30:21.386
cmigiqiqp001m01pg7rqk2d2w	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqiqm001l01pghmyr8lmq	{"fileSize": 97933, "fileType": "image/png", "documentName": "login-template.png"}	\N	\N	2025-11-26 21:30:21.409
cmigiqirc001o01pgd39umsdi	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqira001n01pgsiwjsqrx	{"fileSize": 5004, "fileType": "text/markdown", "documentName": "dialog-system.md"}	\N	\N	2025-11-26 21:30:21.432
cmigiqis2001q01pg2sivykg0	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqiry001p01pgdit40lwm	{"fileSize": 5809, "fileType": "text/markdown", "documentName": "AUTHENTIK-FIX-SUMMARY.md"}	\N	\N	2025-11-26 21:30:21.458
cmigiqism001s01pgpamtgw67	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqisk001r01pg43hxnies	{"fileSize": 2979, "fileType": "text/markdown", "documentName": "MONITORING.md"}	\N	\N	2025-11-26 21:30:21.478
cmigiqit6001u01pgqzbu0zia	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqit4001t01pgy6vh81ya	{"fileSize": 8352, "fileType": "text/markdown", "documentName": "AUTH-SYSTEM.md"}	\N	\N	2025-11-26 21:30:21.498
cmigiqitu001w01pgtmfabg1o	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqitq001v01pgba1j7gn4	{"fileSize": 5907, "fileType": "text/markdown", "documentName": "AUTHENTIK-DOCKER-SETUP.md"}	\N	\N	2025-11-26 21:30:21.522
cmigiqiug001y01pgenu1xmvt	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqiud001x01pgzdxxshyl	{"fileSize": 13385, "fileType": "text/markdown", "documentName": "00-PROJECT-STATUS.md"}	\N	\N	2025-11-26 21:30:21.544
cmigiqiv8002001pgh4u8er1l	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqiv0001z01pgthkrz0tc	{"fileSize": 18128, "fileType": "text/markdown", "documentName": "FEATURES-STATUS.md"}	\N	\N	2025-11-26 21:30:21.572
cmigiqivu002201pg9t0ahg57	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigiqivs002101pgaa0kl2ng	{"fileSize": 11175, "fileType": "text/markdown", "documentName": "FASE-4-10-IMPLEMENTATION.md"}	\N	\N	2025-11-26 21:30:21.594
cmigiso4x002301pgjlqs2pvg	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 21:32:01.713
cmigisq0f002401pgeero1d34	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 21:32:04.143
cmigisqvk002501pgm92fv7iv	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 21:32:05.264
cmigisrw3002601pgms3fn81w	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 21:32:06.579
cmigistru002701pgk3gpnp6a	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 21:32:09.018
cmigj0h48002801pgn22q93t8	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 21:38:05.864
cmigj0i2f002901pglma7d0ak	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 21:38:07.095
cmigj12n4002b01pgjj4676zm	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	folder	cmigj12ml002a01pgbofrcryk	{"path": "/Documenti HR", "folderName": "Documenti HR"}	\N	\N	2025-11-26 21:38:33.76
cmigj26yg000001o5nrbwctll	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 21:39:26.008
cmigj2gjo000101o58d3u09t0	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	DOCUMENT_MOVED	DOCUMENT	cmigiqiud001x01pgzdxxshyl	{"toFolderId": "cmigj12ml002a01pgbofrcryk", "fromFolderId": null}	\N	\N	2025-11-26 21:39:38.436
cmigj6aje000301o5jtmzqss9	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	folder	cmigj6aiu000201o5qf0z0epd	{"path": "/__tests__", "folderName": "__tests__"}	\N	\N	2025-11-26 21:42:37.273
cmigj6ak0000501o530n8bhy5	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	folder	cmigj6ajw000401o5kn7z7854	{"path": "/__tests__/lib", "folderName": "lib"}	\N	\N	2025-11-26 21:42:37.296
cmigj6amg000701o5xwim7hha	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigj6am7000601o5slb6n8wr	{"fileSize": 6148, "fileType": "application/octet-stream", "documentName": ".DS_Store"}	\N	\N	2025-11-26 21:42:37.384
cmigj6ane000901o5q2wj2p6f	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigj6ana000801o5it76uyuf	{"fileSize": 6148, "fileType": "application/octet-stream", "documentName": ".DS_Store"}	\N	\N	2025-11-26 21:42:37.418
cmigjr2lo000001ob3dm15lbh	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 21:58:46.763
Fr-Nl-zNF8q_QGbNIyrgm	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	FOLDER_DELETE	folder	cmigj6aiu000201o5qf0z0epd	{"bulkDelete": true, "folderName": "__tests__", "childrenCount": 1, "documentsCount": 1}	\N	\N	2025-11-26 21:59:04.174
cmigjrua7000101obgutr5wtz	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	DOCUMENT_MOVED	DOCUMENT	cmigj6ana000801o5it76uyuf	{"toFolderId": "cmigj12ml002a01pgbofrcryk", "fromFolderId": null}	\N	\N	2025-11-26 21:59:22.639
cmigjrwvr000201obr6mg6fiv	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	DOCUMENT_MOVED	DOCUMENT	cmigj6am7000601o5slb6n8wr	{"toFolderId": "cmigj12ml002a01pgbofrcryk", "fromFolderId": null}	\N	\N	2025-11-26 21:59:26.007
cmigl2ad2000001qn9h5hghcm	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:35:29.654
cmigl2dzh000101qnaoq9h6gx	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	DOCUMENT_MOVED	DOCUMENT	cmigiqivs002101pgaa0kl2ng	{"toFolderId": null, "fromFolderId": null, "toDataRoomId": "cmigeo2co000d01lhckcm825c", "fromDataRoomId": "cmigeo2co000d01lhckcm825c"}	\N	\N	2025-11-26 22:35:34.349
cmigl2hxi000201qn2rhi0kf6	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	DOCUMENT_MOVED	DOCUMENT	cmigiqiv0001z01pgthkrz0tc	{"toFolderId": "cmigj12ml002a01pgbofrcryk", "fromFolderId": null, "toDataRoomId": "cmigeo2co000d01lhckcm825c", "fromDataRoomId": "cmigeo2co000d01lhckcm825c"}	\N	\N	2025-11-26 22:35:39.462
cmigl2s9a000301qn6kswcbr9	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	DOCUMENT_MOVED	DOCUMENT	cmigiqivs002101pgaa0kl2ng	{"toFolderId": "cmigj12ml002a01pgbofrcryk", "fromFolderId": null, "toDataRoomId": "cmigeo2co000d01lhckcm825c", "fromDataRoomId": "cmigeo2co000d01lhckcm825c"}	\N	\N	2025-11-26 22:35:52.846
KecXbwaZufrwww3lQ_eow	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	DOCUMENT_DELETE	document	cmigj6ana000801o5it76uyuf	{"bulkDelete": true, "documentName": ".DS_Store"}	\N	\N	2025-11-26 22:36:08.085
-zKoIFUKM1o63IaoYdYrB	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	DOCUMENT_DELETE	document	cmigj6am7000601o5slb6n8wr	{"bulkDelete": true, "documentName": ".DS_Store"}	\N	\N	2025-11-26 22:36:08.091
cmigl5qhv000401qnx3rvgf2c	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	DOCUMENT_MOVED	DOCUMENT	cmigiqigx000r01pgz5vw6oc1	{"toFolderId": "cmigj12ml002a01pgbofrcryk", "fromFolderId": null, "toDataRoomId": "cmigeo2co000d01lhckcm825c", "fromDataRoomId": "cmigeo2co000d01lhckcm825c"}	\N	\N	2025-11-26 22:38:10.531
cmigl5vmo000501qnvldcsbcu	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	DOCUMENT_MOVED	DOCUMENT	cmigiqiig000v01pgx8mk48o9	{"toFolderId": "cmigj12ml002a01pgbofrcryk", "fromFolderId": null, "toDataRoomId": "cmigeo2co000d01lhckcm825c", "fromDataRoomId": "cmigeo2co000d01lhckcm825c"}	\N	\N	2025-11-26 22:38:17.184
cmigl61ui000601qnikwdurck	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	DOCUMENT_MOVED	DOCUMENT	cmigiqiig000v01pgx8mk48o9	{"toFolderId": null, "fromFolderId": "cmigj12ml002a01pgbofrcryk", "toDataRoomId": "cmigeo2co000d01lhckcm825c", "fromDataRoomId": "cmigeo2co000d01lhckcm825c"}	\N	\N	2025-11-26 22:38:25.242
cmigl69jo000701qnpb213n4u	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:38:35.22
cmigl6avd000801qnb9pndcx3	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:38:36.937
cmigl6ff4000901qnvh7ckgp3	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:38:42.832
cmigl6k3p000a01qn5649yyj2	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:38:48.901
cmigl6p00000b01qnjqz9ylt0	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:38:55.248
cmigl6r51000c01qn0g93n822	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:38:58.021
cmigl7yuu000d01qne2yxa6vt	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:39:54.678
cmigl83qq000e01qnutp56gga	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:40:01.01
cmigl846u000f01qn78jb9p22	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:40:01.59
cmigl8hej000g01qn73gv3iyr	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:40:18.715
cmigl8ixw000h01qn0p8z6icr	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:40:20.708
cmigl8wyp000i01qnlirmxir7	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:40:38.881
cmigl8wzq000j01qnb0vlq3if	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:40:38.917
cmigl8y16000k01qnkdsuxxdm	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:40:40.266
cmigl8zas000l01qntlpv6dud	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:40:41.908
cmigl8zwq000m01qnd8b6zlir	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:40:42.698
cmigl90i8000n01qni3su0xkd	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:40:43.472
cmigl938a000o01qnrh6vfcpj	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:40:47.002
cmigl97hh000p01qnn321w5q9	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:40:52.517
cmigl98kc000q01qn3ueuo2kr	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:40:53.916
cmigl999z000r01qn9a0cc7bs	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:40:54.839
cmigl9lbm000s01qngfpdnbvc	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:41:10.45
cmigl9n77000t01qnc3fcm96g	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:41:12.883
cmigl9uka000u01qnohuia34e	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:41:22.426
cmigl9uku000v01qnisev8au8	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:41:22.446
cmigl9xcw000w01qnvargw1wg	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:41:26.048
cmigla5bp000x01qn1fn2p8wm	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:41:36.373
cmigla6ws000y01qnc77rm2kq	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:41:38.428
cmiglaa47000z01qnb9hvcgal	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:41:42.583
cmiglabs1001001qn42f2h1am	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:41:44.737
cmiglabyv001101qnft7yc57m	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:41:44.983
cmiglac45001201qn4enro7rf	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:41:45.173
cmiglb9bz001301qn3hiwj0yn	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:42:28.223
cmiglbamy001401qncio0i4am	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:42:29.914
cmiglbbmt001501qnknifryqa	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:42:31.205
cmiglbnjq001601qn78k8mohm	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:42:46.646
cmiglbpc8001701qntswewrg0	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:42:48.968
cmiglbq7l001801qnqzgqo5df	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:42:50.097
cmiglce3r001901qnrx7g1f2r	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:43:21.063
cmiglce3s001a01qnkn14e5l2	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:43:21.064
cmiglcf4h001b01qnshqqlx2y	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:43:22.385
cmigldmw7000001obo4dp15iv	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:44:19.111
cmigldp47000101obm3629rr5	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:44:21.991
cmigldqta000201obk0d7jyr0	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:44:24.19
cmigldrtx000301obabn8kh16	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:44:25.509
cmigldsec000401obug8609bp	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:44:26.244
cmigldzam000501obd206t7z3	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:44:35.182
cmigle7ft000601oblyoewh8j	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:44:45.737
cmigle7g2000701obl9s9t912	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:44:45.746
cmigle9t0000801obhps086iw	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 22:44:48.804
cmignzxn9000001nn9hf0550t	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"provider": "credentials"}	\N	\N	2025-11-26 23:57:38.709
cmignzy0j000101nno9lmnvq7	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 23:57:39.187
cmignzzjj000201nn8dbiuzdc	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 23:57:41.167
cmigo00rg000301nn83pmfeyu	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 23:57:42.748
cmigo02r1000401nn2i73qtru	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-26 23:57:45.325
loGHF92OKtS9ZHfNASOIp	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	DOCUMENT_DELETE	document	cmigiqiud001x01pgzdxxshyl	{"bulkDelete": true, "documentName": "00-PROJECT-STATUS.md"}	\N	\N	2025-11-26 23:58:22.259
cmigo1cxj000501nnej7qdlrc	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	DOCUMENT_MOVED	DOCUMENT	cmigiqiig000v01pgx8mk48o9	{"toFolderId": "cmigj12ml002a01pgbofrcryk", "fromFolderId": null, "toDataRoomId": "cmigeo2co000d01lhckcm825c", "fromDataRoomId": "cmigeo2co000d01lhckcm825c"}	\N	\N	2025-11-26 23:58:45.175
cmigo1j41000601nnb9jfhv4o	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	DOCUMENT_MOVED	DOCUMENT	cmigippzu000301pgpetftoaa	{"toFolderId": "cmigj12ml002a01pgbofrcryk", "fromFolderId": null, "toDataRoomId": "cmigeo2co000d01lhckcm825c", "fromDataRoomId": "cmigeo2co000d01lhckcm825c"}	\N	\N	2025-11-26 23:58:53.185
cmigo1sqi000801nnfggwheom	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	created	document	cmigo1sq7000701nnnfw1d040	{"fileSize": 580, "fileType": "application/octet-stream", "documentName": "build.log"}	\N	\N	2025-11-26 23:59:05.658
cmigo6ao8000901nnk50wf5vg	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:02:35.528
cmigo7tei000a01nnwkg0uvk8	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:03:46.458
cmigo7ups000b01nnx6vb151p	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:03:48.16
cmigo87pa000c01nnf068b9ux	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:04:04.99
cmigo894u000d01nn9pgb35rd	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:04:06.846
cmigo9fdq000e01nn62q57k1u	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:05:01.598
cmigo9grb000f01nnff7zutvy	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:05:03.383
cmigo9ib7000g01nnwsqm8fyz	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:05:05.395
cmigo9jy5000h01nn6qsxtvrx	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:05:07.517
cmigo9mo5000i01nnckbbpwm0	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:05:11.045
cmigo9pjx000j01nnyik5k7ok	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:05:14.781
cmigo9rhs000k01nnqpeadt9i	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:05:17.296
cmigo9rjd000l01nn8uwyarul	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:05:17.353
cmigpmmbr000m01nnfy8d043s	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:43:16.743
cmigpmn25000n01nnyfgpbcr9	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:43:17.693
cmigpmnm1000o01nnx9jlb3j6	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:43:18.409
cmigpmo2c000p01nnt9hxehr5	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:43:18.996
cmigpmogh000q01nn0hzbrnpq	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:43:19.505
cmigpmpgz000r01nn5b49w7dy	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:43:20.819
cmigpw6eo000s01nniba0euxg	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:50:42.672
cmigpwb7d000t01nndm4brm2t	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:50:48.889
cmigpwb85000u01nns8k6zb8p	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:50:48.917
cmigpwisb000v01nngz54hfjj	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:50:58.715
cmigpwlo7000w01nn94inxehn	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:51:02.455
cmigpwlos000x01nnhofj6xa9	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:51:02.476
cmigpwqs8000y01nn3ig0w8gg	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:51:09.08
cmigpwxn9000z01nno4e6su02	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:51:17.973
cmigpy6es001001nncts0oo8z	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:52:15.988
cmigpy8fr001101nn8v30xl3e	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:52:18.615
cmigpyjhh001201nntwn5kyqx	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 00:52:32.933
cmigqjxim001301nnqjlb3u69	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 01:09:10.894
cmigqjym5001401nngpb75mhs	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 01:09:12.317
cmigqjyml001501nnjmbczcew	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 01:09:12.333
cmigr8iso000101mrhveuiwrw	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163", "method": "credentials"}	\N	\N	2025-11-27 01:28:18.216
cmigrbye0000201mr4u391iuu	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGIN	USER	cmif15e5u00002o7ka0uxh9ph	{"provider": "credentials"}	\N	\N	2025-11-27 01:30:58.392
cmigrbywu000301mr04r8sy3r	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 01:30:59.07
cmigrc1dn000401mrb1k8gfe1	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 01:31:02.267
cmigrd3wq000501mrv4yv2ni7	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 01:31:52.202
cmigrd77l000601mrkrhe5g9u	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 01:31:56.481
cmigrd833000701mr0pf4tnsv	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 01:31:57.615
cmigrdge6000801mruuzuwrj5	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 01:32:08.382
cmigrdhqy000901mr0ryqg74b	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 01:32:10.138
cmigrdi8p000a01mreh38wvci	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 01:32:10.777
cmigrdipe000b01mrkao556j7	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 01:32:11.378
cmigrg2n4000c01mrcr56d5d1	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 01:34:10.528
cmigrg2ws000d01mr65scoo71	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 01:34:10.876
cmigrg2xk000e01mrt8hls08u	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 01:34:10.904
cmigrg5ri000f01mr3m4wyhvu	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 01:34:14.574
cmigrg8gr000g01mr1fm03ejt	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 01:34:18.074
cmigrga82000h01mr96vfxc07	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 01:34:20.354
cmigrga8n000i01mrfkby6ykz	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 01:34:20.375
cmigrgiv5000j01mrd0myutsh	\N	cmif15e5u00002o7ka0uxh9ph	USER_LOGOUT	USER	cmif15e5u00002o7ka0uxh9ph	{"ip": "142.250.180.163"}	\N	\N	2025-11-27 01:34:31.553
\.


--
-- Data for Name: comment_mentions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comment_mentions (id, "commentId", "userId", read, "createdAt") FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comments (id, "documentId", "userId", content, "parentId", "isPrivate", resolved, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: data_room_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.data_room_permissions (id, "dataRoomId", email, level, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: data_rooms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.data_rooms (id, name, description, "teamId", "isPublic", "createdAt", "updatedAt") FROM stdin;
cmigeo2co000d01lhckcm825c	DR BeatData	\N	cmif15e6700012o7kvzihtgf9	f	2025-11-26 19:36:28.391	2025-11-26 19:36:28.391
\.


--
-- Data for Name: document_metadata; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_metadata (id, "documentId", key, value, type, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: document_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_tags (id, "documentId", "tagId", "createdAt") FROM stdin;
\.


--
-- Data for Name: document_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_versions (id, "documentId", "versionNumber", file, "fileSize", "createdAt", comment, "createdById", "fileName", "fileType", metadata) FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, name, description, file, "fileType", "fileSize", versions, "teamId", "ownerId", "folderId", "dataRoomId", "createdAt", "updatedAt") FROM stdin;
cmigdp1bp000l01mmoxfdhbxi	CI-FG-24.pdf	\N	cmigdcvrn000501mm5iej1mvy/1764184154064-CI-FG-24.pdf	application/pdf	418840	1	cmigdcvrn000501mm5iej1mvy	cmif15e5u00002o7ka0uxh9ph	\N	\N	2025-11-26 19:09:14.1	2025-11-26 19:09:14.1
cmigdpigs000p01mmt54fkrxy	AdvancedManagement_Insead.pdf	\N	cmigdcvrn000501mm5iej1mvy/1764184176284-AdvancedManagement_Insead.pdf	application/pdf	1517007	1	cmigdcvrn000501mm5iej1mvy	cmif15e5u00002o7ka0uxh9ph	\N	\N	2025-11-26 19:09:36.316	2025-11-26 19:09:36.316
cmigdpiin000r01mmlau5ctok	passaporto-FG.pdf	\N	cmigdcvrn000501mm5iej1mvy/1764184176341-passaporto-FG.pdf	application/pdf	695402	1	cmigdcvrn000501mm5iej1mvy	cmif15e5u00002o7ka0uxh9ph	\N	\N	2025-11-26 19:09:36.377	2025-11-26 19:09:36.377
cmigdpik0000t01mmcoosjrks	Vision-sheet.pdf	\N	cmigdcvrn000501mm5iej1mvy/1764184176411-Vision-sheet.pdf	application/pdf	904195	1	cmigdcvrn000501mm5iej1mvy	cmif15e5u00002o7ka0uxh9ph	\N	\N	2025-11-26 19:09:36.431	2025-11-26 19:09:36.431
cmigipq10000501pgonapirbl	cessazione luce.pdf	\N	cmif15e6700012o7kvzihtgf9/1764192584178-cessazione luce.pdf	application/pdf	427483	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:29:44.195	2025-11-26 21:29:44.195
cmigipq1v000701pg5mfpgwfz	cessazione_luce_edison.pdf	\N	cmif15e6700012o7kvzihtgf9/1764192584212-cessazione_luce_edison.pdf	application/pdf	407930	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:29:44.227	2025-11-26 21:29:44.227
cmigiqi9o000901pgxk9hsa2g	EMAIL-SETUP.md	\N	cmif15e6700012o7kvzihtgf9/1764192620768-docs/EMAIL-SETUP.md	text/markdown	7243	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:20.795	2025-11-26 21:30:20.795
cmigiqial000b01pgjui481in	FEATURES-COMPLETED.md	\N	cmif15e6700012o7kvzihtgf9/1764192620818-docs/FEATURES-COMPLETED.md	text/markdown	9009	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:20.829	2025-11-26 21:30:20.829
cmigiqibf000d01pg3abjgj4m	dashboard.png	\N	cmif15e6700012o7kvzihtgf9/1764192620845-docs/dashboard.png	image/png	234273	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:20.858	2025-11-26 21:30:20.858
cmigiqic8000f01pganq4uk1t	UI-FLOW.md	\N	cmif15e6700012o7kvzihtgf9/1764192620875-docs/UI-FLOW.md	text/markdown	9078	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:20.887	2025-11-26 21:30:20.887
cmigiqidl000h01pg1knuqkpb	REDIS.md	\N	cmif15e6700012o7kvzihtgf9/1764192620926-docs/REDIS.md	text/markdown	3234	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:20.936	2025-11-26 21:30:20.936
cmigiqie7000j01pg048d7enu	SESSION-SUMMARY-21-NOV-2025.md	\N	cmif15e6700012o7kvzihtgf9/1764192620949-docs/SESSION-SUMMARY-21-NOV-2025.md	text/markdown	11528	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:20.959	2025-11-26 21:30:20.959
cmigiqiew000l01pgoaccx426	IMPLEMENTATION-SUMMARY.md	\N	cmif15e6700012o7kvzihtgf9/1764192620973-docs/IMPLEMENTATION-SUMMARY.md	text/markdown	12431	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:20.983	2025-11-26 21:30:20.983
cmigiqifi000n01pgf15ded9w	CHANGELOG-21-NOV-2025.md	\N	cmif15e6700012o7kvzihtgf9/1764192620996-docs/CHANGELOG-21-NOV-2025.md	text/markdown	9742	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.005	2025-11-26 21:30:21.005
cmigiqig4000p01pgn1l8dsio	DOCKER-OPTIMIZATION.md	\N	cmif15e6700012o7kvzihtgf9/1764192621019-docs/DOCKER-OPTIMIZATION.md	text/markdown	6968	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.028	2025-11-26 21:30:21.028
cmigiqiht000t01pgbwswmgdv	04-STRUTTURA-PROGETTO.md	\N	cmif15e6700012o7kvzihtgf9/1764192621078-docs/04-STRUTTURA-PROGETTO.md	text/markdown	27950	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.088	2025-11-26 21:30:21.088
cmigiqij5000x01pgxsdmh3e3	MOCKUP-ANALYSIS.md	\N	cmif15e6700012o7kvzihtgf9/1764192621126-docs/MOCKUP-ANALYSIS.md	text/markdown	43149	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.136	2025-11-26 21:30:21.136
cmigiqijr000z01pgxe3t0gv4	DOCKER-SIMPLIFICATION.md	\N	cmif15e6700012o7kvzihtgf9/1764192621150-docs/DOCKER-SIMPLIFICATION.md	text/markdown	6423	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.159	2025-11-26 21:30:21.159
cmigiqikg001101pgtb1szly7	TESTING.md	\N	cmif15e6700012o7kvzihtgf9/1764192621172-docs/TESTING.md	text/markdown	1659	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.183	2025-11-26 21:30:21.183
cmigiqil3001301pgd730z64w	MISSING-FEATURES-COMPLETE-LIST.md	\N	cmif15e6700012o7kvzihtgf9/1764192621198-docs/MISSING-FEATURES-COMPLETE-LIST.md	text/markdown	9772	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.207	2025-11-26 21:30:21.207
cmigiqilo001501pgszqegdcs	AUTHENTIK-SETUP.md	\N	cmif15e6700012o7kvzihtgf9/1764192621220-docs/AUTHENTIK-SETUP.md	text/markdown	5194	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.228	2025-11-26 21:30:21.228
cmigiqim9001701pgwbmik96k	DEPLOYMENT.md	\N	cmif15e6700012o7kvzihtgf9/1764192621240-docs/DEPLOYMENT.md	text/markdown	7250	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.249	2025-11-26 21:30:21.249
cmigiqimv001901pgkw9mpdqz	DESIGN-SYSTEM.md	\N	cmif15e6700012o7kvzihtgf9/1764192621262-docs/DESIGN-SYSTEM.md	text/markdown	6230	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.271	2025-11-26 21:30:21.271
cmigiqinh001b01pg3t8pm1xm	PROJECT-COMPLETE-SUMMARY.md	\N	cmif15e6700012o7kvzihtgf9/1764192621283-docs/PROJECT-COMPLETE-SUMMARY.md	text/markdown	14379	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.292	2025-11-26 21:30:21.292
cmigiqio2001d01pgx7jsumt9	02-REQUISITI-FUNZIONALI.md	\N	cmif15e6700012o7kvzihtgf9/1764192621305-docs/02-REQUISITI-FUNZIONALI.md	text/markdown	15679	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.313	2025-11-26 21:30:21.313
cmigiqion001f01pgeze8dquo	NEXT-STEPS.md	\N	cmif15e6700012o7kvzihtgf9/1764192621327-docs/NEXT-STEPS.md	text/markdown	11832	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.335	2025-11-26 21:30:21.335
cmigiqipe001h01pgq4pzrw5r	FASE-2-3-SUMMARY.md	\N	cmif15e6700012o7kvzihtgf9/1764192621351-docs/FASE-2-3-SUMMARY.md	text/markdown	6361	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.361	2025-11-26 21:30:21.361
cmigiqiig000v01pgx8mk48o9	03-ARCHITETTURA-TECNICA.md	\N	cmif15e6700012o7kvzihtgf9/1764192621102-docs/03-ARCHITETTURA-TECNICA.md	text/markdown	34090	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	cmigj12ml002a01pgbofrcryk	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.111	2025-11-26 23:58:45.171
cmigippzu000301pgpetftoaa	audit_promate.pdf	\N	cmif15e6700012o7kvzihtgf9/1764192584102-audit_promate.pdf	application/pdf	3628	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	cmigj12ml002a01pgbofrcryk	cmigeo2co000d01lhckcm825c	2025-11-26 21:29:44.153	2025-11-26 23:58:53.181
cmigiqipz001j01pgex9dxmir	LOGIN-REDESIGN.md	\N	cmif15e6700012o7kvzihtgf9/1764192621374-docs/LOGIN-REDESIGN.md	text/markdown	5402	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.383	2025-11-26 21:30:21.383
cmigiqiqm001l01pghmyr8lmq	login-template.png	\N	cmif15e6700012o7kvzihtgf9/1764192621397-docs/login-template.png	image/png	97933	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.406	2025-11-26 21:30:21.406
cmigiqira001n01pgsiwjsqrx	dialog-system.md	\N	cmif15e6700012o7kvzihtgf9/1764192621420-docs/dialog-system.md	text/markdown	5004	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.429	2025-11-26 21:30:21.429
cmigiqiry001p01pgdit40lwm	AUTHENTIK-FIX-SUMMARY.md	\N	cmif15e6700012o7kvzihtgf9/1764192621444-docs/AUTHENTIK-FIX-SUMMARY.md	text/markdown	5809	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.454	2025-11-26 21:30:21.454
cmigiqisk001r01pg43hxnies	MONITORING.md	\N	cmif15e6700012o7kvzihtgf9/1764192621467-docs/MONITORING.md	text/markdown	2979	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.476	2025-11-26 21:30:21.476
cmigiqit4001t01pgy6vh81ya	AUTH-SYSTEM.md	\N	cmif15e6700012o7kvzihtgf9/1764192621488-docs/AUTH-SYSTEM.md	text/markdown	8352	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.496	2025-11-26 21:30:21.496
cmigiqitq001v01pgba1j7gn4	AUTHENTIK-DOCKER-SETUP.md	\N	cmif15e6700012o7kvzihtgf9/1764192621510-docs/AUTHENTIK-DOCKER-SETUP.md	text/markdown	5907	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.518	2025-11-26 21:30:21.518
cmigiqiv0001z01pgthkrz0tc	FEATURES-STATUS.md	\N	cmif15e6700012o7kvzihtgf9/1764192621554-docs/FEATURES-STATUS.md	text/markdown	18128	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	cmigj12ml002a01pgbofrcryk	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.564	2025-11-26 22:35:39.458
cmigiqivs002101pgaa0kl2ng	FASE-4-10-IMPLEMENTATION.md	\N	cmif15e6700012o7kvzihtgf9/1764192621582-docs/FASE-4-10-IMPLEMENTATION.md	text/markdown	11175	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	cmigj12ml002a01pgbofrcryk	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.592	2025-11-26 22:35:52.842
cmigiqigx000r01pgz5vw6oc1	01-ANALISI-PAPERMARK.md	\N	cmif15e6700012o7kvzihtgf9/1764192621042-docs/01-ANALISI-PAPERMARK.md	text/markdown	15240	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	cmigj12ml002a01pgbofrcryk	cmigeo2co000d01lhckcm825c	2025-11-26 21:30:21.057	2025-11-26 22:38:10.527
cmigo1sq7000701nnnfw1d040	build.log	\N	cmif15e6700012o7kvzihtgf9/1764201545509-build.log	application/octet-stream	580	1	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	cmigj12ml002a01pgbofrcryk	cmigeo2co000d01lhckcm825c	2025-11-26 23:59:05.645	2025-11-26 23:59:05.645
\.


--
-- Data for Name: folders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.folders (id, name, "teamId", "ownerId", "parentId", "dataRoomId", path, "createdAt", "updatedAt") FROM stdin;
cmigendi9000801lhh6e2w9z8	Risorse Umane	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	\N	/Risorse Umane	2025-11-26 19:35:56.192	2025-11-26 19:35:56.192
cmigj12ml002a01pgbofrcryk	Documenti HR	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	\N	cmigeo2co000d01lhckcm825c	/Documenti HR	2025-11-26 21:38:33.739	2025-11-26 21:38:33.739
\.


--
-- Data for Name: link_allowed_emails; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.link_allowed_emails (id, "linkId", email, "createdAt") FROM stdin;
\.


--
-- Data for Name: links; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.links (id, slug, "documentId", name, description, "createdBy", password, "expiresAt", "allowDownload", "allowNotification", "emailProtected", "emailAuthenticated", "domainSlug", "enableTracking", "enableFeedback", "createdAt", "updatedAt", "isActive") FROM stdin;
cmigdqg3s000w01mm3nyt3ro1	p5_mSIVAt-	cmigdpik0000t01mmcoosjrks	Link-Passaporto	Link al passaporto	cmif15e5u00002o7ka0uxh9ph	\N	\N	t	t	f	f	\N	t	f	2025-11-26 19:10:19.91	2025-11-26 19:10:19.91	t
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_preferences (id, "userId", "emailEnabled", "emailLinkViewed", "emailDocumentShared", "emailTeamInvitation", "emailCommentMention", "emailQAActivity", "inAppEnabled", "desktopEnabled", "digestEnabled", "digestFrequency", "digestTime", "soundEnabled", "createdAt", "updatedAt") FROM stdin;
cmigeuk08000t01lhsbok5he4	cmif15e5u00002o7ka0uxh9ph	t	t	t	t	t	t	t	f	f	daily	09:00	t	2025-11-26 19:41:31.208	2025-11-26 19:41:31.208
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, "userId", type, title, message, read, metadata, "createdAt") FROM stdin;
cmigdqnge001001mm71phnu3t	cmif15e5u00002o7ka0uxh9ph	link_viewed	New Link View	Your link "Link-Passaporto" for document "Vision-sheet.pdf" was viewed	f	{"linkName": "Link-Passaporto", "documentName": "Vision-sheet.pdf"}	2025-11-26 19:10:29.438
cmige59eg000101siyetmipca	cmif15e5u00002o7ka0uxh9ph	link_viewed	New Link View	Your link "Link-Passaporto" for document "Vision-sheet.pdf" was viewed	f	{"linkName": "Link-Passaporto", "documentName": "Vision-sheet.pdf"}	2025-11-26 19:21:51.064
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, name, description, category, "createdAt") FROM stdin;
cmif1fx5g00003f7kvlis9hcj	documents.view	View documents	documents	2025-11-25 20:38:27.214
cmif1fx6n00013f7k2yjmcent	documents.create	Upload new documents	documents	2025-11-25 20:38:27.263
cmif1fx6p00023f7k19ubpi8y	documents.edit	Edit document metadata	documents	2025-11-25 20:38:27.265
cmif1fx6q00033f7kqjq6aiyq	documents.delete	Delete documents	documents	2025-11-25 20:38:27.266
cmif1fx6r00043f7kn918vytu	documents.download	Download documents	documents	2025-11-25 20:38:27.267
cmif1fx6t00053f7k1qbcek1v	folders.view	View folders	folders	2025-11-25 20:38:27.269
cmif1fx6u00063f7kqikaq61i	folders.create	Create new folders	folders	2025-11-25 20:38:27.27
cmif1fx6w00073f7kvazokma9	folders.edit	Edit folder details	folders	2025-11-25 20:38:27.272
cmif1fx6x00083f7kfrzdu0qm	folders.delete	Delete folders	folders	2025-11-25 20:38:27.273
cmif1fx6z00093f7kmav74zr2	links.view	View shared links	links	2025-11-25 20:38:27.275
cmif1fx70000a3f7katumdhb2	links.create	Create new shared links	links	2025-11-25 20:38:27.276
cmif1fx71000b3f7k3bj55l78	links.edit	Edit link settings	links	2025-11-25 20:38:27.277
cmif1fx73000c3f7kuvgm3fea	links.delete	Delete shared links	links	2025-11-25 20:38:27.279
cmif1fx74000d3f7k2pju1mjs	datarooms.view	View data rooms	datarooms	2025-11-25 20:38:27.28
cmif1fx75000e3f7k8g5xozrd	datarooms.create	Create new data rooms	datarooms	2025-11-25 20:38:27.281
cmif1fx77000f3f7k26o2zmiw	datarooms.edit	Edit data room settings	datarooms	2025-11-25 20:38:27.283
cmif1fx79000g3f7k8ow7jw9s	datarooms.delete	Delete data rooms	datarooms	2025-11-25 20:38:27.285
cmif1fx7a000h3f7kxu44kehg	teams.view_members	View team members	teams	2025-11-25 20:38:27.286
cmif1fx7b000i3f7kpefzaxp5	teams.invite	Invite new team members	teams	2025-11-25 20:38:27.287
cmif1fx7d000j3f7k7k7o1vhk	teams.remove_members	Remove team members	teams	2025-11-25 20:38:27.289
cmif1fx7e000k3f7kyj0splbx	teams.manage_roles	Change member roles and permissions	teams	2025-11-25 20:38:27.29
cmif1fx7g000l3f7k4l2idtu8	settings.view	View team settings	settings	2025-11-25 20:38:27.292
cmif1fx7h000m3f7kj20f682p	settings.edit	Edit team settings	settings	2025-11-25 20:38:27.293
cmif1fx7i000n3f7k3p9tvcp9	settings.billing	Manage billing and subscriptions	settings	2025-11-25 20:38:27.294
\.


--
-- Data for Name: qa_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.qa_categories (id, "dataRoomId", name, description, color, "order", "createdAt") FROM stdin;
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.questions (id, "dataRoomId", "categoryId", "questionText", status, priority, "askedById", "assignedToId", "bidderGroup", "isPrivate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: recovery_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recovery_codes (id, code, used, "usedAt", "userId", "createdAt") FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (id, role, "permissionId", granted, "createdAt") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, "sessionToken", "userId", expires, browser, "createdAt", device, "ipAddress", "lastActivity", location, os, "userAgent") FROM stdin;
cmif1ro8b000001p9tnp3z67l	f594406335344cd1badbc47304f361311927ebe1995ac71537ec048130400e22	cmif15e5u00002o7ka0uxh9ph	2025-12-02 20:47:35.516	\N	2025-11-25 20:47:35.53	\N	\N	2025-11-25 20:47:35.53	\N	\N	\N
cmif1u9lh000001p9z18al8j9	2966ab030178690210fcf359ce099dc3020b2cc9dce068e6b71a2a5d375cbd6a	cmif15e5u00002o7ka0uxh9ph	2025-12-02 20:49:36.526	\N	2025-11-25 20:49:36.533	\N	\N	2025-11-25 20:49:36.533	\N	\N	\N
cmif1unws000201p9h38p11a0	f6be22d3e2cf97a066be1b0d1a1698706a3e48f86427c1d9bf63acaa58cd9310	cmif15e5u00002o7ka0uxh9ph	2025-12-02 20:49:55.083	\N	2025-11-25 20:49:55.084	\N	\N	2025-11-25 20:49:55.084	\N	\N	\N
cmif1v3w8000401p9zsgahsnd	acfc4d96fb66e6d765a91b34a15242141ab178d6282b9b2af194ecd7675c793f	cmif15e5u00002o7ka0uxh9ph	2025-12-02 20:50:15.798	\N	2025-11-25 20:50:15.8	\N	\N	2025-11-25 20:50:15.8	\N	\N	\N
cmif1z66m000601p9l57ppoh7	f7d51ca4affce7bfe95d27cd03abc7966992c43d9183a8e269224653e39ef822	cmif15e5u00002o7ka0uxh9ph	2025-12-02 20:53:25.388	\N	2025-11-25 20:53:25.39	\N	\N	2025-11-25 20:53:25.39	\N	\N	\N
cmif24rv6000801p9c46v2xib	6a63567389b54bfcda1cfefa24a977198cafbce6acea33ce6aa5acd2e03a4306	cmif15e8h00032o7kgm3bctkd	2025-12-02 20:57:46.768	\N	2025-11-25 20:57:46.77	\N	\N	2025-11-25 20:57:46.77	\N	\N	\N
cmif273m7000a01p9u5o44bia	2ab21a15312ae51fadfb831e686a98d02ad6eb4cb95e267b96099e4e42cd829e	cmif15e8h00032o7kgm3bctkd	2025-12-02 20:59:35.309	\N	2025-11-25 20:59:35.311	\N	\N	2025-11-25 20:59:35.311	\N	\N	\N
cmif2c8sy000g01p9s50dqp3n	0c7fdf8aca90d3b74f6ee776dacd1fa12df4a48d2b4d301f949a2cc312252a03	cmif2bv0y000c01p9w5ocbl1d	2025-12-02 21:03:35.314	\N	2025-11-25 21:03:35.314	\N	\N	2025-11-25 21:03:35.314	\N	\N	\N
cmif2vnuc000i01p99idsl9qc	3f456c35b2ac9b91189ed9bb2705594aaa1cb7d840ded1641987b0f97db98d7a	cmif15e5u00002o7ka0uxh9ph	2025-12-02 21:18:41.267	\N	2025-11-25 21:18:41.268	\N	\N	2025-11-25 21:18:41.268	\N	\N	\N
cmif3icaf000k01p9upwgxqbc	d829067aa00f383b4949e8cd92ae4f67a35fb711eb831d54ef85abe379eaca9b	cmif15e5u00002o7ka0uxh9ph	2025-12-02 21:36:19.382	\N	2025-11-25 21:36:19.383	\N	\N	2025-11-25 21:36:19.383	\N	\N	\N
cmifnkxis000m01p94e4p56kd	5498efa7fddff84012c09a5030af70043b5da34a86cc72ac9dc410d8b5fe183b	cmif15e5u00002o7ka0uxh9ph	2025-12-03 06:58:12.53	\N	2025-11-26 06:58:12.532	\N	\N	2025-11-26 06:58:12.532	\N	\N	\N
cmifnpnbe000001p1muiklcqj	edcaa41d480d1241a16df6d618cadc94e16bc31b7115a6d1574c345a12eb2a2f	cmif15e5u00002o7ka0uxh9ph	2025-12-03 07:01:52.579	\N	2025-11-26 07:01:52.586	\N	\N	2025-11-26 07:01:52.586	\N	\N	\N
cmifo006s000001p1qa2auwsm	a6efa88d696d14a53aaf61ec5f67935c8b17529f6683de5669f53d7be69d7794	cmif15e5u00002o7ka0uxh9ph	2025-12-03 07:09:55.822	\N	2025-11-26 07:09:55.828	\N	\N	2025-11-26 07:09:55.828	\N	\N	\N
cmifoeidr000001o5kvdeol9d	6ac5caafa6041190db2be318cc711b4cd6091409294a948d3771df01db3af447	cmif15e5u00002o7ka0uxh9ph	2025-12-03 07:21:12.584	\N	2025-11-26 07:21:12.591	\N	\N	2025-11-26 07:21:12.591	\N	\N	\N
cmifoezgy000201o53sf4wuq3	de600c8c6414e79f37b2518b874b1c56f76c4b26421e3ffabebfae2d87a39ab6	cmif15e5u00002o7ka0uxh9ph	2025-12-03 07:21:34.737	\N	2025-11-26 07:21:34.738	\N	\N	2025-11-26 07:21:34.738	\N	\N	\N
cmifooaph000001mnwufhuc4k	94df7ad95ba29bb2d7389d6a89955e1aed1a8b6aa033819bd38d13d6ac394a5e	cmif15e5u00002o7ka0uxh9ph	2025-12-03 07:28:49.199	\N	2025-11-26 07:28:49.205	\N	\N	2025-11-26 07:28:49.205	\N	\N	\N
cmifoou9r000201mnlk4i848m	05ffc5d812d72b4576bdd32e1e594e42bf63ca36c36f5fbf1f699e3cd5394ecf	cmif15e5u00002o7ka0uxh9ph	2025-12-03 07:29:14.557	\N	2025-11-26 07:29:14.559	\N	\N	2025-11-26 07:29:14.559	\N	\N	\N
cmig1gdgb000401mnausjr8gs	43351bd111d2a393f6050516aa5f1b5df67ff954310a975baa5b241db3d7d6dc	cmif15e5u00002o7ka0uxh9ph	2025-12-03 13:26:34.516	\N	2025-11-26 13:26:34.523	\N	\N	2025-11-26 13:26:34.523	\N	\N	\N
cmig1izvz000c01mntrr7qdr3	766ec38021f2186bda643b5d1439e7614a5b732474341a54e9e58c271a68e5e3	cmif15e5u00002o7ka0uxh9ph	2025-12-03 13:28:36.909	\N	2025-11-26 13:28:36.911	\N	\N	2025-11-26 13:28:36.911	\N	\N	\N
cmig1r25x000001pgi89zb7dl	8e70f7241fb6d45386624bac11811775e598863c8dfe7f18d6e3b3a4647e4546	cmif15e5u00002o7ka0uxh9ph	2025-12-03 13:34:53.101	\N	2025-11-26 13:34:53.109	\N	\N	2025-11-26 13:34:53.109	\N	\N	\N
cmig20zm3000001s5lgldd24d	24364d694620d863b846ad4b97c3f636868c4a931cb0f11bd5ea04ea03f683a1	cmif15e5u00002o7ka0uxh9ph	2025-12-03 13:42:36.351	\N	2025-11-26 13:42:36.363	\N	\N	2025-11-26 13:42:36.363	\N	\N	\N
cmig2hcsc000001o169nez7ik	ff4f5486da19e2d2babad1c81de3de8ef3e48c23995722454fd031e3cb1d5e8f	cmif15e5u00002o7ka0uxh9ph	2025-12-03 13:55:19.922	\N	2025-11-26 13:55:19.932	\N	\N	2025-11-26 13:55:19.932	\N	\N	\N
cmigaz1te000001potdcocn9w	020f9c279ef899293b351270b61d6f48079cf54551d59b1b8a3d87d1489bbd10	cmif15e5u00002o7ka0uxh9ph	2025-12-03 17:53:02.443	\N	2025-11-26 17:53:02.449	\N	\N	2025-11-26 17:53:02.449	\N	\N	\N
cmigr8isg000001mrkmrq8xcd	9b182517dcfa18367bc0ca8b78b5d3953cc8dbe645bc8f6ee07baf0a285495c2	cmif15e5u00002o7ka0uxh9ph	2025-12-04 01:28:18.202	\N	2025-11-27 01:28:18.208	\N	\N	2025-11-27 01:28:18.208	\N	\N	\N
\.


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tags (id, "teamId", name, color, "createdAt") FROM stdin;
\.


--
-- Data for Name: team_invitations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.team_invitations (id, "teamId", email, role, token, expires, "createdAt") FROM stdin;
cmigchda0000301qxyrq6qma6	cmif15e6700012o7kvzihtgf9	test.invite@example.com	member	0cf504879a063c6bf1e65801f43ffcd308ca9255043644853e0a906199080709	2025-12-03 18:35:16.725	2025-11-26 18:35:16.728
cmigcs5c1000301lwpmnx91if	cmif15e6700012o7kvzihtgf9	pending.test@example.com	viewer	2697f1962e1bde62a3fdac9b6e1f4674e8c9bf3c4a620729e347bfb486fb6119	2025-12-03 18:43:39.643	2025-11-26 18:43:39.649
\.


--
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.team_members (id, "teamId", "userId", role, "createdAt", "updatedAt") FROM stdin;
cmif15e6900022o7khhd4t0x7	cmif15e6700012o7kvzihtgf9	cmif15e5u00002o7ka0uxh9ph	owner	2025-11-25 20:30:16.062	2025-11-25 20:30:16.062
cmif15e8l00052o7kyvkf8zbh	cmif15e8l00042o7kd60s1d58	cmif15e8h00032o7kgm3bctkd	admin	2025-11-25 20:30:16.148	2025-11-25 20:30:16.148
cmif15eb000082o7kjm9r1f5c	cmif15eay00072o7kie9bm22j	cmif15eaq00062o7ksyd3dpvh	member	2025-11-25 20:30:16.232	2025-11-25 20:30:16.232
cmif15edd000b2o7khp6rulhy	cmif15edc000a2o7krma5q523	cmif15ed700092o7ke1f5xse6	viewer	2025-11-25 20:30:16.319	2025-11-25 20:30:16.319
cmif2bv1c000e01p9p7550gc3	cmif2bv1b000d01p9pjgurcbv	cmif2bv0y000c01p9w5ocbl1d	OWNER	2025-11-25 21:03:17.47	2025-11-25 21:03:17.47
cmig1grl3000801mnq1bdleih	cmig1grl1000701mngzj93csv	cmig1grki000601mnjpxn2k5f	OWNER	2025-11-26 13:26:52.835	2025-11-26 13:26:52.835
cmigdcvrp000601mmzhdvfqud	cmigdcvrn000501mm5iej1mvy	cmif15e5u00002o7ka0uxh9ph	owner	2025-11-26 18:59:47.025	2025-11-26 18:59:47.025
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teams (id, name, slug, logo, plan, "createdAt", "updatedAt", "accentColor", "brandColor", "customDomain", "watermarkEnabled", "watermarkOpacity", "watermarkText") FROM stdin;
cmif15e6700012o7kvzihtgf9	Admin Team	admin-team	\N	enterprise	2025-11-25 20:30:16.062	2025-11-25 20:30:16.062	\N	\N	\N	t	0.3	\N
cmif15e8l00042o7kd60s1d58	Manager Team	manager-team	\N	professional	2025-11-25 20:30:16.148	2025-11-25 20:30:16.148	\N	\N	\N	t	0.3	\N
cmif15eay00072o7kie9bm22j	User Team	user-team	\N	free	2025-11-25 20:30:16.232	2025-11-25 20:30:16.232	\N	\N	\N	t	0.3	\N
cmif15edc000a2o7krma5q523	Viewer Team	viewer-team	\N	free	2025-11-25 20:30:16.319	2025-11-25 20:30:16.319	\N	\N	\N	t	0.3	\N
cmif2bv1b000d01p9pjgurcbv	Fra Gll's Workspace	fra-gll-cmif2bv0	\N	free	2025-11-25 21:03:17.47	2025-11-25 21:03:17.47	\N	\N	\N	t	0.3	\N
cmig1grl1000701mngzj93csv	Francesco's Workspace	francesco-cmig1grk	\N	free	2025-11-26 13:26:52.835	2025-11-26 13:26:52.835	\N	\N	\N	t	0.3	\N
cmigdcvrn000501mm5iej1mvy	Beta Team	beta-team	\N	free	2025-11-26 18:59:47.025	2025-11-26 18:59:47.025	\N	\N	\N	t	0.3	\N
\.


--
-- Data for Name: user_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_permissions (id, "userId", "teamId", "permissionId", granted, "createdAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, "emailVerified", image, "createdAt", "updatedAt", password, "passwordResetExpiry", "passwordResetToken", "twoFactorEnabled", "twoFactorSecret", "isActive") FROM stdin;
cmif15e8h00032o7kgm3bctkd	Manager User	manager@dataroom.com	2025-11-25 20:30:16.144	\N	2025-11-25 20:30:16.145	2025-11-25 20:30:16.145	$2b$10$V5SeIRkR5/Uc6lG/xklwXOVYZ12wIBsPJ1AgNaG9ppPlmvA3EhFYq	\N	\N	f	\N	t
cmif15eaq00062o7ksyd3dpvh	Regular User	user@dataroom.com	2025-11-25 20:30:16.225	\N	2025-11-25 20:30:16.226	2025-11-25 20:30:16.226	$2b$10$5JP6KyCb2ntEFyBWCkBYpOgLTTMbpU7zfFOwOLCSabZ7eGCYbJTgG	\N	\N	f	\N	t
cmif15ed700092o7ke1f5xse6	Viewer User	viewer@dataroom.com	2025-11-25 20:30:16.314	\N	2025-11-25 20:30:16.315	2025-11-25 20:30:16.315	$2b$10$cqag.mAcOxDhJas6y2ShOOnV1KSjpqKUkn5.PFZcfCCE0jzj0Tz/S	\N	\N	f	\N	t
cmif15e5u00002o7ka0uxh9ph	Admin User	admin@dataroom.com	2025-11-25 20:30:16.045	\N	2025-11-25 20:30:16.05	2025-11-25 20:53:44.065	$2b$10$2dRwN8LPC9ZCr/HsLKRWQedPZMtiWw8.j/dj7jsITCcgvCfPTHw5G	2025-11-25 21:53:44.059	557cc3ee2a4c8fad6f7a0ea350cea9ef5b7c8e108f0e9f1af956e2b2441185a8	f	\N	t
cmif2bv0y000c01p9w5ocbl1d	Fra Gll	fra@gal.it	2025-11-25 21:03:17.456	\N	2025-11-25 21:03:17.458	2025-11-25 21:03:17.458	$2b$12$dNGKzbfpFHfVjPi6Kti1Pe/HxFa.NesMZL2cUhjZzX2vmBHBZz2L.	\N	\N	f	\N	t
cmig1grki000601mnjpxn2k5f	Francesco	f.gallo@outlook.com	2025-11-26 13:26:52.816	\N	2025-11-26 13:26:52.818	2025-11-26 13:26:52.818	$2b$12$kLla4xnFGFggG7OdNCLnTuf/hVJmbWy6Mq30Nsl9EXR20Auk9M4Ha	\N	\N	f	\N	t
\.


--
-- Data for Name: verification_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.verification_tokens (identifier, token, expires) FROM stdin;
\.


--
-- Data for Name: views; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.views (id, "linkId", "documentId", "viewerEmail", "viewerName", verified, "ipAddress", "userAgent", country, city, "viewedAt", duration, "completionRate", "downloadedAt") FROM stdin;
cmigdqng3000z01mmt48gjpvr	cmigdqg3s000w01mm3nyt3ro1	cmigdpik0000t01mmcoosjrks	\N	\N	f	142.250.180.163	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-11-26 19:10:29.427	\N	\N	\N
cmige59e3000001si3hn22v1t	cmigdqg3s000w01mm3nyt3ro1	cmigdpik0000t01mmcoosjrks	\N	\N	f	142.250.180.163	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	\N	2025-11-26 19:21:51.051	\N	\N	\N
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: answers answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT answers_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: comment_mentions comment_mentions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_mentions
    ADD CONSTRAINT comment_mentions_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: data_room_permissions data_room_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_room_permissions
    ADD CONSTRAINT data_room_permissions_pkey PRIMARY KEY (id);


--
-- Name: data_rooms data_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_rooms
    ADD CONSTRAINT data_rooms_pkey PRIMARY KEY (id);


--
-- Name: document_metadata document_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_metadata
    ADD CONSTRAINT document_metadata_pkey PRIMARY KEY (id);


--
-- Name: document_tags document_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_tags
    ADD CONSTRAINT document_tags_pkey PRIMARY KEY (id);


--
-- Name: document_versions document_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: folders folders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_pkey PRIMARY KEY (id);


--
-- Name: link_allowed_emails link_allowed_emails_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.link_allowed_emails
    ADD CONSTRAINT link_allowed_emails_pkey PRIMARY KEY (id);


--
-- Name: links links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.links
    ADD CONSTRAINT links_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: qa_categories qa_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qa_categories
    ADD CONSTRAINT qa_categories_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: recovery_codes recovery_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recovery_codes
    ADD CONSTRAINT recovery_codes_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: team_invitations team_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_invitations
    ADD CONSTRAINT team_invitations_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: views views_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.views
    ADD CONSTRAINT views_pkey PRIMARY KEY (id);


--
-- Name: accounts_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON public.accounts USING btree (provider, "providerAccountId");


--
-- Name: answers_answeredBy_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "answers_answeredBy_idx" ON public.answers USING btree ("answeredBy");


--
-- Name: answers_questionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "answers_questionId_idx" ON public.answers USING btree ("questionId");


--
-- Name: audit_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_logs_createdAt_idx" ON public.audit_logs USING btree ("createdAt");


--
-- Name: audit_logs_resourceType_resourceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_logs_resourceType_resourceId_idx" ON public.audit_logs USING btree ("resourceType", "resourceId");


--
-- Name: audit_logs_teamId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_logs_teamId_idx" ON public.audit_logs USING btree ("teamId");


--
-- Name: audit_logs_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_logs_userId_idx" ON public.audit_logs USING btree ("userId");


--
-- Name: comment_mentions_commentId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "comment_mentions_commentId_userId_key" ON public.comment_mentions USING btree ("commentId", "userId");


--
-- Name: comment_mentions_userId_read_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "comment_mentions_userId_read_idx" ON public.comment_mentions USING btree ("userId", read);


--
-- Name: comments_documentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "comments_documentId_idx" ON public.comments USING btree ("documentId");


--
-- Name: comments_parentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "comments_parentId_idx" ON public.comments USING btree ("parentId");


--
-- Name: comments_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "comments_userId_idx" ON public.comments USING btree ("userId");


--
-- Name: data_room_permissions_dataRoomId_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "data_room_permissions_dataRoomId_email_key" ON public.data_room_permissions USING btree ("dataRoomId", email);


--
-- Name: data_rooms_teamId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "data_rooms_teamId_idx" ON public.data_rooms USING btree ("teamId");


--
-- Name: document_metadata_documentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "document_metadata_documentId_idx" ON public.document_metadata USING btree ("documentId");


--
-- Name: document_metadata_documentId_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "document_metadata_documentId_key_key" ON public.document_metadata USING btree ("documentId", key);


--
-- Name: document_metadata_key_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX document_metadata_key_idx ON public.document_metadata USING btree (key);


--
-- Name: document_tags_documentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "document_tags_documentId_idx" ON public.document_tags USING btree ("documentId");


--
-- Name: document_tags_documentId_tagId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "document_tags_documentId_tagId_key" ON public.document_tags USING btree ("documentId", "tagId");


--
-- Name: document_tags_tagId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "document_tags_tagId_idx" ON public.document_tags USING btree ("tagId");


--
-- Name: document_versions_createdById_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "document_versions_createdById_idx" ON public.document_versions USING btree ("createdById");


--
-- Name: document_versions_documentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "document_versions_documentId_idx" ON public.document_versions USING btree ("documentId");


--
-- Name: document_versions_documentId_versionNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "document_versions_documentId_versionNumber_key" ON public.document_versions USING btree ("documentId", "versionNumber");


--
-- Name: documents_dataRoomId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "documents_dataRoomId_idx" ON public.documents USING btree ("dataRoomId");


--
-- Name: documents_folderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "documents_folderId_idx" ON public.documents USING btree ("folderId");


--
-- Name: documents_ownerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "documents_ownerId_idx" ON public.documents USING btree ("ownerId");


--
-- Name: documents_teamId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "documents_teamId_idx" ON public.documents USING btree ("teamId");


--
-- Name: folders_dataRoomId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "folders_dataRoomId_idx" ON public.folders USING btree ("dataRoomId");


--
-- Name: folders_parentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "folders_parentId_idx" ON public.folders USING btree ("parentId");


--
-- Name: folders_teamId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "folders_teamId_idx" ON public.folders USING btree ("teamId");


--
-- Name: link_allowed_emails_linkId_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "link_allowed_emails_linkId_email_key" ON public.link_allowed_emails USING btree ("linkId", email);


--
-- Name: links_documentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "links_documentId_idx" ON public.links USING btree ("documentId");


--
-- Name: links_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX links_slug_idx ON public.links USING btree (slug);


--
-- Name: links_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX links_slug_key ON public.links USING btree (slug);


--
-- Name: notification_preferences_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notification_preferences_userId_idx" ON public.notification_preferences USING btree ("userId");


--
-- Name: notification_preferences_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "notification_preferences_userId_key" ON public.notification_preferences USING btree ("userId");


--
-- Name: notifications_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notifications_createdAt_idx" ON public.notifications USING btree ("createdAt");


--
-- Name: notifications_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notifications_userId_idx" ON public.notifications USING btree ("userId");


--
-- Name: permissions_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX permissions_name_key ON public.permissions USING btree (name);


--
-- Name: qa_categories_dataRoomId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "qa_categories_dataRoomId_idx" ON public.qa_categories USING btree ("dataRoomId");


--
-- Name: qa_categories_dataRoomId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "qa_categories_dataRoomId_name_key" ON public.qa_categories USING btree ("dataRoomId", name);


--
-- Name: questions_askedById_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "questions_askedById_idx" ON public.questions USING btree ("askedById");


--
-- Name: questions_assignedToId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "questions_assignedToId_idx" ON public.questions USING btree ("assignedToId");


--
-- Name: questions_bidderGroup_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "questions_bidderGroup_idx" ON public.questions USING btree ("bidderGroup");


--
-- Name: questions_dataRoomId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "questions_dataRoomId_idx" ON public.questions USING btree ("dataRoomId");


--
-- Name: questions_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX questions_status_idx ON public.questions USING btree (status);


--
-- Name: recovery_codes_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX recovery_codes_code_key ON public.recovery_codes USING btree (code);


--
-- Name: recovery_codes_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "recovery_codes_userId_idx" ON public.recovery_codes USING btree ("userId");


--
-- Name: role_permissions_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX role_permissions_role_idx ON public.role_permissions USING btree (role);


--
-- Name: role_permissions_role_permissionId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "role_permissions_role_permissionId_key" ON public.role_permissions USING btree (role, "permissionId");


--
-- Name: sessions_sessionToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "sessions_sessionToken_key" ON public.sessions USING btree ("sessionToken");


--
-- Name: sessions_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sessions_userId_idx" ON public.sessions USING btree ("userId");


--
-- Name: tags_teamId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "tags_teamId_idx" ON public.tags USING btree ("teamId");


--
-- Name: tags_teamId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "tags_teamId_name_key" ON public.tags USING btree ("teamId", name);


--
-- Name: team_invitations_teamId_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "team_invitations_teamId_email_key" ON public.team_invitations USING btree ("teamId", email);


--
-- Name: team_invitations_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX team_invitations_token_key ON public.team_invitations USING btree (token);


--
-- Name: team_members_teamId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "team_members_teamId_userId_key" ON public.team_members USING btree ("teamId", "userId");


--
-- Name: teams_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX teams_slug_key ON public.teams USING btree (slug);


--
-- Name: user_permissions_userId_teamId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "user_permissions_userId_teamId_idx" ON public.user_permissions USING btree ("userId", "teamId");


--
-- Name: user_permissions_userId_teamId_permissionId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "user_permissions_userId_teamId_permissionId_key" ON public.user_permissions USING btree ("userId", "teamId", "permissionId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "users_isActive_idx" ON public.users USING btree ("isActive");


--
-- Name: users_passwordResetToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "users_passwordResetToken_key" ON public.users USING btree ("passwordResetToken");


--
-- Name: verification_tokens_identifier_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX verification_tokens_identifier_token_key ON public.verification_tokens USING btree (identifier, token);


--
-- Name: verification_tokens_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX verification_tokens_token_key ON public.verification_tokens USING btree (token);


--
-- Name: views_documentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "views_documentId_idx" ON public.views USING btree ("documentId");


--
-- Name: views_linkId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "views_linkId_idx" ON public.views USING btree ("linkId");


--
-- Name: views_viewedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "views_viewedAt_idx" ON public.views USING btree ("viewedAt");


--
-- Name: accounts accounts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: answers answers_answeredBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT "answers_answeredBy_fkey" FOREIGN KEY ("answeredBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: answers answers_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT "answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public.questions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: comment_mentions comment_mentions_commentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_mentions
    ADD CONSTRAINT "comment_mentions_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES public.comments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comment_mentions comment_mentions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comment_mentions
    ADD CONSTRAINT "comment_mentions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_documentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.comments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: data_room_permissions data_room_permissions_dataRoomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_room_permissions
    ADD CONSTRAINT "data_room_permissions_dataRoomId_fkey" FOREIGN KEY ("dataRoomId") REFERENCES public.data_rooms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: data_rooms data_rooms_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_rooms
    ADD CONSTRAINT "data_rooms_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_metadata document_metadata_documentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_metadata
    ADD CONSTRAINT "document_metadata_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_tags document_tags_documentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_tags
    ADD CONSTRAINT "document_tags_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_tags document_tags_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_tags
    ADD CONSTRAINT "document_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public.tags(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_versions document_versions_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT "document_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_versions document_versions_documentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT "document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documents documents_dataRoomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_dataRoomId_fkey" FOREIGN KEY ("dataRoomId") REFERENCES public.data_rooms(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_folderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES public.folders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documents documents_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: folders folders_dataRoomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT "folders_dataRoomId_fkey" FOREIGN KEY ("dataRoomId") REFERENCES public.data_rooms(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: folders folders_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT "folders_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: folders folders_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT "folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.folders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: folders folders_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT "folders_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: link_allowed_emails link_allowed_emails_linkId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.link_allowed_emails
    ADD CONSTRAINT "link_allowed_emails_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES public.links(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: links links_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.links
    ADD CONSTRAINT "links_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: links links_documentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.links
    ADD CONSTRAINT "links_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notification_preferences notification_preferences_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: qa_categories qa_categories_dataRoomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qa_categories
    ADD CONSTRAINT "qa_categories_dataRoomId_fkey" FOREIGN KEY ("dataRoomId") REFERENCES public.data_rooms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: questions questions_askedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "questions_askedById_fkey" FOREIGN KEY ("askedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: questions questions_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "questions_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: questions questions_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "questions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.qa_categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: questions questions_dataRoomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "questions_dataRoomId_fkey" FOREIGN KEY ("dataRoomId") REFERENCES public.data_rooms(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: recovery_codes recovery_codes_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recovery_codes
    ADD CONSTRAINT "recovery_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tags tags_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT "tags_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: team_invitations team_invitations_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_invitations
    ADD CONSTRAINT "team_invitations_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: team_members team_members_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: team_members team_members_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_permissions user_permissions_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: views views_documentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.views
    ADD CONSTRAINT "views_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: views views_linkId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.views
    ADD CONSTRAINT "views_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES public.links(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: views views_viewerEmail_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.views
    ADD CONSTRAINT "views_viewerEmail_fkey" FOREIGN KEY ("viewerEmail") REFERENCES public.users(email) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict juvFWMJYPQE1u8odlxtfNjLtjpedIaVMJ5SXszyEdjhnbpBLhpn0Qor8iazGDHH

