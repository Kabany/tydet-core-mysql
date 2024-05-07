import { MysqlJoinType, QueryAlterTable, QueryCount, QueryCreateTable, QueryDelete, QueryDropTable, QueryFind, QueryFindOne, QueryInsert, QueryRenameTable, QueryUpdate } from "../src/mysql.query"
import { MysqlDataType } from "../src/mysql.schema"
import { MysqlQuery } from "../src/mysql.service"

const TABLE = "my_table"

describe("Mysql Query", () => {

  describe("Create Table", () => {
    it("simple create table query", () => {
      let create = QueryCreateTable(TABLE).addColumn("name", MysqlDataType.VARCHAR).addColumn("lastName", MysqlDataType.VARCHAR).toQuery()
      expect(create.sql).toBe("CREATE TABLE IF NOT EXISTS \`my_table\` (\`name\` VARCHAR(255) NOT NULL, \`lastName\` VARCHAR(255) NOT NULL);")
      expect(create.params.length).toBe(0)
    })
    it("if not exists to false", () => {
      let create = QueryCreateTable(TABLE, false).addColumn("name", MysqlDataType.VARCHAR).toQuery()
      expect(create.sql).toBe("CREATE TABLE \`my_table\` (\`name\` VARCHAR(255) NOT NULL);")
      expect(create.params.length).toBe(0)
    })
    it("int columns", () => {
      let create = QueryCreateTable(TABLE, false)
        .addColumn("id", MysqlDataType.INT, {primaryKey: true, autoincrement: true, nullable: false})
        .addColumn("age", MysqlDataType.INT)
        .addColumn("cards", MysqlDataType.INT, {nullable: true, size: 10})
        .addColumn("employee", MysqlDataType.INT, {nullable: false, unique: true})
        .addColumn("bags", MysqlDataType.INT, {default: 100})
        .toQuery()
      expect(create.sql).toBe("CREATE TABLE \`my_table\` (\`id\` INT NOT NULL AUTO_INCREMENT, PRIMARY KEY (\`id\`), \`age\` INT NOT NULL, \`cards\` INT NULL, \`employee\` INT NOT NULL UNIQUE, \`bags\` INT NOT NULL DEFAULT ?);")
      expect(create.params.length).toBe(1)
      expect(create.params[0]).toBe(100)
    })
    it("other int types", () => {
      let create = QueryCreateTable(TABLE, false)
        .addColumn("id", MysqlDataType.BIGINT, {primaryKey: true, autoincrement: true, nullable: false})
        .addColumn("age", MysqlDataType.MEDIUMINT)
        .addColumn("cards", MysqlDataType.TINYINT, {nullable: true, size: 10})
        .addColumn("employee", MysqlDataType.SMALLINT, {nullable: false, unique: true})
        .addColumn("bags", MysqlDataType.INT, {default: 100})
        .toQuery()
      expect(create.sql).toBe("CREATE TABLE \`my_table\` (\`id\` BIGINT NOT NULL AUTO_INCREMENT, PRIMARY KEY (\`id\`), \`age\` MEDIUMINT NOT NULL, \`cards\` TINYINT NULL, \`employee\` SMALLINT NOT NULL UNIQUE, \`bags\` INT NOT NULL DEFAULT ?);")
      expect(create.params.length).toBe(1)
      expect(create.params[0]).toBe(100)
    })
    it("decimal columns", () => {
      let create = QueryCreateTable(TABLE, false)
        .addColumn("id", MysqlDataType.INT, {primaryKey: true, autoincrement: true, nullable: false})
        .addColumn("total", MysqlDataType.DECIMAL)
        .addColumn("subtotal", MysqlDataType.DECIMAL, {nullable: true, size: 5, decimal: 2})
        .toQuery()
      expect(create.sql).toBe("CREATE TABLE \`my_table\` (\`id\` INT NOT NULL AUTO_INCREMENT, PRIMARY KEY (\`id\`), \`total\` DECIMAL(10,2) NOT NULL, \`subtotal\` DECIMAL(5,2) NULL);")
      expect(create.params.length).toBe(0)
    })
    it("string columns", () => {
      let create = QueryCreateTable(TABLE, false)
        .addColumn("uid", MysqlDataType.VARCHAR, {primaryKey: true, autoincrement: true, nullable: false})
        .addColumn("name", MysqlDataType.VARCHAR)
        .addColumn("email", MysqlDataType.VARCHAR, {nullable: true, size: 50})
        .addColumn("employee", MysqlDataType.VARCHAR, {nullable: false, unique: true})
        .addColumn("bags", MysqlDataType.VARCHAR, {default: "mybag"})
        .toQuery()
      expect(create.sql).toBe("CREATE TABLE \`my_table\` (\`uid\` VARCHAR(255) NOT NULL, PRIMARY KEY (\`uid\`), \`name\` VARCHAR(255) NOT NULL, \`email\` VARCHAR(50) NULL, \`employee\` VARCHAR(255) NOT NULL UNIQUE, \`bags\` VARCHAR(255) NOT NULL DEFAULT ?);")
      expect(create.params.length).toBe(1)
      expect(create.params[0]).toBe("mybag")
    })
    it("other string types", () => {
      let create = QueryCreateTable(TABLE, false)
        .addColumn("uid", MysqlDataType.VARCHAR, {primaryKey: true, autoincrement: true, nullable: false})
        .addColumn("name", MysqlDataType.VARCHAR)
        .addColumn("email", MysqlDataType.TEXT, {nullable: true, size: 50})
        .addColumn("employee", MysqlDataType.VARCHAR, {nullable: false, unique: true})
        .addColumn("bags", MysqlDataType.LONGTEXT, {default: "mybag"})
        .toQuery()
      expect(create.sql).toBe("CREATE TABLE \`my_table\` (\`uid\` VARCHAR(255) NOT NULL, PRIMARY KEY (\`uid\`), \`name\` VARCHAR(255) NOT NULL, \`email\` TEXT NULL, \`employee\` VARCHAR(255) NOT NULL UNIQUE, \`bags\` LONGTEXT NOT NULL DEFAULT ?);")
      expect(create.params.length).toBe(1)
      expect(create.params[0]).toBe("mybag")
    })
    it("boolean columns", () => {
      let create = QueryCreateTable(TABLE, false)
        .addColumn("id", MysqlDataType.INT, {primaryKey: true, autoincrement: true, nullable: false})
        .addColumn("isReady", MysqlDataType.BOOLEAN)
        .addColumn("isCompleted", MysqlDataType.BOOLEAN, {nullable: true, size: 50})
        .addColumn("isDone", MysqlDataType.BOOLEAN, {nullable: false, unique: true})
        .addColumn("isCreated", MysqlDataType.BOOLEAN, {default: true})
        .toQuery()
      expect(create.sql).toBe("CREATE TABLE \`my_table\` (\`id\` INT NOT NULL AUTO_INCREMENT, PRIMARY KEY (\`id\`), \`isReady\` BOOLEAN NOT NULL, \`isCompleted\` BOOLEAN NULL, \`isDone\` BOOLEAN NOT NULL, \`isCreated\` BOOLEAN NOT NULL DEFAULT ?);")
      expect(create.params.length).toBe(1)
      expect(create.params[0]).toBeTruthy()
    })
    it("date columns", () => {
      let create = QueryCreateTable(TABLE, false)
        .addColumn("id", MysqlDataType.INT, {primaryKey: true, autoincrement: true, nullable: false})
        .addColumn("createdAt", MysqlDataType.DATE)
        .addColumn("updatedAt", MysqlDataType.DATETIME, {nullable: true, size: 50})
        .toQuery()
      expect(create.sql).toBe("CREATE TABLE \`my_table\` (\`id\` INT NOT NULL AUTO_INCREMENT, PRIMARY KEY (\`id\`), \`createdAt\` DATE NOT NULL, \`updatedAt\` DATETIME NULL);")
      expect(create.params.length).toBe(0)
    })
  })

  describe("Drop Table", () => {
    it("simple drop table query", () => {
      let drop = QueryDropTable(TABLE).toQuery()
      expect(drop.sql).toBe("DROP TABLE IF EXISTS \`my_table\`;")
      expect(drop.params.length).toBe(0)
    })
    it("if not exists to false", () => {
      let drop = QueryDropTable(TABLE, false).toQuery()
      expect(drop.sql).toBe("DROP TABLE \`my_table\`;")
      expect(drop.params.length).toBe(0)
    })
  })

  describe("Rename Table", () => {
    it("simple rename table query", () => {
      let rename = QueryRenameTable(TABLE, "new_table").toQuery()
      expect(rename.sql).toBe("ALTER TABLE \`my_table\` RENAME TO \`new_table\`;")
      expect(rename.params.length).toBe(0)
    })
  })

  describe("Alter Table", () => {
    it("simple alter table query", () => {
      let alter = QueryAlterTable(TABLE).addColumn("name", MysqlDataType.VARCHAR).modifyColumn("lastName", MysqlDataType.VARCHAR, {after: "name"}).dropColumn("email").toQuery()
      expect(alter.sql).toBe("ALTER TABLE \`my_table\` ADD COLUMN \`name\` VARCHAR(255) NOT NULL, MODIFY COLUMN \`lastName\` VARCHAR(255) NOT NULL AFTER \`name\`, DROP COLUMN \`email\`;")
      expect(alter.params.length).toBe(0)
    })
  })

  describe("CRUD methods", () => {
    it("QueryFind", async () => {
      let result = await QueryFind(null as any, "users", {name: "Luis"})
      let query = result[0] as MysqlQuery
      expect(query.params.length).toBe(3)
      expect(query.params[0]).toBe("Luis")
      expect(query.params[1]).toBe(1000)
      expect(query.params[2]).toBe(0)
      expect(query.sql).toBe("SELECT * FROM `users` WHERE `name` = ? LIMIT ? OFFSET ?;")
    })
    it("QueryFindOne", async () => {
      let result = await QueryFindOne(null as any, "users", {name: "Luis"})
      let query = result as MysqlQuery
      expect(query.params.length).toBe(3)
      expect(query.params[0]).toBe("Luis")
      expect(query.params[1]).toBe(1)
      expect(query.params[2]).toBe(0)
      expect(query.sql).toBe("SELECT * FROM `users` WHERE `name` = ? LIMIT ? OFFSET ?;")
    })
    it("QueryCount", async () => {
      let result = await QueryCount(null as any, "users", {name: "Luis"}) as any
      let query = result as MysqlQuery
      expect(query.params.length).toBe(1)
      expect(query.params[0]).toBe("Luis")
      expect(query.sql).toBe("SELECT COUNT(*) AS `total` FROM `users` WHERE `name` = ?;")
    })
    it("Query Select options", async () => {
      let result = await QueryFind(null as any, "users", {name: "Luis"}, {select: ["id", "email", {column: "firstName", as: "name"}, {column: "lastName", table: "users"}]})
      let query = result[0] as MysqlQuery
      expect(query.params.length).toBe(3)
      expect(query.params[0]).toBe("Luis")
      expect(query.params[1]).toBe(1000)
      expect(query.params[2]).toBe(0)
      expect(query.sql).toBe("SELECT `id`, `email`, `firstName` AS `name`, `users`.`lastName` FROM `users` WHERE `name` = ? LIMIT ? OFFSET ?;")
    })
    it("Query Join options", async () => {
      let result = await QueryFind(null as any, "users", {name: "Luis"}, {join: [
        {table: "comments", type: MysqlJoinType.INNER, on: {table: "users", column: "id"}, with: "userId"}
      ]})
      let query = result[0] as MysqlQuery
      expect(query.params.length).toBe(3)
      expect(query.params[0]).toBe("Luis")
      expect(query.params[1]).toBe(1000)
      expect(query.params[2]).toBe(0)
      expect(query.sql).toBe("SELECT * FROM `users` INNER JOIN `comments` ON `users`.`id` = `userId` WHERE `name` = ? LIMIT ? OFFSET ?;")
    })
    it("Query Where options", async () => {
      let result = await QueryFind(null as any, "users", {name: "Luis", "$t.users.email": "email@test.com", $or: [{status: 1}, {status: 2, isDeleted: false}]})
      let query = result[0] as MysqlQuery
      expect(query.params.length).toBe(7)
      expect(query.params[0]).toBe("Luis")
      expect(query.params[1]).toBe("email@test.com")
      expect(query.params[2]).toBe(1)
      expect(query.params[3]).toBe(2)
      expect(query.params[4]).toBeFalsy()
      expect(query.params[5]).toBe(1000)
      expect(query.params[6]).toBe(0)
      expect(query.sql).toBe("SELECT * FROM `users` WHERE `name` = ? AND `users`.`email` = ? AND ((`status` = ?) OR (`status` = ? AND `isDeleted` = ?)) LIMIT ? OFFSET ?;")
    })
    it("Query Where options 2", async () => {
      let result = await QueryFind(null as any, "users", {name: {$in: ["Luis", "Bastidas"]}, $and: [{age: {$gte: 18}}, {age: {$lte: 65}}], createdAt: {$between: {$from: new Date("2024-01-01"), $to: new Date("2024-04-01")}}})
      let query = result[0] as MysqlQuery
      expect(query.params.length).toBe(7)
      expect(query.params[0].length).toBe(2)
      expect(query.params[0][0]).toBe("Luis")
      expect(query.params[0][1]).toBe("Bastidas")
      expect(query.params[1]).toBe(18)
      expect(query.params[2]).toBe(65)
      expect(query.params[3].toISOString()).toBe("2024-01-01T00:00:00.000Z")
      expect(query.params[4].toISOString()).toBe("2024-04-01T00:00:00.000Z")
      expect(query.params[5]).toBe(1000)
      expect(query.params[6]).toBe(0)
      expect(query.sql).toBe("SELECT * FROM `users` WHERE `name` IN (?) AND (`age` >= ?) AND (`age` <= ?) AND (`createdAt` BETWEEN ? AND ?) LIMIT ? OFFSET ?;")
    })
    it("Query Group by options", async () => {
      let result = await QueryFind(null as any, "users", {name: "Luis"}, {groupBy: ["status", {column: "role", table: "users"}]})
      let query = result[0] as MysqlQuery
      expect(query.params.length).toBe(3)
      expect(query.params[0]).toBe("Luis")
      expect(query.params[1]).toBe(1000)
      expect(query.params[2]).toBe(0)
      expect(query.sql).toBe("SELECT * FROM `users` WHERE `name` = ? GROUP BY `status`, `users`.`role` LIMIT ? OFFSET ?;")
    })
    it("Query Order by options", async () => {
      let result = await QueryFind(null as any, "users", {name: "Luis"}, {orderBy: [{column: "lastName", order: "ASC"}, {column: "email", order: "ASC", table: "users"}]})
      let query = result[0] as MysqlQuery
      expect(query.params.length).toBe(3)
      expect(query.params[0]).toBe("Luis")
      expect(query.params[1]).toBe(1000)
      expect(query.params[2]).toBe(0)
      expect(query.sql).toBe("SELECT * FROM `users` WHERE `name` = ? ORDER BY `lastName` ASC, `users`.`email` ASC LIMIT ? OFFSET ?;")
    })
    it("Query Limit options", async () => {
      let result = await QueryFind(null as any, "users", {name: "Luis"}, {limit: {page: 2, per: 10}})
      let query = result[0] as MysqlQuery
      expect(query.params.length).toBe(3)
      expect(query.params[0]).toBe("Luis")
      expect(query.params[1]).toBe(10)
      expect(query.params[2]).toBe(10)
      expect(query.sql).toBe("SELECT * FROM `users` WHERE `name` = ? LIMIT ? OFFSET ?;")
    })
  })

  describe("Insert", () => {
    it("simple insert", async () => {
      let update = await QueryInsert(null as any, "users", {name: "Luis", lastName: "Example"})
      expect(update.query!.sql).toBe("INSERT INTO `users` (`name`, `lastName`) VALUES (?, ?);")
      expect(update.query!.params.length).toBe(2)
    })
  })

  describe("Update", () => {
    it("simple update", async () => {
      let update = await QueryUpdate(null as any, "users", {name: "Luis", lastName: "Example"}, {id: 2, email: "luis@email.com"})
      expect(update.query!.sql).toBe("UPDATE `users` SET `name` = ?, `lastName` = ? WHERE `id` = ? AND `email` = ?;")
      expect(update.query!.params.length).toBe(4)
    })
  })

  describe("Remove", () => {
    it("simple remove", async () => {
      let remove = await QueryDelete(null as any, "users", {id: 2})
      expect(remove.query!.sql).toBe("DELETE FROM `users` WHERE `id` = ?;")
      expect(remove.query!.params.length).toBe(1)
    })
  })

})