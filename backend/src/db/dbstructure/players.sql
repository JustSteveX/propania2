CREATE TABLE `players` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` TEXT NOT NULL,
  `money` INT(11) NOT NULL,
  `exp` INT(11) NOT NULL,
  `level` INT(11) NOT NULL,
  `positionX` FLOAT NOT NULL,
  `positionY` FLOAT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `accountId` INT(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_players_accounts` (`accountId`),
  CONSTRAINT `fk_players_accounts` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;