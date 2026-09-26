PRAGMA foreign_keys = ON;

ALTER TABLE storefront_catalog_products ADD COLUMN storefront_approved INTEGER NOT NULL DEFAULT 0 CHECK (storefront_approved IN (0,1));
ALTER TABLE inventory_listings ADD COLUMN image_source TEXT NOT NULL DEFAULT 'MANUAL' CHECK (image_source IN ('NONE','MANUAL','CATALOG'));

UPDATE inventory_listings SET image_source = 'CATALOG' WHERE external_catalog_product_id IS NOT NULL;
