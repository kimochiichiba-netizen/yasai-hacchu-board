-- やさい発注ボード — Supabase スキーマ（本番共有モード用）
-- Supabase の SQL Editor に貼り付けて実行してください。

-- 注文テーブル
create table if not exists public.orders (
  id            text primary key,
  partner       text not null,
  contact       text,
  "orderDate"   date,
  "deliveryDate" date,
  note          text,
  request       text,
  items         jsonb not null default '[]'::jsonb,
  status        text not null default 'received',
  "createdAt"   timestamptz not null default now()
);

-- 価格傾向の手動上書き
create table if not exists public.price_overrides (
  "productId"   text primary key,
  trend         text not null check (trend in ('cheap','high'))
);

create index if not exists idx_orders_created on public.orders ("createdAt" desc);
create index if not exists idx_orders_status on public.orders (status, "orderDate");

-- RLS（行レベルセキュリティ）
-- 取引先は注文の「作成」のみ、社長（管理）は閲覧・更新できる構成が望ましい。
-- まずは匿名キーで動作確認するため最小構成。公開前に必ず見直すこと。
alter table public.orders enable row level security;
alter table public.price_overrides enable row level security;

-- 取引先(anon)：注文の作成と、価格傾向の閲覧のみ許可
create policy "anon can insert orders" on public.orders
  for insert to anon with check (true);
create policy "anon can read price_overrides" on public.price_overrides
  for select to anon using (true);

-- 管理者：指定メールでログイン(Supabase Auth)した人だけ、注文の閲覧・更新と
-- 価格傾向の書き込みを許可。メールアドレスは運用に合わせて変更すること。
create policy "admin read orders" on public.orders
  for select to authenticated using ((auth.jwt() ->> 'email') = 'kimochi.ichiba@gmail.com');
create policy "admin update orders" on public.orders
  for update to authenticated using ((auth.jwt() ->> 'email') = 'kimochi.ichiba@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'kimochi.ichiba@gmail.com');
create policy "admin write price_overrides" on public.price_overrides
  for all to authenticated using ((auth.jwt() ->> 'email') = 'kimochi.ichiba@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'kimochi.ichiba@gmail.com');
