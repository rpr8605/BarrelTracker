-- Seed tag_library with industry-standard tags

-- GRAIN TAGS
insert into tag_library (tag, category) values
('Wheat', 'grain'), ('High Wheat', 'grain'), ('Wheated Bourbon', 'grain'),
('Corn', 'grain'), ('High Corn', 'grain'), ('Rye', 'grain'), ('High Rye', 'grain'),
('Malted Rye', 'grain'), ('Barley', 'grain'), ('Malted Barley', 'grain'),
('Four Grain', 'grain'), ('Triticale', 'grain'), ('Oat', 'grain'),
('Buckwheat', 'grain'), ('Heirloom Corn', 'grain'), ('Blue Corn', 'grain'),
('Jimmy Red Corn', 'grain'), ('Bloody Butcher Corn', 'grain')
on conflict (tag) do nothing;

-- DISTILLERY SOURCE TAGS
insert into tag_library (tag, category) values
('MGP', 'source'), ('Buffalo Trace', 'source'), ('Heaven Hill', 'source'),
('Bardstown', 'source'), ('Brown-Forman', 'source'), ('Wild Turkey', 'source'),
('Four Roses', 'source'), ('Beam', 'source'), ('Willett', 'source'),
('New Riff', 'source'), ('Wilderness Trail', 'source'), ('Castle & Key', 'source'),
('Limestone Branch', 'source'), ('Campari', 'source'), ('Sazerac', 'source'),
('Michter''s', 'source'), ('High West', 'source'), ('Smooth Ambler', 'source'),
('LDI', 'source'), ('MGPI', 'source'), ('GNS', 'source')
on conflict (tag) do nothing;

-- FINISH TAGS
insert into tag_library (tag, category) values
('Port Finish', 'finish'), ('Sherry Finish', 'finish'), ('Rum Finish', 'finish'),
('Wine Finish', 'finish'), ('Madeira Finish', 'finish'), ('Calvados Finish', 'finish'),
('Toasted Finish', 'finish'), ('Double Oaked', 'finish'), ('Honey Cask', 'finish'),
('Maple Cask', 'finish'), ('Cognac Finish', 'finish'), ('Tequila Finish', 'finish'),
('Beer Cask Finish', 'finish'), ('Stout Finish', 'finish'), ('Pinot Noir Finish', 'finish'),
('Chardonnay Finish', 'finish'), ('Cabernet Finish', 'finish')
on conflict (tag) do nothing;

-- FLAVOR TAGS (200+)
insert into tag_library (tag, category) values
('Honey', 'flavor'), ('Vanilla', 'flavor'), ('Caramel', 'flavor'),
('Butterscotch', 'flavor'), ('Toffee', 'flavor'), ('Brown Sugar', 'flavor'),
('Maple Syrup', 'flavor'), ('Molasses', 'flavor'), ('Chocolate', 'flavor'),
('Dark Chocolate', 'flavor'), ('Milk Chocolate', 'flavor'), ('Cocoa', 'flavor'),
('Coffee', 'flavor'), ('Espresso', 'flavor'), ('Mocha', 'flavor'),
('Oak', 'flavor'), ('Light Oak', 'flavor'), ('Heavy Oak', 'flavor'),
('Toasted Oak', 'flavor'), ('Charred Oak', 'flavor'), ('Cedar', 'flavor'),
('Sandalwood', 'flavor'), ('Leather', 'flavor'), ('Tobacco', 'flavor'),
('Cigar Box', 'flavor'), ('Dried Fruit', 'flavor'), ('Raisins', 'flavor'),
('Prunes', 'flavor'), ('Dates', 'flavor'), ('Figs', 'flavor'),
('Apricot', 'flavor'), ('Peach', 'flavor'), ('Cherry', 'flavor'),
('Dried Cherry', 'flavor'), ('Black Cherry', 'flavor'), ('Plum', 'flavor'),
('Apple', 'flavor'), ('Baked Apple', 'flavor'), ('Pear', 'flavor'),
('Banana', 'flavor'), ('Citrus', 'flavor'), ('Orange Peel', 'flavor'),
('Lemon Zest', 'flavor'), ('Grapefruit', 'flavor'), ('Pineapple', 'flavor'),
('Tropical', 'flavor'), ('Mango', 'flavor'), ('Coconut', 'flavor'),
('Floral', 'flavor'), ('Rose', 'flavor'), ('Lavender', 'flavor'),
('Violet', 'flavor'), ('Jasmine', 'flavor'), ('Hibiscus', 'flavor'),
('Mint', 'flavor'), ('Eucalyptus', 'flavor'), ('Herbal', 'flavor'),
('Spearmint', 'flavor'), ('Anise', 'flavor'), ('Licorice', 'flavor'),
('Clove', 'flavor'), ('Cinnamon', 'flavor'), ('Nutmeg', 'flavor'),
('Allspice', 'flavor'), ('Black Pepper', 'flavor'), ('White Pepper', 'flavor'),
('Spice', 'flavor'), ('Baking Spice', 'flavor'), ('Ginger', 'flavor'),
('Cardamom', 'flavor'), ('Smoke', 'flavor'), ('Peat', 'flavor'),
('Campfire', 'flavor'), ('Bacon', 'flavor'), ('Savory', 'flavor'),
('Umami', 'flavor'), ('Soy', 'flavor'), ('Mushroom', 'flavor'),
('Earthy', 'flavor'), ('Mineral', 'flavor'), ('Slate', 'flavor'),
('Flint', 'flavor'), ('Wet Stone', 'flavor'), ('Bread', 'flavor'),
('Yeast', 'flavor'), ('Grain', 'flavor'), ('Corn Bread', 'flavor'),
('Biscuit', 'flavor'), ('Graham Cracker', 'flavor'), ('Oatmeal', 'flavor'),
('Cream', 'flavor'), ('Butter', 'flavor'), ('Custard', 'flavor'),
('Ice Cream', 'flavor'), ('Whipped Cream', 'flavor'), ('Almond', 'flavor'),
('Walnut', 'flavor'), ('Pecan', 'flavor'), ('Hazelnut', 'flavor'),
('Peanut Butter', 'flavor'), ('Marzipan', 'flavor'), ('Nougat', 'flavor'),
('Candy', 'flavor'), ('Cotton Candy', 'flavor'), ('Bubblegum', 'flavor'),
('Menthol', 'flavor'), ('Pine', 'flavor'), ('Resin', 'flavor'),
('Wax', 'flavor'), ('Dried Herbs', 'flavor'), ('Hay', 'flavor'),
('Grass', 'flavor'), ('Fresh Cut Wood', 'flavor'), ('Sawdust', 'flavor'),
('Varnish', 'flavor'), ('Paint', 'flavor'), ('Sulfur', 'flavor'),
('Rubber', 'flavor'), ('Medicinal', 'flavor'), ('Antiseptic', 'flavor'),
('Briny', 'flavor'), ('Seaweed', 'flavor'), ('Ocean', 'flavor'),
('Saline', 'flavor'), ('Pickle', 'flavor'), ('Long Finish', 'flavor'),
('Short Finish', 'flavor'), ('Warming Finish', 'flavor'), ('Dry Finish', 'flavor'),
('Sweet Finish', 'flavor'), ('Bitter Finish', 'flavor'), ('Tannic', 'flavor')
on conflict (tag) do nothing;
