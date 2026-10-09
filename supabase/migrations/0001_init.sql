-- StudyOS core schema
-- Retrieval strategy for MVP: Postgres full-text search (tsvector/ts_rank) over
-- material chunks, scoped per material/course. This grounds AI chat and generation
-- in the student's own content without requiring a separate embeddings provider.
-- Upgrade path: add a `embedding vector(n)` column + pgvector index later without
-- touching the rest of the schema.

create extension if not exists "pgcrypto";

-- ============================================================================
-- profiles
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- auto-create a profile row when a new auth user signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- courses
-- ============================================================================
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  subject text,
  color text not null default 'violet',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index courses_user_id_idx on public.courses(user_id);

alter table public.courses enable row level security;
create policy "courses_all_own" on public.courses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- topics (per course; AI-inferred from materials, or created on demand)
-- ============================================================================
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (course_id, name)
);

create index topics_course_id_idx on public.topics(course_id);

alter table public.topics enable row level security;
create policy "topics_all_own" on public.topics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- materials
-- ============================================================================
create type public.material_type as enum ('pdf', 'text');
create type public.material_status as enum ('pending', 'processing', 'ready', 'error');

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type public.material_type not null,
  storage_path text,
  raw_text text,
  status public.material_status not null default 'pending',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index materials_course_id_idx on public.materials(course_id);
create index materials_user_id_idx on public.materials(user_id);

alter table public.materials enable row level security;
create policy "materials_all_own" on public.materials
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- material_chunks (full-text searchable segments of a material)
-- ============================================================================
create table public.material_chunks (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  topic_id uuid references public.topics(id) on delete set null,
  content_tsv tsvector generated always as (to_tsvector('english', content)) stored,
  created_at timestamptz not null default now()
);

create index material_chunks_material_id_idx on public.material_chunks(material_id);
create index material_chunks_course_id_idx on public.material_chunks(course_id);
create index material_chunks_tsv_idx on public.material_chunks using gin(content_tsv);

alter table public.material_chunks enable row level security;
create policy "material_chunks_all_own" on public.material_chunks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- chat_messages (AI study assistant, scoped to a course and optionally a material)
-- ============================================================================
create type public.chat_role as enum ('user', 'assistant');

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  material_id uuid references public.materials(id) on delete cascade,
  role public.chat_role not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index chat_messages_material_id_idx on public.chat_messages(material_id);
create index chat_messages_course_id_idx on public.chat_messages(course_id);

alter table public.chat_messages enable row level security;
create policy "chat_messages_all_own" on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- flashcards
-- ============================================================================
create type public.difficulty as enum ('easy', 'medium', 'hard');

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  question text not null,
  answer text not null,
  difficulty public.difficulty not null default 'medium',
  created_at timestamptz not null default now()
);

create index flashcards_material_id_idx on public.flashcards(material_id);
create index flashcards_course_id_idx on public.flashcards(course_id);

alter table public.flashcards enable row level security;
create policy "flashcards_all_own" on public.flashcards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  known boolean not null,
  reviewed_at timestamptz not null default now()
);

create index flashcard_reviews_flashcard_id_idx on public.flashcard_reviews(flashcard_id);
create index flashcard_reviews_user_id_idx on public.flashcard_reviews(user_id);

alter table public.flashcard_reviews enable row level security;
create policy "flashcard_reviews_all_own" on public.flashcard_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- quizzes
-- ============================================================================
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  material_id uuid references public.materials(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  question text not null,
  choices jsonb not null,
  correct_index int not null,
  explanation text,
  order_index int not null default 0
);

create index quiz_questions_quiz_id_idx on public.quiz_questions(quiz_id);

alter table public.quizzes enable row level security;
create policy "quizzes_all_own" on public.quizzes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.quiz_questions enable row level security;
create policy "quiz_questions_via_quiz" on public.quiz_questions
  for all using (
    exists (select 1 from public.quizzes q where q.id = quiz_id and q.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.quizzes q where q.id = quiz_id and q.user_id = auth.uid())
  );

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score int not null default 0,
  total int not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index quiz_attempts_user_id_idx on public.quiz_attempts(user_id);
