-- SINTA — Medical inventory (MySQL 8+)
CREATE DATABASE IF NOT EXISTS sinta_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sinta_inventory;

CREATE TABLE IF NOT EXISTS menus (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  image_path VARCHAR(512) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_menus_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sub_menus (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  menu_id INT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  image_path VARCHAR(512) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sub_menus_menu_id (menu_id),
  KEY idx_sub_menus_name (name),
  CONSTRAINT fk_sub_menus_menu FOREIGN KEY (menu_id) REFERENCES menus (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sub_menu_id INT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  image_path VARCHAR(512) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_items_sub_menu (sub_menu_id),
  KEY idx_items_name (name),
  CONSTRAINT fk_items_sub_menu FOREIGN KEY (sub_menu_id) REFERENCES sub_menus (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activities (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_name VARCHAR(120) NOT NULL,
  action ENUM('create','update','delete') NOT NULL,
  entity_type ENUM('menu','sub_menu','item') NOT NULL,
  entity_id INT UNSIGNED NULL,
  summary VARCHAR(512) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_activities_created (created_at),
  KEY idx_activities_actor (actor_name)
) ENGINE=InnoDB;
