CREATE TABLE `product_embeddings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`imageEmbedding` text NOT NULL,
	`textEmbedding` text NOT NULL,
	`hybridEmbedding` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_embeddings_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_embeddings_productId_unique` UNIQUE(`productId`)
);
