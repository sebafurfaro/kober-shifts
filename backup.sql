-- MySQL dump 10.13  Distrib 9.3.0, for macos14.7 (x86_64)
--
-- Host: 127.0.0.1    Database: kober_shifts
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `appointment_payments`
--

DROP TABLE IF EXISTS `appointment_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointment_payments` (
  `id` varchar(36) NOT NULL,
  `tenantId` varchar(255) NOT NULL,
  `appointmentId` varchar(255) NOT NULL,
  `provider` varchar(50) NOT NULL,
  `purpose` varchar(20) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `status` varchar(30) NOT NULL,
  `preferenceId` varchar(255) DEFAULT NULL,
  `paymentId` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_appt_payments_tenant` (`tenantId`),
  KEY `idx_appt_payments_appointment` (`appointmentId`),
  KEY `idx_appt_payments_preference` (`preferenceId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointment_payments`
--

LOCK TABLES `appointment_payments` WRITE;
/*!40000 ALTER TABLE `appointment_payments` DISABLE KEYS */;
INSERT INTO `appointment_payments` VALUES ('5f187c50-c7fd-4a79-9587-af40e1318040','default','8225048a-ec4d-4b5d-a8df-637abbb4fd2b','mercadopago','deposit',20000.00,'PENDING','3178971432-f32ad12a-f816-40f1-9c5f-f36069822535',NULL,'2026-02-04 20:32:18','2026-02-04 20:32:18'),('bb3fdb75-4272-4889-bb8c-8e8c55121712','default','b0a6dea6-1b04-4157-8b9e-327f2b3a1e90','mercadopago','deposit',20000.00,'approved','3178971432-d56bd6c6-bf70-44da-9608-d481505bc8d1',NULL,'2026-02-06 20:16:42','2026-02-06 22:17:49'),('fe160299-f7c8-42f0-ac03-65f47324908b','default','8225048a-ec4d-4b5d-a8df-637abbb4fd2b','mercadopago','deposit',20000.00,'PENDING','3178971432-01afaa86-729e-4447-9cfb-b84dd885e600',NULL,'2026-02-04 20:36:48','2026-02-04 20:36:48');
/*!40000 ALTER TABLE `appointment_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'default',
  `status` enum('REQUESTED','PENDING_DEPOSIT','CONFIRMED','CANCELLED','ATTENDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'REQUESTED',
  `startAt` datetime NOT NULL,
  `endAt` datetime NOT NULL,
  `patientId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `professionalId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `locationId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `serviceId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `googleEventId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `patientFirstName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patientLastName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `cancellationReason` text COLLATE utf8mb4_unicode_ci,
  `cancelledBy` enum('PATIENT','PROFESSIONAL','ADMIN') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `googleEventId` (`googleEventId`),
  KEY `locationId` (`locationId`),
  KEY `idx_patient_start` (`patientId`,`startAt`),
  KEY `idx_professional_start` (`professionalId`,`startAt`),
  KEY `idx_status_start` (`status`,`startAt`),
  KEY `idx_google_event` (`googleEventId`),
  KEY `idx_appointments_tenant` (`tenantId`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`professionalId`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`locationId`) REFERENCES `locations` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_appointments_tenant` FOREIGN KEY (`tenantId`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
INSERT INTO `appointments` VALUES ('1a7042c0-62bd-4ac1-ad7c-5022b404cf94','acabogados','CONFIRMED','2026-03-11 13:00:00','2026-03-11 13:30:00','e69c4a8c-b1a6-43ec-bfe5-f9fa6de92d88','ec117d3e-376c-4452-9f5f-d8d516dccf4e','c38864b1-a989-42ee-b84a-d980f5dce8a3',NULL,NULL,NULL,NULL,NULL,'2026-03-11 15:49:49','2026-03-11 15:49:49',NULL,NULL),('49e98376-90e4-4ea2-8709-f82a019911db','acabogados','ATTENDED','2026-03-12 14:32:00','2026-03-12 14:45:00','790eebc7-b322-4fea-89cd-8d817d502f4b','ec117d3e-376c-4452-9f5f-d8d516dccf4e','c38864b1-a989-42ee-b84a-d980f5dce8a3',NULL,NULL,NULL,'Sebastian','Furfaro','2026-03-06 19:33:43','2026-03-06 21:22:56',NULL,NULL),('535e1fa0-9ae0-417b-aac3-04bbcba86bb1','acabogados','CONFIRMED','2026-03-09 09:00:00','2026-03-09 09:45:00','790eebc7-b322-4fea-89cd-8d817d502f4b','ec117d3e-376c-4452-9f5f-d8d516dccf4e','c38864b1-a989-42ee-b84a-d980f5dce8a3',NULL,NULL,NULL,'Sebastian','Furfaro','2026-03-06 18:32:02','2026-03-09 21:40:34',NULL,NULL),('6986c837-88ee-4033-92d0-56822fbd4b97','acabogados','CANCELLED','2026-03-11 09:00:00','2026-03-11 09:45:00','790eebc7-b322-4fea-89cd-8d817d502f4b','ec117d3e-376c-4452-9f5f-d8d516dccf4e','c38864b1-a989-42ee-b84a-d980f5dce8a3',NULL,NULL,NULL,'Sebastian','Furfaro','2026-03-06 18:32:18','2026-03-06 19:32:28','Cancelado desde el panel de turnos','ADMIN'),('93666257-b820-4a4b-8d0f-c6a1f7169640','acabogados','CONFIRMED','2026-03-10 16:00:00','2026-03-10 17:30:00','790eebc7-b322-4fea-89cd-8d817d502f4b','ec117d3e-376c-4452-9f5f-d8d516dccf4e','c38864b1-a989-42ee-b84a-d980f5dce8a3',NULL,NULL,NULL,'Sebastian','Furfaro','2026-03-09 18:46:17','2026-03-09 18:46:17',NULL,NULL),('db2db3ed-91cc-41c6-832a-1e0d2a366f0e','acabogados','ATTENDED','2026-03-04 17:00:00','2026-03-04 17:30:00','790eebc7-b322-4fea-89cd-8d817d502f4b','ec117d3e-376c-4452-9f5f-d8d516dccf4e','c38864b1-a989-42ee-b84a-d980f5dce8a3',NULL,NULL,NULL,'Sebastian','Furfaro','2026-03-04 19:41:41','2026-03-06 21:23:04',NULL,NULL);
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `google_oauth_tokens`
--

DROP TABLE IF EXISTS `google_oauth_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `google_oauth_tokens` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'default',
  `userId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accessToken` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `refreshToken` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tokenType` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expiryDate` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userId` (`userId`),
  KEY `idx_user` (`userId`),
  KEY `fk_google_oauth_tokens_tenant` (`tenantId`),
  CONSTRAINT `fk_google_oauth_tokens_tenant` FOREIGN KEY (`tenantId`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `google_oauth_tokens_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `google_oauth_tokens`
--

LOCK TABLES `google_oauth_tokens` WRITE;
/*!40000 ALTER TABLE `google_oauth_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `google_oauth_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `locations` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'default',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `street` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `streetNumber` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `floor` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `apartment` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postalCode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `province` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `neighborhood` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_locations_tenant` (`tenantId`),
  CONSTRAINT `fk_locations_tenant` FOREIGN KEY (`tenantId`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
INSERT INTO `locations` VALUES ('c38864b1-a989-42ee-b84a-d980f5dce8a3','acabogados','Sede Central','lala, 1212, 1200, CABA, Argentina','lala','1212',NULL,NULL,'1200','Argentina','CABA',NULL,NULL,'2026-03-03 20:12:56','2026-03-03 20:12:56'),('df38ad4a-f02a-430b-b143-1a73c7ccf9c6','capsif','central','entre rios, 248, 1212, CABA, Argentina','entre rios','248',NULL,NULL,'1212','Argentina','CABA',NULL,NULL,'2026-03-11 22:45:44','2026-03-11 22:45:44');
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_coverages`
--

DROP TABLE IF EXISTS `medical_coverages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_coverages` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'default',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_name` (`name`),
  KEY `fk_medical_coverages_tenant` (`tenantId`),
  CONSTRAINT `fk_medical_coverages_tenant` FOREIGN KEY (`tenantId`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_coverages`
--

LOCK TABLES `medical_coverages` WRITE;
/*!40000 ALTER TABLE `medical_coverages` DISABLE KEYS */;
INSERT INTO `medical_coverages` VALUES ('0ccc52db-dc48-4eb4-888f-911234ef3e2b','acabogados','OSUTHGRA','2026-03-03 20:30:38','2026-03-03 20:30:38'),('13d369f8-4ca6-485a-89db-230e0c9d0267','acabogados','OSPe','2026-03-03 20:30:38','2026-03-03 20:30:38'),('186e0c81-2a8e-4945-81e1-685a2cd9aaf2','acabogados','OSJERA','2026-03-03 20:30:38','2026-03-03 20:30:38'),('2380f620-5ce9-4da3-a645-994bd4f3a75f','acabogados','Premedic','2026-03-03 20:30:38','2026-03-03 20:30:38'),('3147203e-51d8-4531-9cab-8e6ec54163bf','acabogados','PAMI','2026-03-03 20:30:38','2026-03-03 20:30:38'),('32410d10-3480-4d80-9d24-93041a3d88d4','acabogados','Hominis','2026-03-03 20:30:37','2026-03-03 20:30:37'),('332f4171-df5d-4a18-a76a-7927fb663911','acabogados','OSPRERA','2026-03-03 20:30:38','2026-03-03 20:30:38'),('33dcfc94-78a7-4201-b27d-a03d5f01b824','acabogados','Galeno','2026-03-03 20:30:37','2026-03-03 20:30:37'),('385643fa-451b-42c0-a7c9-8af11ff4a2c2','acabogados','OSECAC','2026-03-03 20:30:38','2026-03-03 20:30:38'),('3ea76d72-af9a-49d0-abe2-858f8995bd6f','acabogados','Union Personal','2026-03-03 20:30:38','2026-03-03 20:30:38'),('3f93d73c-dbfd-4021-b607-be296d1541ae','acabogados','Medifé','2026-03-03 20:30:38','2026-03-03 20:30:38'),('403abf56-a6df-4869-93e3-41eda6a2957c','acabogados','IOMA','2026-03-03 20:30:37','2026-03-03 20:30:37'),('41db3e7b-369c-4053-80c7-7d4593ce96ae','acabogados','Hospital Italiano','2026-03-03 20:30:37','2026-03-03 20:30:37'),('43bd3315-22ba-46ce-8723-6b92332621fe','acabogados','Prevención Salud','2026-03-03 20:30:38','2026-03-03 20:30:38'),('43f5bdb3-bf14-4f36-bd39-64cf623297d6','acabogados','DOSUBA','2026-03-03 20:30:37','2026-03-03 20:30:37'),('44bd0a24-47c1-45cd-abee-05f625673879','acabogados','OSMATA','2026-03-03 20:30:38','2026-03-03 20:30:38'),('459f6435-2a81-4f9f-8d29-6fda071cda08','acabogados','OSDE','2026-03-03 20:30:38','2026-03-03 20:30:38'),('4fcf2648-5776-44a5-b7b0-6c417211ee5f','acabogados','OSPACA','2026-03-03 20:30:38','2026-03-03 20:30:38'),('525e4971-d592-4ca7-b8f5-6b9fbe9329bb','acabogados','Swiss Medical','2026-03-03 20:30:38','2026-03-03 20:30:38'),('5d1e9d99-e073-407f-81bd-850aa73bf5a3','acabogados','OSFE','2026-03-03 20:30:38','2026-03-03 20:30:38'),('5e2660e1-5684-4942-b020-e2171fe2bf13','acabogados','OSUOM','2026-03-03 20:30:38','2026-03-03 20:30:38'),('5f427cb6-bf4b-4060-99d9-17bef9b2d1aa','acabogados','William Hope','2026-03-03 20:30:38','2026-03-03 20:30:38'),('67bb382b-bfaf-4f20-8b30-899ad018ec97','acabogados','Avalian','2026-03-03 20:30:37','2026-03-03 20:30:37'),('710b3968-2303-48d0-bab9-8ebed8170a75','acabogados','Sin cobertura','2026-03-03 20:30:37','2026-03-03 20:30:37'),('8253898c-ddbd-45b9-b5dc-8799fa918d92','acabogados','Sancor Salud','2026-03-03 20:30:38','2026-03-03 20:30:38'),('82688395-8a25-4b1c-af5d-5917395f7162','acabogados','Bristol Medicine','2026-03-03 20:30:37','2026-03-03 20:30:37'),('9dbab01b-6ada-4d32-bcf3-485c81d308cc','acabogados','OMINT','2026-03-03 20:30:38','2026-03-03 20:30:38'),('a4258120-c5d9-4c2a-8376-f016ddfdb603','acabogados','OSDEPYM','2026-03-03 20:30:38','2026-03-03 20:30:38'),('bf8c9792-96fe-4392-9e8d-7d635560ff15','acabogados','Medicus','2026-03-03 20:30:38','2026-03-03 20:30:38'),('ca4a3262-9b78-4be7-b160-e9da7b1f7979','acabogados','Jerarquicos','2026-03-03 20:30:37','2026-03-03 20:30:37'),('ceb41de9-9043-4918-a140-98d85a655ed6','acabogados','ObSBA','2026-03-03 20:30:38','2026-03-03 20:30:38'),('d3e22e3a-c539-42af-a003-bda9d89697db','acabogados','Cober','2026-03-03 20:30:37','2026-03-03 20:30:37'),('db8929c9-8ec3-4740-a927-8ca8e0ae1b24','acabogados','Accord Salud','2026-03-03 20:30:37','2026-03-03 20:30:37'),('f2179c4c-e5d7-490d-8ea1-d01d91af5dfc','acabogados','Luis Pasteur','2026-03-03 20:30:38','2026-03-03 20:30:38'),('ff1ec821-cf94-4ab8-b875-f272f6c5dd86','acabogados','OSPSA','2026-03-03 20:30:38','2026-03-03 20:30:38');
/*!40000 ALTER TABLE `medical_coverages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_plans`
--

DROP TABLE IF EXISTS `medical_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_plans` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'default',
  `coverageId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_coverage` (`coverageId`),
  KEY `idx_name` (`name`),
  KEY `fk_medical_plans_tenant` (`tenantId`),
  CONSTRAINT `fk_medical_plans_tenant` FOREIGN KEY (`tenantId`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `medical_plans_ibfk_1` FOREIGN KEY (`coverageId`) REFERENCES `medical_coverages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_plans`
--

LOCK TABLES `medical_plans` WRITE;
/*!40000 ALTER TABLE `medical_plans` DISABLE KEYS */;
INSERT INTO `medical_plans` VALUES ('002d8607-df10-42fd-8b63-1ae7c59de45f','acabogados','8253898c-ddbd-45b9-b5dc-8799fa918d92','F700','2026-03-03 20:30:38','2026-03-03 20:30:38'),('033f1021-5444-4daa-90db-cb21833ad9cc','acabogados','9dbab01b-6ada-4d32-bcf3-485c81d308cc','Vos','2026-03-03 20:30:38','2026-03-03 20:30:38'),('03552709-c28e-47a0-858d-cfe3295b1bc7','acabogados','67bb382b-bfaf-4f20-8b30-899ad018ec97','Plan Selecta','2026-03-03 20:30:37','2026-03-03 20:30:37'),('03ef012c-f76e-40d3-82c1-8ba3a0ab6538','acabogados','8253898c-ddbd-45b9-b5dc-8799fa918d92','GEN S4000','2026-03-03 20:30:38','2026-03-03 20:30:38'),('04698e48-da3b-462e-9583-57e288f49ca1','acabogados','525e4971-d592-4ca7-b8f5-6b9fbe9329bb','S2','2026-03-03 20:30:38','2026-03-03 20:30:38'),('04f0089a-9e2c-4eff-a9a2-dd5785feea46','acabogados','13d369f8-4ca6-485a-89db-230e0c9d0267','A-325','2026-03-03 20:30:38','2026-03-03 20:30:38'),('06e547f6-e7bc-4311-aef8-c231ab1f8e17','acabogados','82688395-8a25-4b1c-af5d-5917395f7162','BM200','2026-03-03 20:30:37','2026-03-03 20:30:37'),('0a664054-d58e-4b0d-a417-3f1907f996c3','acabogados','db8929c9-8ec3-4740-a927-8ca8e0ae1b24','4.2','2026-03-03 20:30:37','2026-03-03 20:30:37'),('0aff39d3-2ff2-48b0-9a03-84835cc5cc2c','acabogados','5f427cb6-bf4b-4060-99d9-17bef9b2d1aa','N35','2026-03-03 20:30:38','2026-03-03 20:30:38'),('0b20e831-83f4-41fd-ad04-f72c53420a59','acabogados','db8929c9-8ec3-4740-a927-8ca8e0ae1b24','1.5','2026-03-03 20:30:37','2026-03-03 20:30:37'),('138754fb-c067-4062-af33-4158957bded3','acabogados','67bb382b-bfaf-4f20-8b30-899ad018ec97','Plan Cerca','2026-03-03 20:30:37','2026-03-03 20:30:37'),('15605728-a3cf-46c9-af53-7c72c71e0abc','acabogados','3f93d73c-dbfd-4021-b607-be296d1541ae','ORO','2026-03-03 20:30:38','2026-03-03 20:30:38'),('179ed7b2-33fd-48ec-89d7-0a50e3e58341','acabogados','8253898c-ddbd-45b9-b5dc-8799fa918d92','S1500','2026-03-03 20:30:38','2026-03-03 20:30:38'),('19486906-2e8a-4e0c-bf51-569e9036f7ca','acabogados','186e0c81-2a8e-4945-81e1-685a2cd9aaf2','Plan Único','2026-03-03 20:30:38','2026-03-03 20:30:38'),('1ae6dc05-a608-4cd4-ab10-160e964525e5','acabogados','13d369f8-4ca6-485a-89db-230e0c9d0267','A-608','2026-03-03 20:30:38','2026-03-03 20:30:38'),('1b6df792-765b-4422-a779-7d5ccaf137cd','acabogados','33dcfc94-78a7-4201-b27d-a03d5f01b824','200','2026-03-03 20:30:37','2026-03-03 20:30:37'),('1c77fad6-f00d-41c2-8788-1b0516118004','acabogados','ceb41de9-9043-4918-a140-98d85a655ed6','Plan Único','2026-03-03 20:30:38','2026-03-03 20:30:38'),('1dee57d8-30b4-486f-bf9b-a8da65147508','acabogados','8253898c-ddbd-45b9-b5dc-8799fa918d92','GEN S3000','2026-03-03 20:30:38','2026-03-03 20:30:38'),('1ebbe387-d034-4f5f-82cd-039442f1f19c','acabogados','8253898c-ddbd-45b9-b5dc-8799fa918d92','Digital Flex','2026-03-03 20:30:38','2026-03-03 20:30:38'),('20e15bb6-daf8-4a94-8bbd-f7adb78d39b5','acabogados','33dcfc94-78a7-4201-b27d-a03d5f01b824','220','2026-03-03 20:30:37','2026-03-03 20:30:37'),('256dc626-0c1f-4021-b606-85c1b45742a1','acabogados','525e4971-d592-4ca7-b8f5-6b9fbe9329bb','SMG30','2026-03-03 20:30:38','2026-03-03 20:30:38'),('27ad87f3-5882-4bf8-a667-bbad4f626684','acabogados','d3e22e3a-c539-42af-a003-bda9d89697db','Cober X','2026-03-03 20:30:37','2026-03-03 20:30:37'),('27d41cf7-21cd-4360-8f9c-247e70b8e036','acabogados','8253898c-ddbd-45b9-b5dc-8799fa918d92','S1000','2026-03-03 20:30:38','2026-03-03 20:30:38'),('28c2fd8f-6cd3-45da-a804-84291c85f157','acabogados','8253898c-ddbd-45b9-b5dc-8799fa918d92','S4000','2026-03-03 20:30:38','2026-03-03 20:30:38'),('2f0b0102-4965-4875-b094-e8c0c3db2cbe','acabogados','67bb382b-bfaf-4f20-8b30-899ad018ec97','Plan Hoy','2026-03-03 20:30:37','2026-03-03 20:30:37'),('2f44b1ad-aa12-4b2c-bcae-f8557ade87a0','acabogados','82688395-8a25-4b1c-af5d-5917395f7162','PMO','2026-03-03 20:30:37','2026-03-03 20:30:37'),('3059d744-34fe-4546-a8e8-d30860470592','acabogados','8253898c-ddbd-45b9-b5dc-8799fa918d92','S5000','2026-03-03 20:30:38','2026-03-03 20:30:38'),('30ea8c80-94b8-4e86-8fc5-0081606b6e4c','acabogados','5f427cb6-bf4b-4060-99d9-17bef9b2d1aa','Oro','2026-03-03 20:30:38','2026-03-03 20:30:38'),('31ebe217-dbd0-4527-bab3-45c0ad8fddb0','acabogados','3ea76d72-af9a-49d0-abe2-858f8995bd6f','Classic','2026-03-03 20:30:38','2026-03-03 20:30:38'),('32a35bfb-16da-454a-a32e-441135152a6b','acabogados','525e4971-d592-4ca7-b8f5-6b9fbe9329bb','SMG40','2026-03-03 20:30:38','2026-03-03 20:30:38'),('338f6489-80a4-4149-a91f-3c40116710fe','acabogados','a4258120-c5d9-4c2a-8376-f016ddfdb603','4000','2026-03-03 20:30:38','2026-03-03 20:30:38'),('3514c536-ad98-4c5c-89b8-07bdc102481f','acabogados','43bd3315-22ba-46ce-8723-6b92332621fe','Plan Joven','2026-03-03 20:30:38','2026-03-03 20:30:38'),('397f9dbf-beeb-44cb-a734-6b7a8474039b','acabogados','67bb382b-bfaf-4f20-8b30-899ad018ec97','Plan Integral','2026-03-03 20:30:37','2026-03-03 20:30:37'),('3b6bc760-b461-47e5-928b-d9bfef21a2e0','acabogados','ff1ec821-cf94-4ab8-b875-f272f6c5dd86','Plan Único','2026-03-03 20:30:38','2026-03-03 20:30:38'),('4190b976-1a44-4b8f-89ab-17bc246bdc0b','acabogados','3ea76d72-af9a-49d0-abe2-858f8995bd6f','Familiar','2026-03-03 20:30:38','2026-03-03 20:30:38'),('41e567ec-2e57-4517-bec1-1c7f8ecdcefc','acabogados','4fcf2648-5776-44a5-b7b0-6c417211ee5f','Plan Único','2026-03-03 20:30:38','2026-03-03 20:30:38'),('46e65c86-6df7-4b6d-8681-74cda8dd7e55','acabogados','db8929c9-8ec3-4740-a927-8ca8e0ae1b24','Platino','2026-03-03 20:30:37','2026-03-03 20:30:37'),('48247239-3753-4903-a243-21a59ef4a548','acabogados','8253898c-ddbd-45b9-b5dc-8799fa918d92','ON','2026-03-03 20:30:38','2026-03-03 20:30:38'),('4a5ab4c8-cf82-4dc1-b50b-a24e22c0ab17','acabogados','f2179c4c-e5d7-490d-8ea1-d01d91af5dfc','Novo','2026-03-03 20:30:38','2026-03-03 20:30:38'),('4abc559c-947b-4c14-b318-6ed4a0b01686','acabogados','33dcfc94-78a7-4201-b27d-a03d5f01b824','330','2026-03-03 20:30:37','2026-03-03 20:30:37'),('4bcc3cdb-e318-44a6-9090-2b809b66f6e9','acabogados','82688395-8a25-4b1c-af5d-5917395f7162','BM180','2026-03-03 20:30:37','2026-03-03 20:30:37'),('4f4f2063-51b3-4a78-873f-def34b71cb81','acabogados','33dcfc94-78a7-4201-b27d-a03d5f01b824','440','2026-03-03 20:30:37','2026-03-03 20:30:37'),('51361af6-cb03-49f3-89ec-31824fb3f9e1','acabogados','8253898c-ddbd-45b9-b5dc-8799fa918d92','GEN S4500','2026-03-03 20:30:38','2026-03-03 20:30:38'),('517f7b5a-5f2f-4d68-aa02-74eff47421a3','acabogados','525e4971-d592-4ca7-b8f5-6b9fbe9329bb','SMG20','2026-03-03 20:30:38','2026-03-03 20:30:38'),('5381a9f8-8e76-4c0e-ad7a-365d4945f8ec','acabogados','459f6435-2a81-4f9f-8d29-6fda071cda08','650','2026-03-03 20:30:38','2026-03-03 20:30:38'),('53ef2a61-9968-47fd-b1d0-c2a248f9a97a','acabogados','3f93d73c-dbfd-4021-b607-be296d1541ae','BRONCE CLASSIC','2026-03-03 20:30:38','2026-03-03 20:30:38'),('53f71acd-b66b-48da-8069-a3c2f95db704','acabogados','403abf56-a6df-4869-93e3-41eda6a2957c','Plan Único','2026-03-03 20:30:37','2026-03-03 20:30:37'),('54f04541-692b-4f41-a184-2489d6689fc2','acabogados','13d369f8-4ca6-485a-89db-230e0c9d0267','A-704','2026-03-03 20:30:38','2026-03-03 20:30:38'),('562bca6a-e1ba-4d54-a22e-902aacc4bee0','acabogados','82688395-8a25-4b1c-af5d-5917395f7162','BM500','2026-03-03 20:30:37','2026-03-03 20:30:37'),('5770a1d9-5d15-4f93-8293-268171aea547','acabogados','5f427cb6-bf4b-4060-99d9-17bef9b2d1aa','NT','2026-03-03 20:30:38','2026-03-03 20:30:38'),('5cd8d06c-2a08-458a-b57d-713bf7126d32','acabogados','43bd3315-22ba-46ce-8723-6b92332621fe','A1','2026-03-03 20:30:38','2026-03-03 20:30:38'),('5d715f31-7ae2-45e8-92ae-209c57197ed0','acabogados','a4258120-c5d9-4c2a-8376-f016ddfdb603','2500','2026-03-03 20:30:38','2026-03-03 20:30:38'),('5f81efef-da01-4097-9a5c-e4ead7700647','acabogados','32410d10-3480-4d80-9d24-93041a3d88d4','Vita Más','2026-03-03 20:30:37','2026-03-03 20:30:37'),('61caa629-0a92-4cea-9986-608723fe962f','acabogados','5f427cb6-bf4b-4060-99d9-17bef9b2d1aa','NU','2026-03-03 20:30:38','2026-03-03 20:30:38'),('62c342f4-77de-48dd-84b4-781f0458f1f1','acabogados','8253898c-ddbd-45b9-b5dc-8799fa918d92','GEN S3500','2026-03-03 20:30:38','2026-03-03 20:30:38'),('63f52841-74d2-480e-bb85-bba43015bd31','acabogados','459f6435-2a81-4f9f-8d29-6fda071cda08','510','2026-03-03 20:30:38','2026-03-03 20:30:38'),('6851068a-d8cd-4f00-b069-140329a74daf','acabogados','459f6435-2a81-4f9f-8d29-6fda071cda08','750','2026-03-03 20:30:38','2026-03-03 20:30:38'),('6a48988d-369b-4629-9593-580c2b5eb4d6','acabogados','d3e22e3a-c539-42af-a003-bda9d89697db','Taylored','2026-03-03 20:30:37','2026-03-03 20:30:37'),('6b9254f5-b3d1-4943-8f08-0d7583cc566c','acabogados','43bd3315-22ba-46ce-8723-6b92332621fe','A2','2026-03-03 20:30:38','2026-03-03 20:30:38'),('6ce02b6a-17ed-4ff8-bd67-a1d03fb8f958','acabogados','3147203e-51d8-4531-9cab-8e6ec54163bf','Plan Único','2026-03-03 20:30:38','2026-03-03 20:30:38'),('6d59288d-c376-4b01-9db8-6ebb7e3982f2','acabogados','db8929c9-8ec3-4740-a927-8ca8e0ae1b24','3.2','2026-03-03 20:30:37','2026-03-03 20:30:37'),('6db9a4ae-f649-4283-a9de-d04726de0c3b','acabogados','2380f620-5ce9-4da3-a645-994bd4f3a75f','PMO','2026-03-03 20:30:38','2026-03-03 20:30:38'),('6e3ac3d2-abfa-4fa7-b7f5-36f2899e092f','acabogados','9dbab01b-6ada-4d32-bcf3-485c81d308cc','Global','2026-03-03 20:30:38','2026-03-03 20:30:38'),('719eb4af-e41b-40f0-943e-69deb726d5d5','acabogados','2380f620-5ce9-4da3-a645-994bd4f3a75f','400','2026-03-03 20:30:38','2026-03-03 20:30:38'),('71f0ac5d-5482-4dbc-b229-00685913afdb','acabogados','332f4171-df5d-4a18-a76a-7927fb663911','Plan Único','2026-03-03 20:30:38','2026-03-03 20:30:38'),('725027ae-e9ff-4455-9925-ac3d8d186930','acabogados','459f6435-2a81-4f9f-8d29-6fda071cda08','410','2026-03-03 20:30:38','2026-03-03 20:30:38'),('73184ef5-132b-4ae3-89cd-bd13109fa2b4','acabogados','525e4971-d592-4ca7-b8f5-6b9fbe9329bb','SMG60','2026-03-03 20:30:38','2026-03-03 20:30:38'),('74b8dd13-9fd3-4878-aabb-006d014f0972','acabogados','db8929c9-8ec3-4740-a927-8ca8e0ae1b24','310','2026-03-03 20:30:37','2026-03-03 20:30:37'),('75a3e71b-91c7-49f0-8fe3-f6d53093104d','acabogados','525e4971-d592-4ca7-b8f5-6b9fbe9329bb','SMG50','2026-03-03 20:30:38','2026-03-03 20:30:38'),('78b33ea7-eaef-4128-857e-1dca360b5359','acabogados','db8929c9-8ec3-4740-a927-8ca8e0ae1b24','Dorado','2026-03-03 20:30:37','2026-03-03 20:30:37'),('7ab6dcad-e09f-4972-a01f-a8cc23eca5b4','acabogados','459f6435-2a81-4f9f-8d29-6fda071cda08','550','2026-03-03 20:30:38','2026-03-03 20:30:38'),('7c70ff1d-4229-410c-97c3-12c027b09739','acabogados','bf8c9792-96fe-4392-9e8d-7d635560ff15','Family','2026-03-03 20:30:38','2026-03-03 20:30:38'),('810588a2-ea9e-4062-b793-d527d13f47c8','acabogados','5d1e9d99-e073-407f-81bd-850aa73bf5a3','Plan Único','2026-03-03 20:30:38','2026-03-03 20:30:38'),('83f1760e-3a5f-4f64-b269-07adfab37da1','acabogados','44bd0a24-47c1-45cd-abee-05f625673879','Plan Único','2026-03-03 20:30:38','2026-03-03 20:30:38'),('845c8fb7-aeee-4c99-aaa4-b5d9fe14702c','acabogados','ca4a3262-9b78-4be7-b160-e9da7b1f7979','Conecta','2026-03-03 20:30:37','2026-03-03 20:30:37'),('85519ad0-4058-4cb2-b6dc-839651211d8c','acabogados','f2179c4c-e5d7-490d-8ea1-d01d91af5dfc','V','2026-03-03 20:30:38','2026-03-03 20:30:38'),('85a9437a-f373-43c1-8c06-403ff56a6832','acabogados','525e4971-d592-4ca7-b8f5-6b9fbe9329bb','SMG02','2026-03-03 20:30:38','2026-03-03 20:30:38'),('864e0682-9cb4-4a6a-8358-a4da1a3da1f7','acabogados','8253898c-ddbd-45b9-b5dc-8799fa918d92','S6000','2026-03-03 20:30:38','2026-03-03 20:30:38'),('890ecc8a-9936-4acb-9138-145030802ce7','acabogados','525e4971-d592-4ca7-b8f5-6b9fbe9329bb','SMG70','2026-03-03 20:30:38','2026-03-03 20:30:38'),('8ba5a65b-bcc6-4554-b8d1-fab6b17a3424','acabogados','3f93d73c-dbfd-4021-b607-be296d1541ae','PLATINUM','2026-03-03 20:30:38','2026-03-03 20:30:38'),('8c36933c-3cb8-4635-bac4-7410c07a2371','acabogados','bf8c9792-96fe-4392-9e8d-7d635560ff15','Azul','2026-03-03 20:30:38','2026-03-03 20:30:38'),('8cdebc09-d112-4724-89b0-33728295ba66','acabogados','ca4a3262-9b78-4be7-b160-e9da7b1f7979','Joven','2026-03-03 20:30:38','2026-03-03 20:30:38'),('8e8dce0b-86ce-4a15-93ea-4c6b824035d7','acabogados','13d369f8-4ca6-485a-89db-230e0c9d0267','A-401','2026-03-03 20:30:38','2026-03-03 20:30:38'),('8ea704eb-8ca0-4dcd-9704-f75e4e6a740f','acabogados','3f93d73c-dbfd-4021-b607-be296d1541ae','MEDIFÉ+','2026-03-03 20:30:38','2026-03-03 20:30:38'),('8febcf8c-cdbd-4454-baed-3a80e5ae8bde','acabogados','ca4a3262-9b78-4be7-b160-e9da7b1f7979','Elite','2026-03-03 20:30:37','2026-03-03 20:30:37'),('9418407c-dcf5-4a59-a420-d391dee5ca14','acabogados','32410d10-3480-4d80-9d24-93041a3d88d4','Aqua Más','2026-03-03 20:30:37','2026-03-03 20:30:37'),('9761d034-f209-4f66-b84a-5f76b3c04110','acabogados','8253898c-ddbd-45b9-b5dc-8799fa918d92','S3500','2026-03-03 20:30:38','2026-03-03 20:30:38'),('97e071a5-4829-40cf-b20a-084c114fbfa2','acabogados','a4258120-c5d9-4c2a-8376-f016ddfdb603','2000','2026-03-03 20:30:38','2026-03-03 20:30:38'),('989e792b-a49c-41d9-b971-a4d2aeeda175','acabogados','43bd3315-22ba-46ce-8723-6b92332621fe','On Demand','2026-03-03 20:30:38','2026-03-03 20:30:38'),('98fc9abe-69a9-40ee-888a-5220887428fe','acabogados','82688395-8a25-4b1c-af5d-5917395f7162','BM400','2026-03-03 20:30:37','2026-03-03 20:30:37'),('9de5b76f-ee45-4e5a-831d-cfa0f456d548','acabogados','db8929c9-8ec3-4740-a927-8ca8e0ae1b24','2.2','2026-03-03 20:30:37','2026-03-03 20:30:37'),('9ee9b16f-9c2a-4d0e-be0f-dc66ed80cbc0','acabogados','db8929c9-8ec3-4740-a927-8ca8e0ae1b24','4.2 Corporativo','2026-03-03 20:30:37','2026-03-03 20:30:37'),('a0f1aa51-06ec-4720-8fd5-d6de653b5d74','acabogados','525e4971-d592-4ca7-b8f5-6b9fbe9329bb','S1','2026-03-03 20:30:38','2026-03-03 20:30:38'),('a12a0d78-f055-4805-9cd4-01f8992018df','acabogados','5e2660e1-5684-4942-b020-e2171fe2bf13','Plan Único','2026-03-03 20:30:38','2026-03-03 20:30:38'),('a5212a07-56b5-4c8c-8332-cbd8814c109b','acabogados','459f6435-2a81-4f9f-8d29-6fda071cda08','210','2026-03-03 20:30:38','2026-03-03 20:30:38'),('a5b00848-527a-41ed-8450-845a9af81cff','acabogados','a4258120-c5d9-4c2a-8376-f016ddfdb603','1000','2026-03-03 20:30:38','2026-03-03 20:30:38'),('a8bb19d9-d709-4017-a801-bd3e5b29379e','acabogados','43bd3315-22ba-46ce-8723-6b92332621fe','A4','2026-03-03 20:30:38','2026-03-03 20:30:38'),('a9cf67db-1e5e-4e15-aadd-1dc0326407a3','acabogados','f2179c4c-e5d7-490d-8ea1-d01d91af5dfc','S','2026-03-03 20:30:38','2026-03-03 20:30:38'),('ab652ee7-f6b4-4079-abb6-e1c6cbe12680','acabogados','8253898c-ddbd-45b9-b5dc-8799fa918d92','ON 1','2026-03-03 20:30:38','2026-03-03 20:30:38'),('ad27a6cb-d53a-4b51-ae6f-d13d23afa73d','acabogados','5f427cb6-bf4b-4060-99d9-17bef9b2d1aa','NOW','2026-03-03 20:30:38','2026-03-03 20:30:38'),('adee11b5-d101-4c19-ba8a-8da62af3f607','acabogados','db8929c9-8ec3-4740-a927-8ca8e0ae1b24','110','2026-03-03 20:30:37','2026-03-03 20:30:37'),('affa0777-4a1f-420a-a5a2-84d50c39010f','acabogados','3f93d73c-dbfd-4021-b607-be296d1541ae','BRONCE','2026-03-03 20:30:38','2026-03-03 20:30:38'),('b39d3f05-9d56-4fa0-b7a8-9aafd3c72795','acabogados','459f6435-2a81-4f9f-8d29-6fda071cda08','450','2026-03-03 20:30:38','2026-03-03 20:30:38'),('b46f7d7d-6bbb-4336-882f-7ec1e1906041','acabogados','2380f620-5ce9-4da3-a645-994bd4f3a75f','300','2026-03-03 20:30:38','2026-03-03 20:30:38'),('b8c527da-1e73-4d66-86d1-caeea2ddc43f','acabogados','8253898c-ddbd-45b9-b5dc-8799fa918d92','Digital Flex 800','2026-03-03 20:30:38','2026-03-03 20:30:38'),('b8d87492-2fc4-407b-896a-9fae6b58c7ad','acabogados','33dcfc94-78a7-4201-b27d-a03d5f01b824','300','2026-03-03 20:30:37','2026-03-03 20:30:37'),('b932853a-5f90-4a86-8b51-f46d94146aaf','acabogados','3f93d73c-dbfd-4021-b607-be296d1541ae','PLATA','2026-03-03 20:30:38','2026-03-03 20:30:38'),('b9bb4d95-3f98-4183-87a5-21aac7e28f5f','acabogados','13d369f8-4ca6-485a-89db-230e0c9d0267','A-425','2026-03-03 20:30:38','2026-03-03 20:30:38'),('ba974880-b7e4-449e-a486-c66b2f28e4bb','acabogados','a4258120-c5d9-4c2a-8376-f016ddfdb603','800','2026-03-03 20:30:38','2026-03-03 20:30:38'),('bb17c232-4a93-4973-91f3-078eb9e1730f','acabogados','ca4a3262-9b78-4be7-b160-e9da7b1f7979','Impulsa','2026-03-03 20:30:37','2026-03-03 20:30:37'),('bef20635-0337-4840-922d-076f40d7b7d0','acabogados','8253898c-ddbd-45b9-b5dc-8799fa918d92','F800','2026-03-03 20:30:38','2026-03-03 20:30:38'),('bf377fdb-cd23-4c37-a3ba-bb15d61c3c6a','acabogados','41db3e7b-369c-4053-80c7-7d4593ce96ae','VITA','2026-03-03 20:30:37','2026-03-03 20:30:37'),('c0aa1b6f-9699-4da9-866b-06e0dcf295d9','acabogados','a4258120-c5d9-4c2a-8376-f016ddfdb603','Combinado','2026-03-03 20:30:38','2026-03-03 20:30:38'),('c21f0468-6957-4ed7-9e2f-f72c9383e548','acabogados','33dcfc94-78a7-4201-b27d-a03d5f01b824','550','2026-03-03 20:30:37','2026-03-03 20:30:37'),('c2eb6b57-120f-4215-b3fc-92658d9e5814','acabogados','43bd3315-22ba-46ce-8723-6b92332621fe','A6','2026-03-03 20:30:38','2026-03-03 20:30:38'),('c4fa0ff8-f766-4b12-ad98-051abdda88d0','acabogados','13d369f8-4ca6-485a-89db-230e0c9d0267','A-604','2026-03-03 20:30:38','2026-03-03 20:30:38'),('c53fecb4-7a2c-463a-bb34-f5c0bd8537d3','acabogados','8253898c-ddbd-45b9-b5dc-8799fa918d92','ON 2','2026-03-03 20:30:38','2026-03-03 20:30:38'),('c6ed7f27-7d7a-4a1f-a565-59ac568a8a9e','acabogados','8253898c-ddbd-45b9-b5dc-8799fa918d92','Digital Flex 1000','2026-03-03 20:30:38','2026-03-03 20:30:38'),('c74da34f-106a-4fe0-a5ae-c733b65f8ad3','acabogados','db8929c9-8ec3-4740-a927-8ca8e0ae1b24','210','2026-03-03 20:30:37','2026-03-03 20:30:37'),('c75ccc09-ab30-4bd8-a9d5-71f261a76eb7','acabogados','385643fa-451b-42c0-a7c9-8af11ff4a2c2','Plan Único','2026-03-03 20:30:38','2026-03-03 20:30:38'),('c83d9e8a-f62f-4b7a-9cda-69ee3cfba3b4','acabogados','0ccc52db-dc48-4eb4-888f-911234ef3e2b','Plan Único','2026-03-03 20:30:38','2026-03-03 20:30:38'),('ca78da80-5113-48c1-8770-37ef2fe0485d','acabogados','2380f620-5ce9-4da3-a645-994bd4f3a75f','C100','2026-03-03 20:30:38','2026-03-03 20:30:38'),('ccc6fc57-1158-4c0e-bfe6-12f997d0ee65','acabogados','13d369f8-4ca6-485a-89db-230e0c9d0267','A-406','2026-03-03 20:30:38','2026-03-03 20:30:38'),('cd2ebee6-0b14-49e6-a8f3-fc69c167b2dc','acabogados','d3e22e3a-c539-42af-a003-bda9d89697db','Wagon','2026-03-03 20:30:37','2026-03-03 20:30:37'),('ced4b8eb-b849-4f1e-bf23-fbb80ad113c4','acabogados','f2179c4c-e5d7-490d-8ea1-d01d91af5dfc','P','2026-03-03 20:30:38','2026-03-03 20:30:38'),('d2a18c94-f50b-46ca-b9d2-91b8bc6df017','acabogados','bf8c9792-96fe-4392-9e8d-7d635560ff15','Celeste','2026-03-03 20:30:38','2026-03-03 20:30:38'),('d30a951e-3152-482d-98f9-10c65f69bc07','acabogados','9dbab01b-6ada-4d32-bcf3-485c81d308cc','Genérico','2026-03-03 20:30:38','2026-03-03 20:30:38'),('d3ed48df-f852-4161-b5ef-50126611ec28','acabogados','459f6435-2a81-4f9f-8d29-6fda071cda08','310','2026-03-03 20:30:38','2026-03-03 20:30:38'),('d4d1764b-75c2-4712-8acb-95a431d19720','acabogados','9dbab01b-6ada-4d32-bcf3-485c81d308cc','Midoc','2026-03-03 20:30:38','2026-03-03 20:30:38'),('d5f41637-81a1-41dd-bb4d-4cf9d084d443','acabogados','43f5bdb3-bf14-4f36-bd39-64cf623297d6','Plan Único','2026-03-03 20:30:37','2026-03-03 20:30:37'),('dc5aabfd-7e87-4a6c-80fb-93f16e0c2aa9','acabogados','5f427cb6-bf4b-4060-99d9-17bef9b2d1aa','Plata','2026-03-03 20:30:38','2026-03-03 20:30:38'),('df3dc8ff-a366-468c-a287-7cdc76057bc0','acabogados','2380f620-5ce9-4da3-a645-994bd4f3a75f','500','2026-03-03 20:30:38','2026-03-03 20:30:38'),('e19955c2-a0bb-44b8-84ad-1e03aca9c481','acabogados','43bd3315-22ba-46ce-8723-6b92332621fe','A5','2026-03-03 20:30:38','2026-03-03 20:30:38'),('e22593aa-95bf-4b24-8020-82a185c9f1e2','acabogados','13d369f8-4ca6-485a-89db-230e0c9d0267','A-411','2026-03-03 20:30:38','2026-03-03 20:30:38'),('e2ed5ead-64fc-403d-b1fe-1fe8522568a7','acabogados','13d369f8-4ca6-485a-89db-230e0c9d0267','Joven','2026-03-03 20:30:38','2026-03-03 20:30:38'),('e31b5ba6-7971-4d24-984b-c5639cd00bc4','acabogados','8253898c-ddbd-45b9-b5dc-8799fa918d92','GEN S1000','2026-03-03 20:30:38','2026-03-03 20:30:38'),('e5856fb7-a6e1-4f98-b4ef-593734bdbbbb','acabogados','db8929c9-8ec3-4740-a927-8ca8e0ae1b24','Azul','2026-03-03 20:30:37','2026-03-03 20:30:37'),('e96217af-79f1-4cf8-ae65-c4a5f3111c85','acabogados','bf8c9792-96fe-4392-9e8d-7d635560ff15','Conecta','2026-03-03 20:30:38','2026-03-03 20:30:38'),('e99d7d30-85e6-4d3f-a044-c3f182241b2c','acabogados','8253898c-ddbd-45b9-b5dc-8799fa918d92','S4500','2026-03-03 20:30:38','2026-03-03 20:30:38'),('ea727e15-6a9b-4214-a495-3f64be1cadf2','acabogados','ca4a3262-9b78-4be7-b160-e9da7b1f7979','Avanza','2026-03-03 20:30:37','2026-03-03 20:30:37'),('eaa57c3b-205a-4c62-bc53-ac13a66bc88a','acabogados','d3e22e3a-c539-42af-a003-bda9d89697db','Classic X','2026-03-03 20:30:37','2026-03-03 20:30:37'),('f1043a2e-5db9-41ba-ae6d-590437bf62b5','acabogados','bf8c9792-96fe-4392-9e8d-7d635560ff15','Integra','2026-03-03 20:30:38','2026-03-03 20:30:38'),('f128a66d-3383-4c39-936c-e27b3e55c253','acabogados','f2179c4c-e5d7-490d-8ea1-d01d91af5dfc','N','2026-03-03 20:30:38','2026-03-03 20:30:38'),('f6eae2fe-fa0d-48de-831d-97893fb5d153','acabogados','459f6435-2a81-4f9f-8d29-6fda071cda08','Flux','2026-03-03 20:30:38','2026-03-03 20:30:38'),('f710076e-aa17-4984-9434-182a8349a272','acabogados','33dcfc94-78a7-4201-b27d-a03d5f01b824','18-25','2026-03-03 20:30:37','2026-03-03 20:30:37'),('f7fd522e-8de6-41cf-ab56-1171aeceb7f3','acabogados','a4258120-c5d9-4c2a-8376-f016ddfdb603','3000','2026-03-03 20:30:38','2026-03-03 20:30:38'),('f92f321b-7be5-4fe1-a1f6-b5eef1c5255b','acabogados','2380f620-5ce9-4da3-a645-994bd4f3a75f','200','2026-03-03 20:30:38','2026-03-03 20:30:38'),('f9386d60-6af4-491f-b8e8-965af4507355','acabogados','9dbab01b-6ada-4d32-bcf3-485c81d308cc','Premium','2026-03-03 20:30:38','2026-03-03 20:30:38'),('fabe60aa-f2cc-440a-bf98-bf5a31b486a8','acabogados','41db3e7b-369c-4053-80c7-7d4593ce96ae','MAGNA','2026-03-03 20:30:37','2026-03-03 20:30:37'),('fb6b854d-ee9e-4ded-9a87-7da2cc70529f','acabogados','33dcfc94-78a7-4201-b27d-a03d5f01b824','400','2026-03-03 20:30:37','2026-03-03 20:30:37'),('fc3002b7-0283-40cc-aa6e-2fabb48f453d','acabogados','9dbab01b-6ada-4d32-bcf3-485c81d308cc','Clasico','2026-03-03 20:30:38','2026-03-03 20:30:38'),('fc9336d7-1dd5-40b1-ba02-aeb378ce16be','acabogados','8253898c-ddbd-45b9-b5dc-8799fa918d92','GEN S1500','2026-03-03 20:30:38','2026-03-03 20:30:38'),('fd26a5a1-c66c-4a52-b5ce-9bc094b12379','acabogados','8253898c-ddbd-45b9-b5dc-8799fa918d92','S3000','2026-03-03 20:30:38','2026-03-03 20:30:38'),('fe072307-3c03-4d4a-9846-8ede731b2491','acabogados','67bb382b-bfaf-4f20-8b30-899ad018ec97','Plan Superior','2026-03-03 20:30:37','2026-03-03 20:30:37');
/*!40000 ALTER TABLE `medical_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mercadopago_accounts`
--

DROP TABLE IF EXISTS `mercadopago_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mercadopago_accounts` (
  `id` varchar(36) NOT NULL,
  `tenantId` varchar(255) NOT NULL,
  `mpUserId` varchar(255) DEFAULT NULL,
  `accessTokenEncrypted` text NOT NULL,
  `refreshTokenEncrypted` text NOT NULL,
  `expiresAt` datetime DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'active',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mercadopago_accounts_tenant` (`tenantId`),
  KEY `idx_mercadopago_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mercadopago_accounts`
--

LOCK TABLES `mercadopago_accounts` WRITE;
/*!40000 ALTER TABLE `mercadopago_accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `mercadopago_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `professional_profiles`
--

DROP TABLE IF EXISTS `professional_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `professional_profiles` (
  `userId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'default',
  `isActive` tinyint(1) DEFAULT '1',
  `googleCalendarId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Color en formato hexadecimal (ej: #FF5733)',
  `licenseNumber` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `medicalCoverages` json DEFAULT NULL,
  `availabilityConfig` json DEFAULT NULL,
  `availableDays` json DEFAULT NULL COMMENT 'DÃ­as de la semana disponibles (0=Domingo, 1=Lunes, ..., 6=SÃ¡bado)',
  `availableHours` json DEFAULT NULL COMMENT 'Horarios disponibles en formato JSON: {"start": "09:00", "end": "18:00"}',
  PRIMARY KEY (`userId`),
  KEY `idx_active` (`isActive`),
  KEY `fk_professional_profiles_tenant` (`tenantId`),
  CONSTRAINT `fk_professional_profiles_tenant` FOREIGN KEY (`tenantId`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `professional_profiles_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `professional_profiles`
--

LOCK TABLES `professional_profiles` WRITE;
/*!40000 ALTER TABLE `professional_profiles` DISABLE KEYS */;
INSERT INTO `professional_profiles` VALUES ('03d63d80-675c-4ce1-9349-73d5310b661f','capsif',1,NULL,'2026-03-11 22:43:51','2026-03-11 22:45:12','#54a0ff',NULL,'[]','{\"days\": {\"0\": {\"slots\": []}, \"1\": {\"slots\": [{\"id\": \"35eyhnals\", \"repeat\": \"weekly\", \"toDate\": null, \"endTime\": \"18:00\", \"fromDate\": \"2026-03-11\", \"startTime\": \"09:00\"}]}, \"2\": {\"slots\": []}, \"3\": {\"slots\": [{\"id\": \"0ea513o5w\", \"repeat\": \"weekly\", \"toDate\": null, \"endTime\": \"18:00\", \"fromDate\": \"2026-03-11\", \"startTime\": \"09:00\"}]}, \"4\": {\"slots\": []}, \"5\": {\"slots\": []}, \"6\": {\"slots\": []}}, \"holidays\": []}',NULL,NULL),('ec117d3e-376c-4452-9f5f-d8d516dccf4e','acabogados',1,NULL,'2026-03-03 20:29:20','2026-03-03 20:39:20','#c44569',NULL,'[]','{\"days\": {\"0\": {\"slots\": []}, \"1\": {\"slots\": [{\"id\": \"t0619up1u\", \"repeat\": \"weekly\", \"toDate\": null, \"endTime\": \"18:00\", \"fromDate\": \"2026-03-03\", \"startTime\": \"09:00\"}]}, \"2\": {\"slots\": [{\"id\": \"2ui7nsppp\", \"repeat\": \"weekly\", \"toDate\": null, \"endTime\": \"18:00\", \"fromDate\": \"2026-03-03\", \"startTime\": \"09:00\"}]}, \"3\": {\"slots\": [{\"id\": \"xl4ez98t9\", \"repeat\": \"weekly\", \"toDate\": null, \"endTime\": \"18:00\", \"fromDate\": \"2026-03-03\", \"startTime\": \"09:00\"}]}, \"4\": {\"slots\": [{\"id\": \"q21p4pc65\", \"repeat\": \"weekly\", \"toDate\": null, \"endTime\": \"18:00\", \"fromDate\": \"2026-03-03\", \"startTime\": \"12:00\"}]}, \"5\": {\"slots\": []}, \"6\": {\"slots\": []}}, \"holidays\": []}',NULL,NULL);
/*!40000 ALTER TABLE `professional_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `durationMinutes` int NOT NULL DEFAULT '60',
  `marginMinutes` int NOT NULL DEFAULT '0',
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `seniaPercent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES ('711f5b11-0f10-452c-8678-29abe5b1622a','default','Sesion simple','Sesion simple de 45min',45,15,40000.00,50.00,'2026-02-02 19:43:16','2026-02-02 19:43:16'),('bcd7fc28-ea51-4480-a38c-cff2908c1139','default','Sesion Gratis','Es una sesion de 45min gratis',45,15,0.00,0.00,'2026-02-02 19:47:42','2026-02-02 19:47:42');
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_features`
--

DROP TABLE IF EXISTS `tenant_features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_features` (
  `tenantId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `features` json DEFAULT NULL,
  `limits` json DEFAULT NULL,
  `usage` json DEFAULT NULL,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_features`
--

LOCK TABLES `tenant_features` WRITE;
/*!40000 ALTER TABLE `tenant_features` DISABLE KEYS */;
INSERT INTO `tenant_features` VALUES ('capsif','{\"calendar\": true, \"show_coverage\": true, \"payment_enabled\": true, \"show_mercado_pago\": false}','{\"maxUsers\": 16, \"whatsappRemindersLimit\": 0}','{}','2026-03-11 22:41:23');
/*!40000 ALTER TABLE `tenant_features` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_payments`
--

DROP TABLE IF EXISTS `tenant_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_payments` (
  `tenantId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `settings` json DEFAULT NULL,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_payments`
--

LOCK TABLES `tenant_payments` WRITE;
/*!40000 ALTER TABLE `tenant_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `tenant_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_settings`
--

DROP TABLE IF EXISTS `tenant_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_settings` (
  `tenantId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `settings` json DEFAULT NULL,
  `permissions` json DEFAULT NULL,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_settings`
--

LOCK TABLES `tenant_settings` WRITE;
/*!40000 ALTER TABLE `tenant_settings` DISABLE KEYS */;
INSERT INTO `tenant_settings` VALUES ('acabogados','{\"isActive\": true, \"patientLabel\": \"Pacientes\", \"notifications\": {\"sms\": false, \"email\": false, \"whatsapp\": false}, \"depositPercent\": 0, \"maxAnticipation\": 60, \"minAnticipation\": 2, \"cancelationLimit\": 0, \"professionalLabel\": \"Profesionales\", \"cancellationPolicy\": \"\", \"refundPolicyMessage\": \"\", \"manualTurnConfirmation\": false, \"whatsappReminderOption\": \"48\", \"defaultSlotMarginMinutes\": 15, \"defaultSlotDurationMinutes\": 45}',NULL,'2026-03-09 19:40:32'),('capsif','{\"isActive\": true, \"patientLabel\": \"Pacientes\", \"notifications\": {\"sms\": false, \"email\": false, \"whatsapp\": false}, \"depositPercent\": 0, \"maxAnticipation\": 30, \"minAnticipation\": 2, \"cancelationLimit\": 0, \"professionalLabel\": \"Profesionales\", \"cancellationPolicy\": \"\", \"refundPolicyMessage\": \"\", \"manualTurnConfirmation\": false, \"whatsappReminderOption\": \"48\", \"defaultSlotMarginMinutes\": 15, \"defaultSlotDurationMinutes\": 45}',NULL,'2026-03-11 22:43:05');
/*!40000 ALTER TABLE `tenant_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenants`
--

DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenants` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logoUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
INSERT INTO `tenants` VALUES ('acabogados','Aldana',NULL,1,'2026-03-03 20:11:58','2026-03-03 20:11:58'),('capsif','capsif',NULL,1,'2026-03-11 22:41:23','2026-03-11 22:41:23');
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'default',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `googleId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `firstName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `passwordHash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('PATIENT','PROFESSIONAL','ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `dni` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coverage` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dateOfBirth` date DEFAULT NULL,
  `admissionDate` date DEFAULT NULL,
  `gender` enum('Masculino','Femenino','No binario') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nationality` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `googleId` (`googleId`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_users_tenant` (`tenantId`),
  CONSTRAINT `fk_users_tenant` FOREIGN KEY (`tenantId`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('03d63d80-675c-4ce1-9349-73d5310b661f','capsif','brendacaouris@hotmail.com',NULL,'brenda caouris',NULL,NULL,'1ccf055547193f3edaa73bf8415d5f44:6dd15a7a2eaef6a310d8b95ecbb5d90c2a2bee15235b4408d0b0826912d3224af92d68bd312ad3120f56b10952a876488c81446849fafbd76df7b491b3e8fbdb','PROFESSIONAL','2026-03-11 22:43:51','2026-03-11 22:43:51',NULL,NULL,'25989471',NULL,NULL,NULL,NULL,NULL,NULL),('790eebc7-b322-4fea-89cd-8d817d502f4b','acabogados','seba.furfaro@gmail.com',NULL,'Sebastian Furfaro','Sebastian','Furfaro','d76910e71dd8c8af6ef595250362fa2d:c304ad3a929a4c5795a8bf5da7ca078aa96ef04cfa9917b08b1c37ee3f99cde0fd5122f0514e8d97db1e1e924bf6632e820f5a30c55189b8845bb8e4ad6186dc','PATIENT','2026-03-03 20:50:01','2026-03-04 19:11:52','01122390724','Argerich 1813\n1B','32401625','','',NULL,NULL,NULL,''),('a308d22e-1e90-47a6-a766-6ee8515f585b','capsif','caourisaldana@gmail.com',NULL,'caourisaldana',NULL,NULL,'5d0eb00ebe98ac54d6a89f0665da17cd:c92b6e13c476aff83f12e163c1c87ae1f67c5ed799b8fba937103e15ef318e8b77116892724ab8bcc453808c33cdd6085f97f75a87a9cba462614db48984e5a0','ADMIN','2026-03-11 22:41:23','2026-03-11 22:41:23',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),('e69c4a8c-b1a6-43ec-bfe5-f9fa6de92d88','acabogados','gaspar.furfaro@gmail.com',NULL,'Gaspar Furfaro','Gaspar','Furfaro','069027401cc6fcae181c70e53d323b9c:2253be4faaedb43b63d9f528af5bbbf6857ea7ad23b1cbd2e9f8cb18afd83098b2d20aef85e198dd9bcc5fa596e0f4d1963ec273ad290ebeb020235d5c01a208','PATIENT','2026-03-11 15:49:18','2026-03-11 15:50:56','47345110','','55900909','Swiss Medical','SMG02',NULL,NULL,'Masculino','Argentina'),('ec117d3e-376c-4452-9f5f-d8d516dccf4e','acabogados','info@acabogados.com.ar',NULL,'Aldana Caouris',NULL,NULL,'554f368d3851ec2fe4b13f6b5316eaeb:67e3b1c8b93057ab9ec573a838f2c55e50d99ab2b44afc6475d69ceb12480d49ef7ec424838cea5b456f09a8a7e22dc7f67db6666e6a3d062f3481761c88540a','ADMIN','2026-03-03 20:11:58','2026-03-03 20:39:29',NULL,NULL,'36896125',NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12  8:45:05
