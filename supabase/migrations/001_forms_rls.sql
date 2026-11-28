-- Миграция для сервиса Forms (nmchv/forms).
-- Назначение: включить RLS на пользовательских таблицах и оставить только политики
-- чтения собственных записей авторизованными пользователями.
-- service_role не используется; клиентская часть работает через PUBLIC_SUPABASE_ANON_KEY
-- с ключом auth.role = authenticated после установки сессии.

-- Таблица профилей: авторизованный пользователь читает только свою запись.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_own_select'
  ) THEN
    CREATE POLICY profiles_own_select
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);
  END IF;
END $$;

GRANT SELECT ON public.profiles TO authenticated;

-- Таблица ролей тьюторов: авторизованный пользователь читает только свою запись.
-- Роль не выдаётся автоматически; отсутствие записи обрабатывается на уровне приложения.
ALTER TABLE public.tutor_user_roles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tutor_user_roles' AND policyname = 'tutor_user_roles_own_select'
  ) THEN
    CREATE POLICY tutor_user_roles_own_select
    ON public.tutor_user_roles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

GRANT SELECT ON public.tutor_user_roles TO authenticated;
