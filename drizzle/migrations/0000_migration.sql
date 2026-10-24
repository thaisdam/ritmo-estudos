create type public.app_role as enum ('admin');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own role read" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.handle_admin_signup()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) = 'thaisthdamasceno@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users
  for each row execute function public.handle_admin_signup();

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nome text not null check (char_length(nome) between 2 and 120),
  whatsapp text not null check (char_length(whatsapp) between 10 and 20),
  email text not null check (char_length(email) between 5 and 255),
  instituicao text not null check (char_length(instituicao) <= 120),
  curso text not null check (char_length(curso) <= 120),
  periodo int not null check (periodo between 1 and 10),
  turno text not null check (turno in ('manha','tarde','noite','integral')),
  faz_idioma boolean not null default false,
  idioma_detalhes text check (char_length(idioma_detalhes) <= 300),
  cursos_complementares text check (char_length(cursos_complementares) <= 500),
  trabalha boolean not null default false,
  horas_trabalho int check (horas_trabalho between 0 and 80),
  horas_livres int not null check (horas_livres between 1 and 6),
  dificuldades text[] not null default '{}',
  proximas_provas text check (char_length(proximas_provas) <= 1000),
  objetivo text not null check (char_length(objetivo) <= 300),
  horario_checkin text not null check (horario_checkin in ('manha','tarde','noite')),
  plano_interesse text not null check (plano_interesse in ('essencial','foco','intensivo')),
  consentimento_lgpd boolean not null default false,
  status text not null default 'novo' check (status in ('novo','em_contato','convertido','perdido')),
  anotacoes text
);
grant insert on public.leads to anon;
grant select, insert, update, delete on public.leads to authenticated;
grant all on public.leads to service_role;
alter table public.leads enable row level security;
create policy "public insert leads" on public.leads for insert to anon, authenticated
  with check (consentimento_lgpd = true and status = 'novo');
