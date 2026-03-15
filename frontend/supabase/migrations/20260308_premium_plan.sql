-- Premium plan backend schema for Supabase/Postgres
-- Run this migration in Supabase SQL editor.

create extension if not exists pgcrypto;
create extension if not exists pg_net;

create table if not exists premium_categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, code)
);

create table if not exists premium_appartement_types (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  label text not null,
  created_at timestamptz not null default now(),
  unique(owner_id, code)
);

create table if not exists premium_biens (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references premium_categories(id) on delete set null,
  appartement_type_id uuid references premium_appartement_types(id) on delete set null,
  titre text not null,
  adresse text not null,
  description text,
  equipements text[] not null default '{}',
  loyer_hc numeric(12,2) not null default 0,
  charges numeric(12,2) not null default 0,
  latitude numeric(10,7),
  longitude numeric(10,7),
  statut text not null default 'VACANT' check (statut in ('LOUE','VACANT','TRAVAUX')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists premium_locataires (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  nom text not null,
  prenoms text not null,
  email text not null,
  telephone text,
  date_naissance date,
  profession text,
  piece_identite_chiffree bytea,
  garant_chiffre bytea,
  historique_paiements jsonb not null default '[]'::jsonb,
  date_depart date,
  is_purged boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists premium_baux (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  bien_id uuid not null references premium_biens(id) on delete cascade,
  locataire_id uuid not null references premium_locataires(id) on delete cascade,
  date_entree date not null,
  date_sortie date,
  revision_annuelle numeric(5,2) not null default 0,
  depot_garantie numeric(12,2) not null default 0,
  bail_pdf_url text,
  bail_email_status text not null default 'NOT_SENT' check (bail_email_status in ('NOT_SENT','PENDING','SENT','FAILED')),
  bail_email_sent_at timestamptz,
  bail_email_error text,
  statut text not null default 'ACTIF' check (statut in ('ACTIF','TERMINE','RESILIE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table premium_baux add column if not exists bail_pdf_url text;
alter table premium_baux add column if not exists bail_email_status text not null default 'NOT_SENT';
alter table premium_baux add column if not exists bail_email_sent_at timestamptz;
alter table premium_baux add column if not exists bail_email_error text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'premium_baux_bail_email_status_check'
  ) then
    alter table premium_baux
    add constraint premium_baux_bail_email_status_check
    check (bail_email_status in ('NOT_SENT','PENDING','SENT','FAILED'));
  end if;
end;
$$;

create table if not exists premium_ecritures_comptables (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  bien_id uuid references premium_biens(id) on delete set null,
  bail_id uuid references premium_baux(id) on delete set null,
  type_ecriture text not null check (type_ecriture in ('REVENU','DEPENSE')),
  source text not null default 'MANUEL' check (source in ('MANUEL','AUTO_LOYER')),
  libelle text not null,
  categorie text,
  date_operation date not null,
  montant numeric(12,2) not null check (montant >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists premium_payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  bail_id uuid not null references premium_baux(id) on delete cascade,
  date_paiement date not null,
  periode_debut date not null,
  periode_fin date not null,
  montant numeric(12,2) not null check (montant >= 0),
  statut text not null default 'PAYE' check (statut in ('PAYE','PARTIEL','IMPAYE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists premium_payments_audit_logs (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references premium_payments(id) on delete cascade,
  owner_id uuid not null,
  actor_id uuid,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  old_data jsonb,
  new_data jsonb,
  changed_at timestamptz not null default now()
);

create index if not exists idx_premium_biens_owner on premium_biens(owner_id);
create index if not exists idx_premium_baux_owner on premium_baux(owner_id);
create index if not exists idx_premium_locataires_owner on premium_locataires(owner_id);
create index if not exists idx_premium_ecritures_owner_date on premium_ecritures_comptables(owner_id, date_operation);
create index if not exists idx_premium_payments_owner on premium_payments(owner_id);

create or replace function premium_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_premium_categories_updated_at
before update on premium_categories
for each row execute function premium_set_updated_at();

create trigger trg_premium_biens_updated_at
before update on premium_biens
for each row execute function premium_set_updated_at();

create trigger trg_premium_locataires_updated_at
before update on premium_locataires
for each row execute function premium_set_updated_at();

create trigger trg_premium_baux_updated_at
before update on premium_baux
for each row execute function premium_set_updated_at();

create trigger trg_premium_ecritures_updated_at
before update on premium_ecritures_comptables
for each row execute function premium_set_updated_at();

create trigger trg_premium_payments_updated_at
before update on premium_payments
for each row execute function premium_set_updated_at();

create or replace function premium_encrypt_text(raw_value text)
returns bytea
language sql
immutable
as $$
  select case
    when raw_value is null or raw_value = '' then null
    else pgp_sym_encrypt(raw_value, coalesce(current_setting('app.settings.rgpd_key', true), 'change-me-rgpd-key'))
  end;
$$;

create or replace function premium_decrypt_text(encrypted_value bytea)
returns text
language sql
stable
as $$
  select case
    when encrypted_value is null then null
    else pgp_sym_decrypt(encrypted_value, coalesce(current_setting('app.settings.rgpd_key', true), 'change-me-rgpd-key'))
  end;
$$;

create or replace function premium_audit_payment_changes()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into premium_payments_audit_logs(payment_id, owner_id, actor_id, action, new_data)
    values (new.id, new.owner_id, auth.uid(), 'INSERT', to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into premium_payments_audit_logs(payment_id, owner_id, actor_id, action, old_data, new_data)
    values (new.id, new.owner_id, auth.uid(), 'UPDATE', to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into premium_payments_audit_logs(payment_id, owner_id, actor_id, action, old_data)
    values (old.id, old.owner_id, auth.uid(), 'DELETE', to_jsonb(old));
    return old;
  end if;

  return null;
end;
$$;

create trigger trg_premium_payments_audit
after insert or update or delete on premium_payments
for each row execute function premium_audit_payment_changes();

create or replace function premium_auto_add_rent_revenue()
returns trigger
language plpgsql
as $$
declare
  linked_bien_id uuid;
begin
  select bien_id into linked_bien_id from premium_baux where id = new.bail_id;

  insert into premium_ecritures_comptables (
    owner_id,
    bien_id,
    bail_id,
    type_ecriture,
    source,
    libelle,
    categorie,
    date_operation,
    montant,
    metadata
  )
  values (
    new.owner_id,
    linked_bien_id,
    new.bail_id,
    'REVENU',
    'AUTO_LOYER',
    'Loyer percu',
    'LOYER',
    new.date_paiement,
    new.montant,
    jsonb_build_object('payment_id', new.id)
  );

  return new;
end;
$$;

create or replace function premium_queue_bail_email()
returns trigger
language plpgsql
as $$
declare
  function_url text;
  function_secret text;
  locataire_record record;
  bien_record record;
  request_headers jsonb;
begin
  if new.bail_pdf_url is null or trim(new.bail_pdf_url) = '' then
    return new;
  end if;

  if tg_op = 'UPDATE' and new.bail_pdf_url is not distinct from old.bail_pdf_url then
    return new;
  end if;

  select id, email, nom, prenoms
    into locataire_record
  from premium_locataires
  where id = new.locataire_id;

  if locataire_record.email is null or trim(locataire_record.email) = '' then
    update premium_baux
    set bail_email_status = 'FAILED',
        bail_email_error = 'Email locataire manquant',
        updated_at = now()
    where id = new.id;
    return new;
  end if;

  select id, titre, adresse
    into bien_record
  from premium_biens
  where id = new.bien_id;

  function_url := coalesce(
    current_setting('app.settings.send_bail_email_url', true),
    ''
  );

  function_secret := coalesce(
    current_setting('app.settings.send_bail_email_secret', true),
    ''
  );

  if function_url = '' then
    update premium_baux
    set bail_email_status = 'FAILED',
        bail_email_error = 'Parametre app.settings.send_bail_email_url manquant',
        updated_at = now()
    where id = new.id;
    return new;
  end if;

  request_headers := jsonb_build_object('Content-Type', 'application/json');

  if function_secret <> '' then
    request_headers := request_headers || jsonb_build_object('x-bail-secret', function_secret);
  end if;

  perform net.http_post(
    url := function_url,
    headers := request_headers,
    body := jsonb_build_object(
      'bail', jsonb_build_object(
        'id', new.id,
        'date_entree', new.date_entree,
        'date_sortie', new.date_sortie,
        'bail_pdf_url', new.bail_pdf_url
      ),
      'locataire', jsonb_build_object(
        'id', locataire_record.id,
        'email', locataire_record.email,
        'nom', locataire_record.nom,
        'prenoms', locataire_record.prenoms
      ),
      'bien', jsonb_build_object(
        'id', bien_record.id,
        'titre', bien_record.titre,
        'adresse', bien_record.adresse
      )
    )
  );

  update premium_baux
  set bail_email_status = 'PENDING',
      bail_email_error = null,
      updated_at = now()
  where id = new.id;

  return new;
end;
$$;

create trigger trg_premium_payment_to_revenue
after insert on premium_payments
for each row execute function premium_auto_add_rent_revenue();

drop trigger if exists trg_premium_baux_auto_send_email on premium_baux;
create trigger trg_premium_baux_auto_send_email
after insert or update of bail_pdf_url on premium_baux
for each row execute function premium_queue_bail_email();

create or replace view premium_balance_view as
select
  ec.owner_id,
  ec.bien_id,
  date_trunc('month', ec.date_operation)::date as periode,
  sum(case when ec.type_ecriture = 'REVENU' then ec.montant else 0 end) as total_revenus,
  sum(case when ec.type_ecriture = 'DEPENSE' then ec.montant else 0 end) as total_depenses,
  sum(case when ec.type_ecriture = 'REVENU' then ec.montant else -ec.montant end) as benefice_net
from premium_ecritures_comptables ec
group by ec.owner_id, ec.bien_id, date_trunc('month', ec.date_operation)::date;

create or replace function premium_purge_locataire_data(p_locataire_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update premium_locataires
  set
    email = concat('purged+', id::text, '@deleted.local'),
    telephone = null,
    date_naissance = null,
    profession = null,
    piece_identite_chiffree = null,
    garant_chiffre = null,
    historique_paiements = '[]'::jsonb,
    is_purged = true,
    updated_at = now()
  where id = p_locataire_id
    and owner_id = auth.uid()
    and (date_depart is not null and date_depart <= current_date);
end;
$$;

alter table premium_categories enable row level security;
alter table premium_appartement_types enable row level security;
alter table premium_biens enable row level security;
alter table premium_locataires enable row level security;
alter table premium_baux enable row level security;
alter table premium_ecritures_comptables enable row level security;
alter table premium_payments enable row level security;
alter table premium_payments_audit_logs enable row level security;

create policy if not exists "premium_categories_owner_policy"
on premium_categories
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy if not exists "premium_types_owner_policy"
on premium_appartement_types
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy if not exists "premium_biens_owner_policy"
on premium_biens
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy if not exists "premium_locataires_owner_policy"
on premium_locataires
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy if not exists "premium_baux_owner_policy"
on premium_baux
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy if not exists "premium_ecritures_owner_policy"
on premium_ecritures_comptables
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy if not exists "premium_payments_owner_policy"
on premium_payments
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy if not exists "premium_payment_logs_owner_policy"
on premium_payments_audit_logs
for select
using (owner_id = auth.uid());

grant select on premium_balance_view to authenticated;
