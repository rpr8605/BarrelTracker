create or replace function increment_tag_usage(tag_name text)
returns void
language sql
security definer
as $$
  update tag_library set usage_count = usage_count + 1 where tag = tag_name;
$$;
