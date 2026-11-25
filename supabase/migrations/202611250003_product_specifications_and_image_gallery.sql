alter table public.products
  add column if not exists specs text not null default '',
  add column if not exists images text[] not null default '{}';

update public.products
set specs = variant
where specs = '';

update public.products
set images = array[image]
where cardinality(images) = 0
  and image <> '';
