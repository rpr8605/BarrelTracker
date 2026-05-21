# Still Barrel Material Library

Still supports a flexible and extensible library for grains, ingredients, and finishing materials. This ensures producers of all styles—from Bourbon to American Single Malt to experimental finished spirits—can accurately track their production.

## Standard Grains

Still includes a comprehensive list of standard grains to support diverse mash bills:

- **Core**: Corn, Rye, Wheat, Barley, Malt
- **Malts**: Malted Barley, Unmalted Barley, Malted Rye
- **Alternative**: Oats, Rice, Sorghum, Millet, Triticale, Buckwheat, Spelt, Quinoa

### American Single Malt (ASM) Support
Still includes a one-click **ASM Preset** which sets the grain type to 100% Malted Barley, catering to the growing American Single Malt category.

## Finishing Taxonomy

The finishing library is categorized to help producers quickly find and group their aging experiments:

- **Fortified Wine**: Oloroso, PX, Fino, Amontillado, Manzanilla Sherries; Port (Tawny, Ruby, Vintage); Madeira, Marsala, Vermouth.
- **Wine**: Red/White Wine, Cabernet Sauvignon, Pinot Noir, Merlot, Syrah, Zinfandel, Bordeaux, Burgundy, Rioja, Amarone, Sauternes, Tokaji, Ice Wine, Champagne.
- **Spirits**: Bourbon, Rye, Scotch, Irish Whiskey, Rum, Rhum Agricole, Cognac, Brandy, Armagnac, Calvados, Tequila, Mezcal, Gin, Absinthe, Aquavit.
- **Beer**: Stout, Imperial Stout, Porter, Barleywine, IPA, Saison, Sour Beer, Lambic, Gose.
- **Wood**: New/Used American Oak, French/Spanish/European Oak, Mizunara, Amburana, Cherry Wood, Maple Wood, Acacia, Chestnut.
- **Specialty**: Maple Syrup, Honey, Molasses, Apple Cider, Coffee, Chocolate, Vanilla, Smoked Syrup, Hot Sauce, Bitters.

## Custom "Add Anything" Library

Producers can define their own custom materials directly from the Barrel Create or Edit forms.

1. **Persistent**: Once a custom material (e.g., "Mustard" or "Hickory Wood") is saved, it is added to your company's library and remains available for all future barrels.
2. **Company-Scoped**: Custom materials are visible to everyone in your organization but remain private from other Still customers.
3. **Flexible**: Still does not block unusual entries. We provide the tools to track what you actually use in the warehouse.

## Technical Notes

- **Normalized Names**: Materials are automatically normalized (e.g., "Malted Barley" -> `malted-barley`) to prevent duplicates while preserving the user's preferred display name.
- **Data Model**: Materials are stored in the `material_library` table. Standard options have a `NULL` distillery ID, while custom options are linked to your organization.

## Compliance Disclaimer

The material library is for **operational metadata tracking only**. Selecting a material in Still does not constitute regulatory approval for labeling or COLA purposes. Always consult official TTB/ABC guidelines for legal spirit designations.