create policy "admin select leads" on public.leads for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin update leads" on public.leads for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete leads" on public.leads for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.assinantes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid unique references public.leads(id) on delete set null,
  nome text not null,
  whatsapp text not null,
  email text,
  instituicao text,
  curso text,
  plano text not null check (plano in ('essencial','foco','intensivo')),
  valor_mensal numeric(10,2) not null check (valor_mensal >= 0),
  data_inicio date not null default current_date,
  dia_vencimento int not null check (dia_vencimento between 1 and 31),
  status text not null default 'ativo' check (status in ('ativo','pausado','cancelado')),
  pagamento_status text not null default 'pendente' check (pagamento_status in ('pago','pendente')),
  horario_checkin text check (horario_checkin in ('manha','tarde','noite')),
  observacoes text
);
create table public.entregas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  assinante_id uuid not null references public.assinantes(id) on delete cascade,
  tipo text not null check (tipo in ('plano_semanal','check_in','chamada')),
  data date not null,
  status text not null default 'pendente' check (status in ('pendente','feito','sem_resposta')),
  anotacoes text,
  unique (assinante_id, tipo, data)
);
create table public.lembretes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  titulo text not null check (char_length(titulo) between 1 and 200),
  descricao text,
  data_hora timestamptz not null,
  assinante_id uuid references public.assinantes(id) on delete set null,
  concluido boolean not null default false
);
grant select, insert, update, delete on public.assinantes, public.entregas, public.lembretes to authenticated;
grant all on public.assinantes, public.entregas, public.lembretes to service_role;
alter table public.assinantes enable row level security;
alter table public.entregas enable row level security;
alter table public.lembretes enable row level security;
create policy "admin all assinantes" on public.assinantes for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin all entregas" on public.entregas for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin all lembretes" on public.lembretes for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Dados de exemplo
insert into public.leads (id, created_at, nome, whatsapp, email, instituicao, curso, periodo, turno, faz_idioma, idioma_detalhes, cursos_complementares, trabalha, horas_trabalho, horas_livres, dificuldades, proximas_provas, objetivo, horario_checkin, plano_interesse, consentimento_lgpd, status) values
('11111111-0000-0000-0000-000000000001', now() - interval '1 day', 'Ana Beatriz Souza', '(34) 99111-2233', 'ana.souza@example.com', 'UFU', 'Engenharia Civil', 3, 'integral', true, 'Inglês, ter e qui', 'Excel avançado', false, null, 3, '{procrastinação,provas acumuladas}', 'Cálculo II em 05/11', 'Passar em Cálculo II', 'noite', 'foco', true, 'novo'),
('11111111-0000-0000-0000-000000000002', now() - interval '2 days', 'Lucas Ferreira', '(34) 99222-3344', 'lucas.f@example.com', 'UNITRI', 'Direito', 5, 'noite', false, null, null, true, 30, 2, '{cansaço,esquecer prazos}', 'Trabalho de Penal 10/11', 'Organizar estágio e faculdade', 'manha', 'essencial', true, 'em_contato'),
('11111111-0000-0000-0000-000000000003', now() - interval '4 days', 'Mariana Lopes', '(34) 99333-4455', 'mari.lopes@example.com', 'UFU', 'Ciência da Computação', 2, 'integral', true, 'Inglês, sábados', 'Alura de React, curso de SQL', false, null, 4, '{falta de constância,não saber priorizar}', null, 'Terminar curso de React', 'tarde', 'intensivo', true, 'novo'),
('11111111-0000-0000-0000-000000000004', now() - interval '6 days', 'Pedro Henrique Alves', '(34) 99444-5566', 'pedro.alves@example.com', 'UNA', 'Administração', 7, 'noite', false, null, 'Power BI', true, 40, 1, '{cansaço}', 'TCC em dezembro', 'Entregar o TCC', 'noite', 'foco', true, 'perdido'),
('11111111-0000-0000-0000-000000000005', now() - interval '9 days', 'Julia Martins', '(34) 99555-6677', 'julia.m@example.com', 'Pitágoras', 'Enfermagem', 4, 'manha', true, 'Espanhol, seg e qua', null, false, null, 3, '{esquecer prazos,provas acumuladas}', 'Anatomia 08/11', 'Melhorar notas', 'tarde', 'essencial', true, 'convertido');

insert into public.assinantes (id, lead_id, nome, whatsapp, email, instituicao, curso, plano, valor_mensal, data_inicio, dia_vencimento, status, pagamento_status, horario_checkin) values
('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000005', 'Julia Martins', '(34) 99555-6677', 'julia.m@example.com', 'Pitágoras', 'Enfermagem', 'essencial', 29.90, current_date - 20, 5, 'ativo', 'pago', 'tarde'),
('22222222-0000-0000-0000-000000000002', null, 'Rafael Costa', '(34) 99666-7788', 'rafael.c@example.com', 'UFU', 'Medicina', 'foco', 49.90, current_date - 40, 10, 'ativo', 'pendente', 'manha'),
('22222222-0000-0000-0000-000000000003', null, 'Camila Ribeiro', '(34) 99777-8899', 'camila.r@example.com', 'ESAMC', 'Publicidade', 'intensivo', 89.90, current_date - 10, 15, 'ativo', 'pago', 'noite');

insert into public.lembretes (titulo, descricao, data_hora, assinante_id, concluido) values
('Enviar plano da Camila', 'Incluir revisão de portfólio', date_trunc('day', now()) + interval '18 hours', '22222222-0000-0000-0000-000000000003', false),
('Cobrar Pix do Rafael', 'Vencimento dia 10', now() - interval '1 day', '22222222-0000-0000-0000-000000000002', false),
('Prova de Anatomia da Julia', 'Mandar mensagem de boa sorte', now() + interval '3 days', '22222222-0000-0000-0000-000000000001', false),
('Revisar textos da landing', null, now() - interval '3 days', null, true);