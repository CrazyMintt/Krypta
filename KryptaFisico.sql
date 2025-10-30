DROP DATABASE IF EXISTS `KryptaTeste`;
CREATE DATABASE IF NOT EXISTS `KryptaTeste` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `KryptaTeste`;

CREATE TABLE IF NOT EXISTS `usuario` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`nome` varchar(255) NOT NULL,
`email` varchar(255) NOT NULL,
`senha_mestre` varchar(255) NOT NULL,
`saltKDF` varchar(1024) NOT NULL,
`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (`id`),
UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `separadores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_pasta_raiz` int(11) DEFAULT NULL,
  `nome` varchar(255) NOT NULL,
  `tipo` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cor` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_pasta_raiz`
    FOREIGN KEY (`id_pasta_raiz`) REFERENCES `separadores`(`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `compartilhamento` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`owner_usuario_id` int(11) NOT NULL,
`n_acessos_total` bigint(20) NOT NULL DEFAULT 0,
`n_acessos_atual` bigint(20) NOT NULL DEFAULT 0,
`data_expiracao` datetime DEFAULT NULL,
`criado_em` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (`id`),
KEY `idx_compartilhamento_owner` (`owner_usuario_id`),
CONSTRAINT `compartilhamento_ibfk_1` FOREIGN KEY (`owner_usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `dados` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`usuario_id` int(11) NOT NULL,
`nome_aplicacao` varchar(255) DEFAULT NULL,
`descricao` text DEFAULT NULL,
`tipo` enum('arquivo','senha') NOT NULL,
`criado_em` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (`id`),
KEY `idx_dados_usuario_tipo` (`usuario_id`,`tipo`),
CONSTRAINT `dados_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `arquivos` (
`id` int(11) NOT NULL,
`arquivo` longblob DEFAULT NULL,
`extensao` varchar(50) DEFAULT NULL,
`nome_arquivo` varchar(255) DEFAULT NULL,
PRIMARY KEY (`id`),
CONSTRAINT `arquivos_ibfk_1` FOREIGN KEY (`id`) REFERENCES `dados` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `senhas` (
`id` int(11) NOT NULL,
`email` varchar(255),
`senha_cripto` varchar(1024) NOT NULL,
`host_url` varchar(1024) DEFAULT NULL,
PRIMARY KEY (`id`),
CONSTRAINT `senhas_ibfk_1` FOREIGN KEY (`id`) REFERENCES `dados` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `dados_compartilhados` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`compartilhamento_id` int(11) NOT NULL,
`dado_origem_id` int(11) DEFAULT NULL,
`dado_criptografado` longblob NOT NULL,
`meta` longtext DEFAULT NULL,
`criado_em` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (`id`),
KEY `compartilhamento_id` (`compartilhamento_id`),
KEY `dado_origem_id` (`dado_origem_id`),
CONSTRAINT `dados_compartilhados_ibfk_1` FOREIGN KEY (`compartilhamento_id`) REFERENCES `compartilhamento` (`id`) ON DELETE CASCADE,
CONSTRAINT `dados_compartilhados_ibfk_2` FOREIGN KEY (`dado_origem_id`) REFERENCES `dados` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `dados_separadores` (
`dado_id` int(11) NOT NULL,
`separador_id` int(11) NOT NULL,
PRIMARY KEY (`dado_id`,`separador_id`),
KEY `separador_id` (`separador_id`),
CONSTRAINT `dados_separadores_ibfk_1` FOREIGN KEY (`dado_id`) REFERENCES `dados` (`id`) ON DELETE CASCADE,
CONSTRAINT `dados_separadores_ibfk_2` FOREIGN KEY (`separador_id`) REFERENCES `separadores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `eventos` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`usuario_id` int(11) NOT NULL,
`notificacao` text DEFAULT NULL,
`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (`id`),
KEY `usuario_id` (`usuario_id`),
CONSTRAINT `eventos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `logs` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`usuario_id` int(11) DEFAULT NULL,
`dispositivo` varchar(255) DEFAULT NULL,
`data_hora` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
`ip` varchar(45) DEFAULT NULL,
`regiao` varchar(255) DEFAULT NULL,
`nome_aplicacao` varchar(255) DEFAULT NULL,
`tipo_acesso` varchar(100) NOT NULL,
`id_dado` int(11) DEFAULT NULL,
PRIMARY KEY (`id`),
KEY `idx_logs_usuario` (`usuario_id`),
KEY `logs_dados_FK` (`id_dado`),
CONSTRAINT `logs_dados_FK` FOREIGN KEY (`id_dado`) REFERENCES `dados` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER $$

CREATE PROCEDURE create_credential(
    IN p_usuario_id INT,
    IN p_nome_aplicacao VARCHAR(255),
    IN p_descricao TEXT,
    IN p_tipo ENUM('arquivo','senha'),
    IN p_senha_cripto VARCHAR(1024),
    IN p_email VARCHAR(255),
    IN p_host_url VARCHAR(1024),
    OUT p_dado_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Em caso de erro, define p_dado_id como NULL
        SET p_dado_id = NULL;
        ROLLBACK;
    END;

    START TRANSACTION;

    -- 1) Insere na tabela 'dados'
    INSERT INTO dados (usuario_id, nome_aplicacao, descricao, tipo)
    VALUES (p_usuario_id, p_nome_aplicacao, p_descricao, p_tipo);

    -- Pega o ID do dado recém-inserido
    SET p_dado_id = LAST_INSERT_ID();

    -- 2) Se for senha, insere também em 'senhas'
    IF p_tipo = 'senha' THEN
        INSERT INTO senhas (id, senha_cripto, email, host_url)
        VALUES (p_dado_id, p_senha_cripto, p_email, p_host_url);
    END IF;

    COMMIT;
END$$

DELIMITER ;