create index quiz_attempts_course_id_idx on public.quiz_attempts(course_id);

alter table public.quiz_attempts enable row level security;
create policy "quiz_attempts_all_own" on public.quiz_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  selected_index int,
  is_correct boolean not null,
  answered_at timestamptz not null default now()
);

create index quiz_answers_attempt_id_idx on public.quiz_answers(attempt_id);
create index quiz_answers_user_id_topic_idx on public.quiz_answers(user_id, topic_id);

alter table public.quiz_answers enable row level security;
create policy "quiz_answers_all_own" on public.quiz_answers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- practice sessions (targeted at a single weak topic)
-- ============================================================================
create table public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score int not null default 0,
  total int not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index practice_sessions_user_topic_idx on public.practice_sessions(user_id, topic_id);

alter table public.practice_sessions enable row level security;
create policy "practice_sessions_all_own" on public.practice_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.practice_questions (
  id uuid primary key default gen_random_uuid(),
  practice_session_id uuid not null references public.practice_sessions(id) on delete cascade,
  question text not null,
  choices jsonb not null,
  correct_index int not null,
  explanation text,
  selected_index int,
  is_correct boolean,
  order_index int not null default 0
);

create index practice_questions_session_idx on public.practice_questions(practice_session_id);

alter table public.practice_questions enable row level security;
create policy "practice_questions_via_session" on public.practice_questions
  for all using (
    exists (select 1 from public.practice_sessions p where p.id = practice_session_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.practice_sessions p where p.id = practice_session_id and p.user_id = auth.uid())
  );

-- ============================================================================
-- topic_mastery (cached rollup, recomputed after each attempt)
-- ============================================================================
create table public.topic_mastery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  mastery numeric not null default 0,
  attempts_count int not null default 0,
  last_attempt_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, topic_id)
);

create index topic_mastery_user_course_idx on public.topic_mastery(user_id, course_id);

alter table public.topic_mastery enable row level security;
create policy "topic_mastery_all_own" on public.topic_mastery
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- full-text retrieval RPCs (power the "Ask AI" grounding and practice scoping)
-- ============================================================================
create function public.search_material_chunks(
  p_material_id uuid,
  p_query text,
  p_limit int default 6
)
returns table (
  id uuid,
  chunk_index int,
  content text,
  topic_id uuid,
  rank real
)
language sql
security invoker
stable
as $$
  select c.id, c.chunk_index, c.content, c.topic_id,
         ts_rank(c.content_tsv, websearch_to_tsquery('english', p_query)) as rank
  from public.material_chunks c
  where c.material_id = p_material_id
    and c.content_tsv @@ websearch_to_tsquery('english', p_query)
  order by rank desc
  limit p_limit;
$$;

create function public.search_course_chunks(
  p_course_id uuid,
  p_query text,
  p_limit int default 6
)
returns table (
  id uuid,
  material_id uuid,
  chunk_index int,
  content text,
  topic_id uuid,
  rank real
)
language sql
security invoker
stable
as $$
  select c.id, c.material_id, c.chunk_index, c.content, c.topic_id,
         ts_rank(c.content_tsv, websearch_to_tsquery('english', p_query)) as rank
  from public.material_chunks c
  where c.course_id = p_course_id
    and c.content_tsv @@ websearch_to_tsquery('english', p_query)
  order by rank desc
  limit p_limit;
$$;

create function public.chunks_for_topic(
  p_topic_id uuid,
  p_limit int default 8
)
returns table (
  id uuid,
  material_id uuid,
  content text
)
language sql
security invoker
stable
as $$
  select c.id, c.material_id, c.content
  from public.material_chunks c
  where c.topic_id = p_topic_id
  order by c.created_at
  limit p_limit;
$$;
