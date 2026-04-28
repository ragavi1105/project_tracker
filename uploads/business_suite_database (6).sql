-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3307
-- Generation Time: Apr 21, 2026 at 05:01 PM
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
-- Table structure for table `challans`
--

CREATE TABLE `challans` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `challan_no` varchar(30) NOT NULL,
  `dispatch_date` date NOT NULL,
  `dispatch_through` varchar(125) DEFAULT NULL,
  `order_date` date DEFAULT NULL,
  `ref_no` varchar(100) DEFAULT NULL,
  `challan_type` varchar(100) DEFAULT NULL,
  `company_name` varchar(255) NOT NULL,
  `company_gstin` varchar(20) NOT NULL,
  `company_address` text DEFAULT NULL,
  `company_phone` varchar(20) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `challans`
--

INSERT INTO `challans` (`id`, `user_id`, `customer_id`, `challan_no`, `dispatch_date`, `dispatch_through`, `order_date`, `ref_no`, `challan_type`, `company_name`, `company_gstin`, `company_address`, `company_phone`, `notes`, `created_at`, `updated_at`) VALUES
(2, 1, 5, 'DC/HNV/HSR/001', '2026-04-17', 'Porter', NULL, NULL, 'Job Work', '', '', '462, BL complex, 16th Cross Rd, 4th sector, HSR Layout, Bengaluru, Karnataka 560102', '+91 7980601271', NULL, '2026-04-17 09:13:19', '0000-00-00'),
(3, 1, 6, 'DC/HNV/HSR/002', '2026-04-17', NULL, NULL, NULL, 'Job Work', '', '', '462, BL complex, 16th Cross Rd, 4th sector, HSR Layout, Bengaluru, Karnataka 560102', '+91 7980601271', NULL, '2026-04-17 09:16:34', '0000-00-00'),
(4, 1, 4, 'DC/HNV/HSR/003', '2026-05-01', NULL, NULL, NULL, 'Job Work', '', '', '462, BL complex, 16th Cross Rd, 4th sector, HSR Layout, Bengaluru, Karnataka 560102', '+91 7980601271', NULL, '2026-04-17 09:40:05', '0000-00-00'),
(5, 1, 7, 'DC/HNV/HSR/026', '2026-04-14', NULL, NULL, NULL, 'Job Work', '', '', '462, BL complex, 16th Cross Rd, 4th sector, HSR Layout, Bengaluru, Karnataka 560102', '+91 7980601271', NULL, '2026-04-17 12:16:04', '0000-00-00'),
(6, 1, 7, 'DC/HNV/HSR/027', '2026-04-18', NULL, NULL, NULL, 'Job Work', '', '', '462, BL complex, 16th Cross Rd, 4th sector, HSR Layout, Bengaluru, Karnataka 560102', '+91 7980601271', NULL, '2026-04-18 03:58:13', '0000-00-00'),
(7, 1, 11, 'DC/HNV/HSR/028', '2026-04-20', NULL, NULL, NULL, 'Job Work', '', '', '462, BL complex, 16th Cross Rd, 4th sector, HSR Layout, Bengaluru, Karnataka 560102', '+91 7980601271', NULL, '2026-04-20 06:32:53', '0000-00-00'),
(8, 1, 10, 'DC/HNV/HSR/029', '2026-04-20', NULL, NULL, '', 'Job Work', '', '', '462, BL complex, 16th Cross Rd, 4th sector, HSR Layout, Bengaluru, Karnataka 560102', '+91 7980601271', '', '2026-04-21 07:28:22', '0000-00-00');

-- --------------------------------------------------------

--
-- Table structure for table `challan_items`
--

