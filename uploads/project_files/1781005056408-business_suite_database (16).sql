-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 09, 2026 at 08:10 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

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
-- Table structure for table `inventory_master`
--

CREATE TABLE `inventory_master` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `split_part_id` int(11) DEFAULT NULL,
  `part_number` varchar(200) DEFAULT NULL,
  `approved_quantity` int(11) DEFAULT NULL,
  `dispatch_quantity` int(11) DEFAULT NULL,
  `current_stock` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_transactions`
--

CREATE TABLE `inventory_transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `split_part_id` int(11) DEFAULT NULL,
  `part_number` varchar(200) DEFAULT NULL,
  `transaction_type` varchar(50) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `old_stock` int(11) DEFAULT NULL,
  `new_stock` int(11) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_files`
--

CREATE TABLE `project_files` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_type` varchar(100) NOT NULL,
  `remarks` varchar(255) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_invoices`
--

CREATE TABLE `project_invoices` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `split_product_id` int(11) DEFAULT NULL,
  `part_number` varchar(200) DEFAULT NULL,
  `invoice_number` varchar(255) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `part_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_invoices`
--

INSERT INTO `project_invoices` (`id`, `user_id`, `product_id`, `split_product_id`, `part_number`, `invoice_number`, `quantity`, `created_at`, `part_name`) VALUES
(48, 5, 4031, NULL, '031998-M100-005A', 'iv 79', 6, '2026-06-06 11:04:20', 'V64 Positioning block');

-- --------------------------------------------------------

--
-- Table structure for table `project_stages`
--

CREATE TABLE `project_stages` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `split_part_id` int(11) DEFAULT NULL,
  `stage_name` varchar(100) NOT NULL,
  `section_title` varchar(100) DEFAULT NULL,
  `stage_date` date DEFAULT NULL,
  `achieve_date` date DEFAULT NULL,
  `inward` int(155) DEFAULT NULL,
  `outward` int(155) DEFAULT NULL,
  `assigned_user_id` int(11) DEFAULT NULL,
  `saved_by_user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `split_parts`
--

CREATE TABLE `split_parts` (
  `id` int(11) NOT NULL,
  `parent_part_id` int(11) NOT NULL,
  `split_name` varchar(120) DEFAULT NULL,
  `warehouse_name` varchar(120) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `split_code` varchar(100) DEFAULT NULL,
  `required_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('Active','On-Hold','Completed') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stage_comments`
--

CREATE TABLE `stage_comments` (
  `id` int(11) NOT NULL,
  `stage_id` int(11) NOT NULL,
  `comment_text` text NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stage_files`
--

CREATE TABLE `stage_files` (
  `id` int(11) NOT NULL,
  `stage_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `filename` varchar(255) NOT NULL,
  `variant_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stage_varients`
--

CREATE TABLE `stage_varients` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `products_po_id` int(55) DEFAULT NULL,
  `stage_varient` varchar(256) DEFAULT NULL,
  `file_name` varchar(256) DEFAULT NULL,
  `file_type` varchar(12) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stage_verifications`
--

CREATE TABLE `stage_verifications` (
  `id` int(11) NOT NULL,
  `stage_id` int(11) DEFAULT NULL,
  `approver_id` int(25) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `verified_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `inventory_master`
--
ALTER TABLE `inventory_master`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `project_files`
--
ALTER TABLE `project_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_id` (`product_id`);

--
-- Indexes for table `project_invoices`
--
ALTER TABLE `project_invoices`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `project_stages`
--
ALTER TABLE `project_stages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_id` (`product_id`);

--
-- Indexes for table `split_parts`
--
ALTER TABLE `split_parts`
  ADD PRIMARY KEY (`id`);

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
-- Indexes for table `stage_varients`
--
ALTER TABLE `stage_varients`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `stage_verifications`
--
ALTER TABLE `stage_verifications`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `inventory_master`
--
ALTER TABLE `inventory_master`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project_files`
--
ALTER TABLE `project_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project_invoices`
--
ALTER TABLE `project_invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `project_stages`
--
ALTER TABLE `project_stages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `split_parts`
--
ALTER TABLE `split_parts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stage_comments`
--
ALTER TABLE `stage_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stage_files`
--
ALTER TABLE `stage_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stage_varients`
--
ALTER TABLE `stage_varients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stage_verifications`
--
ALTER TABLE `stage_verifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
