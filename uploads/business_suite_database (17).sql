-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Apr 16, 2026 at 05:04 AM
-- Server version: 8.0.45-0ubuntu0.24.04.1
-- PHP Version: 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `business_suite_database`
--

-- --------------------------------------------------------

--
-- Table structure for table `products_po`
--

CREATE TABLE `products_po` (
  `id` int NOT NULL,
  `purchase_order_id` int UNSIGNED DEFAULT NULL,
  `part_number` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `product_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `hsn_sac` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `quantity` float NOT NULL,
  `discount` decimal(5,2) DEFAULT '0.00',
  `total_price` decimal(10,2) GENERATED ALWAYS AS (((`price` * `quantity`) - (((`price` * `quantity`) * `discount`) / 100))) STORED,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `products_po`
--
DELIMITER $$
CREATE TRIGGER `trg_after_products_po_delete` AFTER DELETE ON `products_po` FOR EACH ROW BEGIN
  CALL update_po_totals(OLD.purchase_order_id)$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_after_products_po_insert` AFTER INSERT ON `products_po` FOR EACH ROW BEGIN
  CALL update_po_totals(NEW.purchase_order_id)$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_after_products_po_update` AFTER UPDATE ON `products_po` FOR EACH ROW BEGIN
  CALL update_po_totals(NEW.purchase_order_id)$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `project_files`
--

CREATE TABLE `project_files` (
  `id` int NOT NULL,
  `product_id` int NOT NULL,
  `stored_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `original_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `file_type` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `remarks` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_stages`
--

CREATE TABLE `project_stages` (
  `id` int NOT NULL,
  `product_id` int NOT NULL,
  `stage_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `section_title` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `stage_date` date DEFAULT NULL,
  `achieve_date` date DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_general_ci,
  `assigned_user_id` int DEFAULT NULL,
  `saved_by_user_id` int DEFAULT NULL,
  `status` enum('active','closed') COLLATE utf8mb4_general_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_orders`
--

CREATE TABLE `purchase_orders` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int NOT NULL,
  `client_id` int DEFAULT NULL,
  `client_type` enum('domestic','export') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `currency` enum('INR','USD','EUR') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `shipping_address` text CHARACTER SET armscii8 COLLATE armscii8_general_ci NOT NULL,
  `po_reference` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `po_reference_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `po_reference_date` date DEFAULT NULL,
  `manual_mode` tinyint(1) DEFAULT '0',
  `advance_term` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `balance_term` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `dispatch_term` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `delivery_terms` enum('Door Delivery','FOB','CIF','DDP','EXW','DAP') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `cgst_rate` decimal(5,2) DEFAULT NULL,
  `sgst_rate` decimal(5,2) DEFAULT NULL,
  `igst_rate` decimal(5,2) DEFAULT NULL,
  `net_amount` decimal(10,2) DEFAULT '0.00',
  `gross_amount` decimal(10,2) NOT NULL,
  `current_usd` float DEFAULT NULL,
  `current_eur` float DEFAULT NULL,
  `gross_amount_inr` decimal(15,2) DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `notes_bold` tinyint(1) DEFAULT '0',
  `po_file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `status` enum('active','closed') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
  `start_date` date DEFAULT NULL,
  `customer_req_date` date DEFAULT NULL,
  `project_manager` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `quality_manager` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `project_engineer` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL,
  `updated_at` timestamp NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stage_comments`
--

CREATE TABLE `stage_comments` (
  `id` int NOT NULL,
  `stage_id` int NOT NULL,
  `comment_text` text COLLATE utf8mb4_general_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stage_files`
--

CREATE TABLE `stage_files` (
  `id` int NOT NULL,
  `stage_id` int NOT NULL,
  `filename` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `products_po`
--
ALTER TABLE `products_po`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_purchase_order_id` (`purchase_order_id`);

--
-- Indexes for table `project_files`
--
ALTER TABLE `project_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_id` (`product_id`);

--
-- Indexes for table `project_stages`
--
ALTER TABLE `project_stages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_id` (`product_id`);

--
-- Indexes for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_client_id` (`client_id`);

--
-- Indexes for table `stage_comments`
--
ALTER TABLE `stage_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_stage_id` (`stage_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `stage_files`
--
ALTER TABLE `stage_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_stage_id` (`stage_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `products_po`
--
ALTER TABLE `products_po`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project_files`
--
ALTER TABLE `project_files`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project_stages`
--
ALTER TABLE `project_stages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stage_comments`
--
ALTER TABLE `stage_comments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stage_files`
--
ALTER TABLE `stage_files`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `stage_comments`
--
ALTER TABLE `stage_comments`
  ADD CONSTRAINT `fk_stage_comments_stage` FOREIGN KEY (`stage_id`) REFERENCES `project_stages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_stage_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `stage_files`
--
ALTER TABLE `stage_files`
  ADD CONSTRAINT `fk_stage_files_stage` FOREIGN KEY (`stage_id`) REFERENCES `project_stages` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