CREATE TABLE `challan_items` (
  `id` int(11) NOT NULL,
  `challan_id` int(11) NOT NULL,
  `project_id` varchar(125) DEFAULT NULL,
  `part_name` varchar(125) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `qty` decimal(10,3) DEFAULT NULL,
  `price` decimal(12,2) DEFAULT NULL,
  `taxable_val` decimal(12,2) DEFAULT NULL,
  `cgst_rate` decimal(5,2) DEFAULT NULL,
  `sgst_rate` decimal(5,2) DEFAULT NULL,
  `igst_rate` decimal(5,2) DEFAULT NULL,
  `total` decimal(12,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `challan_items`
--

INSERT INTO `challan_items` (`id`, `challan_id`, `project_id`, `part_name`, `description`, `qty`, `price`, `taxable_val`, `cgst_rate`, `sgst_rate`, `igst_rate`, `total`) VALUES
(2, 3, 'project 1', 'part 5', 'asdfghj', 7.000, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00),
(3, 4, '1', '4', '9', 8.000, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00),
(4, 5, 'TMP', 'Shells', '', 100.000, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00),
(5, 6, 'TMP', 'Shells', '', 395.000, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00),
(6, 7, '', 'TMP Shells', '', 550.000, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00),
(8, 8, '', 'TMP Shells', 'Coating', 130.000, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `client_name` varchar(255) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone_number` varchar(100) DEFAULT NULL,
  `gst_number` varchar(20) DEFAULT NULL,
  `state` varchar(255) NOT NULL DEFAULT '',
  `billing_address` text NOT NULL,
  `shipping_address_1` text DEFAULT NULL,
  `shipping_address_2` text DEFAULT NULL,
  `shipping_address_3` text DEFAULT NULL,
  `shipping_address_4` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dc_customer`
--

CREATE TABLE `dc_customer` (
  `id` int(11) NOT NULL,
  `user_id` int(55) DEFAULT NULL,
  `customer_name` varchar(255) NOT NULL,
  `customer_gstin` varchar(20) DEFAULT NULL,
  `customer_address_1` text DEFAULT NULL,
  `customer_address_2` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(20) DEFAULT NULL,
  `customer_phone` varchar(15) DEFAULT NULL,
  `place_of_supply` varchar(125) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dc_customer`
--

INSERT INTO `dc_customer` (`id`, `user_id`, `customer_name`, `customer_gstin`, `customer_address_1`, `customer_address_2`, `city`, `state`, `pincode`, `customer_phone`, `place_of_supply`) VALUES
(4, 1, 'Ranga Samy', '', '2,Arugampalayam', '2 , ARUGAMPALAYAM KATHAPARAI (P.O.)', 'Karur', 'Tamil Nadu', '639006', '', ''),
(5, 1, 'SURESH M', '', '2,Arugampalayam', '2 , ARUGAMPALAYAM KATHAPARAI (P.O.)', 'Karur', 'Tamil Nadu', '639006', '', ''),
(6, 1, 'RAGAVI S', '', '3/1492 Arugampalayam Kathaparai(po) Karur', '', 'Karur', 'Tamil Nadu', '639006', '', ''),
(7, 1, 'Temple Private Limited', ' 07AADCU5528K1Z1', 'Ground Floor, Kila Number 20, Mustaili No 52', 'Mehrauli, Near Police Post, Dera Mandi Retreat', 'Delhi', 'Delhi', '110074', '7030465611', ''),
(8, 1, 'MARUTHI ENTERPRISES ', '29CAGPR4990C1ZB', 'PLOT NO.20, 1ST FLOOR, KSSIDC.INDL ESTATE, 2ND STAGE', 'BOMMASANDRA 4TH PHASE, JIGANI LINK ROAD,ANEKAL', 'BENGALURU', 'KARNATAKA', '', '9019575996', ''),
(9, 1, 'Karnataka Tools & Dies', '', '6/A, Opp. Hall Mark Layout, 1st Cross, Behind State Bank of India, ', 'Yarandahalli, Jigani post, Anekal Taluk', 'BENGALURU', 'KARNATAKA', '560106', '9353800475', ''),
(10, 1, 'AddLife Coating Systems Private Limited', '', '52, BOMMASANDRA INDUSTRIAL AREA ', ' YARANDAHALLY, JIGANI HOBLI', 'BENGALURU RURAL', 'KARNATAKA', '560099', '+91 97909 06308', ''),
(11, 1, 'Raison Tech', ' 33AAVFR1377G1ZV', '356/46/2, Balaji Nagar, Bedarapalli Sipcot ', ' ', 'HOSUR', 'TAMIL NADU', '635126', '+91 99657 59247', '');

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` int(11) NOT NULL,
  `emp_id` varchar(50) NOT NULL,
  `emp_name` varchar(150) NOT NULL,
  `phone_number` varchar(15) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `access` varchar(255) DEFAULT 'employee',
  `reset_otp` varchar(6) DEFAULT NULL,
  `reset_otp_expires_at` datetime DEFAULT NULL,
  `password_updated_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products_po`
--

CREATE TABLE `products_po` (
  `id` int(11) NOT NULL,
  `purchase_order_id` int(10) UNSIGNED DEFAULT NULL,
  `part_number` varchar(150) DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `hsn_sac` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `quantity` float NOT NULL,
  `discount` decimal(5,2) DEFAULT 0.00,
  `total_price` decimal(10,2) GENERATED ALWAYS AS (`price` * `quantity` - `price` * `quantity` * `discount` / 100) STORED,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products_po`
--

INSERT INTO `products_po` (`id`, `purchase_order_id`, `part_number`, `product_name`, `hsn_sac`, `price`, `quantity`, `discount`, `created_at`, `updated_at`) VALUES
(1, 1, 'PN001', 'Steel Rod', '7214', 500.00, 10, 0.00, '2026-04-17 09:46:36', '2026-04-17 09:46:36'),
(2, 1, 'PN002', 'Aluminium Sheet', '7606', 1200.00, 5, 100.00, '2026-04-17 09:46:36', '2026-04-17 09:46:36'),
(3, 2, 'PN003', 'Copper Wire', '7408', 300.00, 20, 50.00, '2026-04-17 09:46:36', '2026-04-17 09:46:36'),
(4, 2, 'PN004', 'Industrial Bolt', '7318', 50.00, 100, 0.00, '2026-04-17 09:46:36', '2026-04-17 09:46:36'),
(5, 3, 'PN005', 'Electric Motor', '8501', 15000.00, 2, 500.00, '2026-04-17 09:46:36', '2026-04-17 09:46:36'),
(6, 3, 'PN006', 'Control Panel', '8537', 8000.00, 3, 200.00, '2026-04-17 09:46:36', '2026-04-17 09:46:36');

-- --------------------------------------------------------

--
-- Table structure for table `project_files`
--

CREATE TABLE `project_files` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_type` varchar(100) NOT NULL,
  `remarks` varchar(255) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_stages`
--

CREATE TABLE `project_stages` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `stage_name` varchar(100) NOT NULL,
  `section_title` varchar(100) DEFAULT NULL,
  `stage_date` date DEFAULT NULL,
  `achieve_date` date DEFAULT NULL,
  `inward` int(155) DEFAULT NULL,
  `outward` int(155) DEFAULT NULL,
  `assigned_user_id` int(11) DEFAULT NULL,
  `saved_by_user_id` int(11) DEFAULT NULL,
  `status` enum('active','closed') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_orders`
--

CREATE TABLE `purchase_orders` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `client_id` int(11) DEFAULT NULL,
  `client_type` enum('domestic','export') NOT NULL,
  `currency` enum('INR','USD','EUR') NOT NULL,
  `shipping_address` text CHARACTER SET armscii8 COLLATE armscii8_general_ci NOT NULL,
  `po_reference` varchar(50) DEFAULT NULL,
  `po_reference_name` varchar(255) DEFAULT NULL,
  `po_reference_date` date DEFAULT NULL,
  `manual_mode` tinyint(1) DEFAULT 0,
  `advance_term` varchar(255) DEFAULT NULL,
  `balance_term` varchar(255) DEFAULT NULL,
  `dispatch_term` varchar(255) DEFAULT NULL,
  `delivery_terms` enum('Door Delivery','FOB','CIF','DDP','EXW','DAP') DEFAULT NULL,
  `cgst_rate` decimal(5,2) DEFAULT NULL,
  `sgst_rate` decimal(5,2) DEFAULT NULL,
  `igst_rate` decimal(5,2) DEFAULT NULL,
  `net_amount` decimal(10,2) DEFAULT 0.00,
  `gross_amount` decimal(10,2) NOT NULL,
  `current_usd` float DEFAULT NULL,
  `current_eur` float DEFAULT NULL,
  `gross_amount_inr` decimal(15,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `notes_bold` tinyint(1) DEFAULT 0,
  `po_file_name` varchar(255) NOT NULL,
  `status` enum('active','closed') NOT NULL DEFAULT 'active',
  `start_date` date DEFAULT NULL,
  `customer_req_date` date DEFAULT NULL,
  `project_manager` varchar(150) DEFAULT NULL,
  `quality_manager` varchar(150) DEFAULT NULL,
  `project_engineer` varchar(150) DEFAULT NULL,
  `engineer` varchar(155) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_orders`
--

INSERT INTO `purchase_orders` (`id`, `user_id`, `client_id`, `client_type`, `currency`, `shipping_address`, `po_reference`, `po_reference_name`, `po_reference_date`, `manual_mode`, `advance_term`, `balance_term`, `dispatch_term`, `delivery_terms`, `cgst_rate`, `sgst_rate`, `igst_rate`, `net_amount`, `gross_amount`, `current_usd`, `current_eur`, `gross_amount_inr`, `notes`, `notes_bold`, `po_file_name`, `status`, `start_date`, `customer_req_date`, `project_manager`, `quality_manager`, `project_engineer`, `engineer`, `created_at`, `updated_at`) VALUES
(1, 1, 101, '', 'INR', 'Chennai Industrial Area, Tamil Nadu', 'PO001', 'Office Equipment', '2026-04-01', 0, '50% Advance', '50% After Delivery', 'Immediate', '', 9.00, 9.00, 0.00, 50000.00, 59000.00, 600, 550, 59000.00, 'Urgent order', 0, 'po1.pdf', 'active', '2026-04-21', '2026-04-24', 'Ravi Kumar', 'Suresh Babu', 'Anand Raj', NULL, '2026-04-21 09:47:34', '2026-04-21 09:47:34'),
(2, 2, 102, '', 'USD', 'Bangalore Tech Park', 'PO002', 'Machinery Parts', '2026-04-05', 1, '30% Advance', '70% After Delivery', 'Standard', '', 0.00, 0.00, 18.00, 2000.00, 2360.00, 2000, 1800, 190000.00, 'Handle carefully', 0, 'po2.pdf', '', '2026-04-14', '2026-04-22', 'Karthik', 'Manoj', 'Deepak', NULL, '2026-04-21 09:56:57', '2026-04-21 09:56:57'),
(3, 1, 103, '', 'EUR', 'Coimbatore Industrial Estate', 'PO003', 'Electrical Items', '2026-04-08', 0, '100% Advance', '0%', 'Express', '', 9.00, 9.00, 0.00, 75000.00, 88500.00, 800, 750, 88500.00, 'Deliver ASAP', 0, 'po3.pdf', '', NULL, NULL, 'Ramesh', 'Ganesh', 'Vignesh', NULL, '2026-04-21 09:56:37', '2026-04-21 09:56:37');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_requests`
--

CREATE TABLE `purchase_requests` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `pr_number` varchar(20) NOT NULL,
  `project_id` varchar(50) DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `request_date` date DEFAULT NULL,
  `verifier` int(11) DEFAULT NULL,
  `priority` varchar(50) DEFAULT NULL,
  `department` varchar(100) NOT NULL,
  `status` varchar(50) DEFAULT NULL,
  `verified_by` int(11) DEFAULT NULL,
  `verified_at` date DEFAULT NULL,
  `verifier_remarks` varchar(255) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `employee_name` varchar(100) DEFAULT NULL,
  `employee_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `purchase_status` varchar(20) DEFAULT NULL,
  `purchase_remarks` text DEFAULT NULL,
  `purchase_updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_request_items`
--

CREATE TABLE `purchase_request_items` (
  `id` int(11) NOT NULL,
  `pr_id` int(11) NOT NULL,
  `item_name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `stores_qty` int(11) DEFAULT 0,
  `received_qty` int(11) DEFAULT 0,
  `excess_qty` int(11) DEFAULT 0,
  `issued_qty` int(11) NOT NULL DEFAULT 0,
  `issued_to` varchar(255) DEFAULT NULL,
  `requested_by` varchar(100) DEFAULT NULL,
  `approved_by` varchar(100) DEFAULT NULL,
  `unit` varchar(20) NOT NULL,
  `estimated_price` decimal(10,2) DEFAULT NULL,
  `item_date` date DEFAULT NULL,
  `delivery_date` date DEFAULT NULL,
  `delivery_remarks` varchar(255) DEFAULT NULL,
  `item_status` varchar(20) DEFAULT NULL,
  `item_remarks` text DEFAULT NULL,
  `attachment` varchar(255) DEFAULT NULL,
  `attachment_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
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
  `filename` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `user_id` varchar(10) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `roles` varchar(100) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `phone_number` varchar(12) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `department_name` varchar(255) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `latest_otp` varchar(10) DEFAULT NULL,
  `otp_timestamp` datetime DEFAULT NULL,
  `last_login_time` datetime DEFAULT NULL,
  `current_login_time` datetime DEFAULT NULL,
  `last_ip` varchar(50) DEFAULT NULL,
  `last_device` text DEFAULT NULL,
  `last_system` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `user_id`, `name`, `email`, `password`, `roles`, `designation`, `phone_number`, `status`, `department_name`, `dob`, `profile_image`, `latest_otp`, `otp_timestamp`, `last_login_time`, `current_login_time`, `last_ip`, `last_device`, `last_system`, `is_active`, `created_at`) VALUES
(1, '9', 'Hema Priya', 'sragavi999@gmail.com', '', 'Finance,pm', 'GET', '6382229764', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-04-17 13:01:22'),
(3, '20', 'Ragavi', 'hemapriya@gmail.com', '', 'Finance,pm', 'GET', '6382229764', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-04-17 13:01:22'),
(5, '25', 'Brundha', 'brundhasuresh@gmail.com', '', 'HR', 'GET', '6382229764', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-04-17 13:01:22'),
(6, '26', 'Ranga', 'imrangasamyrs@gmail.com', '', 'IT ', 'Full Stack Lead', '6382229764', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-04-17 13:01:22');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `challans`
--
ALTER TABLE `challans`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `challan_no` (`challan_no`),
  ADD KEY `fk_customer` (`customer_id`),
  ADD KEY `fk_users` (`user_id`);

--
-- Indexes for table `challan_items`
--
ALTER TABLE `challan_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `challan_id` (`challan_id`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `dc_customer`
--
ALTER TABLE `dc_customer`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `emp_id` (`emp_id`);

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
-- Indexes for table `purchase_requests`
--
ALTER TABLE `purchase_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `pr_number` (`pr_number`);

--
-- Indexes for table `purchase_request_items`
--
ALTER TABLE `purchase_request_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_pr_items_pr` (`pr_id`);

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
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `unique_user_id` (`user_id`),
  ADD UNIQUE KEY `email_2` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `challans`
--
ALTER TABLE `challans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `challan_items`
--
ALTER TABLE `challan_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dc_customer`
--
ALTER TABLE `dc_customer`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products_po`
--
ALTER TABLE `products_po`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `project_files`
--
ALTER TABLE `project_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project_stages`
--
ALTER TABLE `project_stages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `purchase_requests`
--
ALTER TABLE `purchase_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `purchase_request_items`
--
ALTER TABLE `purchase_request_items`
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
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `challans`
--
ALTER TABLE `challans`
  ADD CONSTRAINT `fk_customer` FOREIGN KEY (`customer_id`) REFERENCES `dc_customer` (`id`),
  ADD CONSTRAINT `fk_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `challan_items`
--
ALTER TABLE `challan_items`
  ADD CONSTRAINT `challan_items_ibfk_1` FOREIGN KEY (`challan_id`) REFERENCES `challans` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `purchase_request_items`
--
ALTER TABLE `purchase_request_items`
  ADD CONSTRAINT `fk_pr_items_pr` FOREIGN KEY (`pr_id`) REFERENCES `purchase_requests` (`id`) ON DELETE CASCADE;

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
