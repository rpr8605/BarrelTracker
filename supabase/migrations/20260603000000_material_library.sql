-- Still Material Library: Standard and custom grains, ingredients, and finishes

create table if not exists material_library (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid references distilleries(id) on delete cascade, -- NULL means system default
  name text not null,
  normalized_name text not null,
  category text not null check (category in ('grain', 'finish', 'ingredient', 'wood', 'wine', 'beer', 'spirit', 'syrup', 'experimental', 'other')),
  parent_group text, -- e.g. 'Fortified Wine', 'Spirits', 'Beer'
  notes text,
  active boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(distillery_id, normalized_name, category)
);

alter table material_library enable row level security;

-- Everyone can read system defaults and their own distillery's custom materials
create policy "read_materials" on material_library for select
  using (distillery_id is null or distillery_id in (select distilleries_i_can_access()));

-- Only distillery writers can insert/update custom materials
create policy "write_materials" on material_library for insert
  with check (distillery_id in (select distilleries_i_can_write()));

create policy "update_materials" on material_library for update
  using (distillery_id in (select distilleries_i_can_write()));

-- Seed standard grains
insert into material_library (name, normalized_name, category) values
  ('Corn', 'corn', 'grain'),
  ('Rye', 'rye', 'grain'),
  ('Wheat', 'wheat', 'grain'),
  ('Barley', 'barley', 'grain'),
  ('Malt', 'malt', 'grain'),
  ('Malted Barley', 'malted-barley', 'grain'),
  ('Unmalted Barley', 'unmalted-barley', 'grain'),
  ('Oats', 'oats', 'grain'),
  ('Rice', 'rice', 'grain'),
  ('Sorghum', 'sorghum', 'grain'),
  ('Millet', 'millet', 'grain'),
  ('Triticale', 'triticale', 'grain'),
  ('Buckwheat', 'buckwheat', 'grain'),
  ('Spelt', 'spelt', 'grain'),
  ('Quinoa', 'quinoa', 'grain');

-- Seed standard finishes
-- Fortified Wine
insert into material_library (name, normalized_name, category, parent_group) values
  ('Oloroso Sherry', 'oloroso-sherry', 'finish', 'Fortified Wine'),
  ('PX Sherry', 'px-sherry', 'finish', 'Fortified Wine'),
  ('Fino Sherry', 'fino-sherry', 'finish', 'Fortified Wine'),
  ('Amontillado Sherry', 'amontillado-sherry', 'finish', 'Fortified Wine'),
  ('Manzanilla Sherry', 'manzanilla-sherry', 'finish', 'Fortified Wine'),
  ('Port', 'port', 'finish', 'Fortified Wine'),
  ('Tawny Port', 'tawny-port', 'finish', 'Fortified Wine'),
  ('Ruby Port', 'ruby-port', 'finish', 'Fortified Wine'),
  ('Vintage Port', 'vintage-port', 'finish', 'Fortified Wine'),
  ('Madeira', 'madeira', 'finish', 'Fortified Wine'),
  ('Marsala', 'marsala', 'finish', 'Fortified Wine'),
  ('Vermouth', 'vermouth', 'finish', 'Fortified Wine'),
  ('Sweet Vermouth', 'sweet-vermouth', 'finish', 'Fortified Wine'),
  ('Dry Vermouth', 'dry-vermouth', 'finish', 'Fortified Wine');

-- Wine
insert into material_library (name, normalized_name, category, parent_group) values
  ('Red Wine', 'red-wine', 'finish', 'Wine'),
  ('White Wine', 'white-wine', 'finish', 'Wine'),
  ('Cabernet Sauvignon', 'cabernet-sauvignon', 'finish', 'Wine'),
  ('Pinot Noir', 'pinot-noir', 'finish', 'Wine'),
  ('Merlot', 'merlot', 'finish', 'Wine'),
  ('Syrah', 'syrah', 'finish', 'Wine'),
  ('Zinfandel', 'zinfandel', 'finish', 'Wine'),
  ('Bordeaux', 'bordeaux', 'finish', 'Wine'),
  ('Burgundy', 'burgundy', 'finish', 'Wine'),
  ('Rioja', 'rioja', 'finish', 'Wine'),
  ('Amarone', 'amarone', 'finish', 'Wine'),
  ('Sauternes', 'sauternes', 'finish', 'Wine'),
  ('Tokaji', 'tokaji', 'finish', 'Wine'),
  ('Ice Wine', 'ice-wine', 'finish', 'Wine'),
  ('Champagne', 'champagne', 'finish', 'Wine');

