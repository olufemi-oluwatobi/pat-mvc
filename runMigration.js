import { Client } from "./core/models/helpers";

const createTable = async () => {
  try {
    const hasTable = await Client.schema.hasTable("userino");
    if (!hasTable) {
      Client.schema
        .raw(
          "CREATE TABLE `userino` (`id` int NOT NULL AUTO_INCREMENT, `password` varchar(200) NOT NULL,`email` varchar(45) NOT NULL,`name` varchar(45) DEFAULT NULL, `createdAt` datetime DEFAULT NULL,`updatedAt` datetime DEFAULT NULL,PRIMARY KEY (`id`),UNIQUE KEY `email_UNIQUE` (`email`)) "
        )
        .then((res) => {
          console.log("TABLE CREATED:", res);
        })
        .catch(function (err) {
          console.log("ERR:", err.message);
        });
    }
  } catch (error) {
    console.error(error);
  }
};

export default createTable;
