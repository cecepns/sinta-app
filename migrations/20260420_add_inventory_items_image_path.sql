USE sinta_inventory;

SET @db_name := DATABASE();
SET @column_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'inventory_items'
    AND COLUMN_NAME = 'image_path'
);

SET @ddl := IF(
  @column_exists = 0,
  'ALTER TABLE inventory_items ADD COLUMN image_path VARCHAR(512) NULL AFTER quantity',
  'SELECT "inventory_items.image_path already exists"'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