-- Spirits
insert into material_library (name, normalized_name, category, parent_group) values
  ('Bourbon', 'bourbon', 'finish', 'Spirits'),
  ('Rye Whiskey', 'rye-whiskey', 'finish', 'Spirits'),
  ('American Whiskey', 'american-whiskey', 'finish', 'Spirits'),
  ('Scotch', 'scotch', 'finish', 'Spirits'),
  ('Irish Whiskey', 'irish-whiskey', 'finish', 'Spirits'),
  ('Rum', 'rum', 'finish', 'Spirits'),
  ('Rhum Agricole', 'rhum-agricole', 'finish', 'Spirits'),
  ('Cognac', 'cognac', 'finish', 'Spirits'),
  ('Brandy', 'brandy', 'finish', 'Spirits'),
  ('Armagnac', 'armagnac', 'finish', 'Spirits'),
  ('Calvados', 'calvados', 'finish', 'Spirits'),
  ('Tequila', 'tequila', 'finish', 'Spirits'),
  ('Mezcal', 'mezcal', 'finish', 'Spirits'),
  ('Gin', 'gin', 'finish', 'Spirits'),
  ('Absinthe', 'absinthe', 'finish', 'Spirits'),
  ('Aquavit', 'aquavit', 'finish', 'Spirits'),
  ('Grappa', 'grappa', 'finish', 'Spirits'),
  ('Pisco', 'pisco', 'finish', 'Spirits'),
  ('Awamori', 'awamori', 'finish', 'Spirits'),
  ('Shochu', 'shochu', 'finish', 'Spirits');

-- Beer
insert into material_library (name, normalized_name, category, parent_group) values
  ('Stout', 'stout', 'finish', 'Beer'),
  ('Imperial Stout', 'imperial-stout', 'finish', 'Beer'),
  ('Porter', 'porter', 'finish', 'Beer'),
  ('Barleywine', 'barleywine', 'finish', 'Beer'),
  ('IPA', 'ipa', 'finish', 'Beer'),
  ('Saison', 'saison', 'finish', 'Beer'),
  ('Sour Beer', 'sour-beer', 'finish', 'Beer'),
  ('Lambic', 'lambic', 'finish', 'Beer'),
  ('Gose', 'gose', 'finish', 'Beer'),
  ('Brown Ale', 'brown-ale', 'finish', 'Beer'),
  ('Scotch Ale', 'scotch-ale', 'finish', 'Beer'),
  ('Belgian Ale', 'belgian-ale', 'finish', 'Beer');

-- Specialty
insert into material_library (name, normalized_name, category, parent_group) values
  ('Maple Syrup', 'maple-syrup', 'finish', 'Specialty'),
  ('Honey', 'honey', 'finish', 'Specialty'),
  ('Molasses', 'molasses', 'finish', 'Specialty'),
  ('Apple Cider', 'apple-cider', 'finish', 'Specialty'),
  ('Coffee', 'coffee', 'finish', 'Specialty'),
  ('Chocolate', 'chocolate', 'finish', 'Specialty'),
  ('Vanilla', 'vanilla', 'finish', 'Specialty'),
  ('Smoked Syrup', 'smoked-syrup', 'finish', 'Specialty'),
  ('Hot Sauce', 'hot-sauce', 'finish', 'Specialty'),
  ('Bitters', 'bitters', 'finish', 'Specialty'),
  ('Negroni', 'negroni', 'finish', 'Specialty'),
  ('Manhattan', 'manhattan', 'finish', 'Specialty'),
  ('Old Fashioned', 'old-fashioned', 'finish', 'Specialty');

-- Wood
insert into material_library (name, normalized_name, category, parent_group) values
  ('New American Oak', 'new-american-oak', 'finish', 'Wood'),
  ('Used American Oak', 'used-american-oak', 'finish', 'Wood'),
  ('French Oak', 'french-oak', 'finish', 'Wood'),
  ('Spanish Oak', 'spanish-oak', 'finish', 'Wood'),
  ('European Oak', 'european-oak', 'finish', 'Wood'),
  ('Mizunara Oak', 'mizunara-oak', 'finish', 'Wood'),
  ('Amburana', 'amburana', 'finish', 'Wood'),
  ('Cherry Wood', 'cherry-wood', 'finish', 'Wood'),
  ('Maple Wood', 'maple-wood', 'finish', 'Wood'),
  ('Acacia', 'acacia', 'finish', 'Wood'),
  ('Chestnut', 'chestnut', 'finish', 'Wood'),
  ('Oak Spirals', 'oak-spirals', 'finish', 'Wood'),
  ('Toasted Oak', 'toasted-oak', 'finish', 'Wood'),
  ('Charred Oak', 'charred-oak', 'finish', 'Wood'),
  ('Double Oak', 'double-oak', 'finish', 'Wood'),
  ('Re-charred Barrel', 're-charred-barrel', 'finish', 'Wood');

-- Experimental / Other
insert into material_library (name, normalized_name, category, parent_group) values
  ('Cider', 'cider', 'finish', 'Experimental'),
  ('Mead', 'mead', 'finish', 'Experimental'),
  ('Kombucha', 'kombucha', 'finish', 'Experimental'),
  ('Sake', 'sake', 'finish', 'Experimental'),
  ('Vinegar', 'vinegar', 'finish', 'Experimental'),
  ('Fruit Wine', 'fruit-wine', 'finish', 'Experimental'),
  ('Dessert Wine', 'dessert-wine', 'finish', 'Experimental'),
  ('Liqueur', 'liqueur', 'finish', 'Experimental'),
  ('Herbal Liqueur', 'herbal-liqueur', 'finish', 'Experimental'),
  ('Coffee Liqueur', 'coffee-liqueur', 'finish', 'Experimental'),
  ('Orange Liqueur', 'orange-liqueur', 'finish', 'Experimental'),
  ('Amaro', 'amaro', 'finish', 'Experimental');
