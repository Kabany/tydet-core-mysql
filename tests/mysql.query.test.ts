import { AlterTable, CreateTable, DropTable, RenameTable } from "../src/mysql.query"
import { MysqlDataType } from "../src/mysql.schema"

const TABLE = "my_table"

describe("Mysql Query", () => {

  describe("Create Table", () => {
    it("simple create table query", () => {
      let create = CreateTable(TABLE).addColumn("name", MysqlDataType.VARCHAR).addColumn("lastName", MysqlDataType.VARCHAR).toQuery()
      expect(create.query).toBe("CREATE TABLE IF NOT EXISTS \`my_table\` (\`name\` VARCHAR(255) NOT NULL, \`lastName\` VARCHAR(255) NOT NULL);")
      expect(create.params.length).toBe(0)
    })
    it("if not exists to false", () => {
      let create = CreateTable(TABLE, false).addColumn("name", MysqlDataType.VARCHAR).toQuery()
      expect(create.query).toBe("CREATE TABLE \`my_table\` (\`name\` VARCHAR(255) NOT NULL);")
      expect(create.params.length).toBe(0)
    })
    it("int columns", () => {
      let create = CreateTable(TABLE, false)
        .addColumn("id", MysqlDataType.INT, {primaryKey: true, autoincrement: true, nullable: false})
        .addColumn("age", MysqlDataType.INT)
        .addColumn("cards", MysqlDataType.INT, {nullable: true, size: 10})
        .addColumn("employee", MysqlDataType.INT, {nullable: false, unique: true})
        .addColumn("bags", MysqlDataType.INT, {default: 100})
        .toQuery()
      expect(create.query).toBe("CREATE TABLE \`my_table\` (\`id\` INT NOT NULL AUTO_INCREMENT, PRIMARY KEY (\`id\`), \`age\` INT NOT NULL, \`cards\` INT NULL, \`employee\` INT NOT NULL UNIQUE, \`bags\` INT NOT NULL DEFAULT ?);")
      expect(create.params.length).toBe(1)
      expect(create.params[0]).toBe(100)
    })
    it("other int types", () => {
      let create = CreateTable(TABLE, false)
        .addColumn("id", MysqlDataType.BIGINT, {primaryKey: true, autoincrement: true, nullable: false})
        .addColumn("age", MysqlDataType.MEDIUMINT)
        .addColumn("cards", MysqlDataType.TINYINT, {nullable: true, size: 10})
        .addColumn("employee", MysqlDataType.SMALLINT, {nullable: false, unique: true})
        .addColumn("bags", MysqlDataType.INT, {default: 100})
        .toQuery()
      expect(create.query).toBe("CREATE TABLE \`my_table\` (\`id\` BIGINT NOT NULL AUTO_INCREMENT, PRIMARY KEY (\`id\`), \`age\` MEDIUMINT NOT NULL, \`cards\` TINYINT NULL, \`employee\` SMALLINT NOT NULL UNIQUE, \`bags\` INT NOT NULL DEFAULT ?);")
      expect(create.params.length).toBe(1)
      expect(create.params[0]).toBe(100)
    })
    it("decimal columns", () => {
      let create = CreateTable(TABLE, false)
        .addColumn("id", MysqlDataType.INT, {primaryKey: true, autoincrement: true, nullable: false})
        .addColumn("total", MysqlDataType.DECIMAL)
        .addColumn("subtotal", MysqlDataType.DECIMAL, {nullable: true, size: 5, decimal: 2})
        .toQuery()
      expect(create.query).toBe("CREATE TABLE \`my_table\` (\`id\` INT NOT NULL AUTO_INCREMENT, PRIMARY KEY (\`id\`), \`total\` DECIMAL(10,2) NOT NULL, \`subtotal\` DECIMAL(5,2) NULL);")
      expect(create.params.length).toBe(0)
    })
    it("string columns", () => {
      let create = CreateTable(TABLE, false)
        .addColumn("uid", MysqlDataType.VARCHAR, {primaryKey: true, autoincrement: true, nullable: false})
        .addColumn("name", MysqlDataType.VARCHAR)
        .addColumn("email", MysqlDataType.VARCHAR, {nullable: true, size: 50})
        .addColumn("employee", MysqlDataType.VARCHAR, {nullable: false, unique: true})
        .addColumn("bags", MysqlDataType.VARCHAR, {default: "mybag"})
        .toQuery()
      expect(create.query).toBe("CREATE TABLE \`my_table\` (\`uid\` VARCHAR(255) NOT NULL, PRIMARY KEY (\`uid\`), \`name\` VARCHAR(255) NOT NULL, \`email\` VARCHAR(50) NULL, \`employee\` VARCHAR(255) NOT NULL UNIQUE, \`bags\` VARCHAR(255) NOT NULL DEFAULT ?);")
      expect(create.params.length).toBe(1)
      expect(create.params[0]).toBe("mybag")
    })
    it("other string types", () => {
      let create = CreateTable(TABLE, false)
        .addColumn("uid", MysqlDataType.VARCHAR, {primaryKey: true, autoincrement: true, nullable: false})
        .addColumn("name", MysqlDataType.VARCHAR)
        .addColumn("email", MysqlDataType.TEXT, {nullable: true, size: 50})
        .addColumn("employee", MysqlDataType.VARCHAR, {nullable: false, unique: true})
        .addColumn("bags", MysqlDataType.LONGTEXT, {default: "mybag"})
        .toQuery()
      expect(create.query).toBe("CREATE TABLE \`my_table\` (\`uid\` VARCHAR(255) NOT NULL, PRIMARY KEY (\`uid\`), \`name\` VARCHAR(255) NOT NULL, \`email\` TEXT NULL, \`employee\` VARCHAR(255) NOT NULL UNIQUE, \`bags\` LONGTEXT NOT NULL DEFAULT ?);")
      expect(create.params.length).toBe(1)
      expect(create.params[0]).toBe("mybag")
    })
    it("boolean columns", () => {
      let create = CreateTable(TABLE, false)
        .addColumn("id", MysqlDataType.INT, {primaryKey: true, autoincrement: true, nullable: false})
        .addColumn("isReady", MysqlDataType.BOOLEAN)
        .addColumn("isCompleted", MysqlDataType.BOOLEAN, {nullable: true, size: 50})
        .addColumn("isDone", MysqlDataType.BOOLEAN, {nullable: false, unique: true})
        .addColumn("isCreated", MysqlDataType.BOOLEAN, {default: true})
        .toQuery()
      expect(create.query).toBe("CREATE TABLE \`my_table\` (\`id\` INT NOT NULL AUTO_INCREMENT, PRIMARY KEY (\`id\`), \`isReady\` BOOLEAN NOT NULL, \`isCompleted\` BOOLEAN NULL, \`isDone\` BOOLEAN NOT NULL, \`isCreated\` BOOLEAN NOT NULL DEFAULT ?);")
      expect(create.params.length).toBe(1)
      expect(create.params[0]).toBeTruthy()
    })
    it("date columns", () => {
      let create = CreateTable(TABLE, false)
        .addColumn("id", MysqlDataType.INT, {primaryKey: true, autoincrement: true, nullable: false})
        .addColumn("createdAt", MysqlDataType.DATE)
        .addColumn("updatedAt", MysqlDataType.DATETIME, {nullable: true, size: 50})
        .toQuery()
      expect(create.query).toBe("CREATE TABLE \`my_table\` (\`id\` INT NOT NULL AUTO_INCREMENT, PRIMARY KEY (\`id\`), \`createdAt\` DATE NOT NULL, \`updatedAt\` DATETIME NULL);")
      expect(create.params.length).toBe(0)
    })
  })

  describe("Drop Table", () => {
    it("simple drop table query", () => {
      let drop = DropTable(TABLE)
      expect(drop.query).toBe("DROP TABLE IF NOT EXISTS \`my_table\`;")
      expect(drop.params.length).toBe(0)
    })
    it("if not exists to false", () => {
      let drop = DropTable(TABLE, false)
      expect(drop.query).toBe("DROP TABLE \`my_table\`;")
      expect(drop.params.length).toBe(0)
    })
  })

  describe("Rename Table", () => {
    it("simple rename table query", () => {
      let rename = RenameTable(TABLE, "new_table")
      expect(rename.query).toBe("ALTER TABLE \`my_table\` RENAME TO \`new_table\`;")
      expect(rename.params.length).toBe(0)
    })
  })

  describe("Alter Table", () => {
    it("simple alter table query", () => {
      let alter = AlterTable(TABLE).addColumn("name", MysqlDataType.VARCHAR).modifyColumn("lastName", MysqlDataType.VARCHAR, {after: "name"}).dropColumn("email").toQuery()
      expect(alter.query).toBe("ALTER TABLE \`my_table\` ADD COLUMN \`name\` VARCHAR(255) NOT NULL, MODIFY COLUMN \`lastName\` VARCHAR(255) NOT NULL AFTER \`name\`, DROP COLUMN \`email\`;")
      expect(alter.params.length).toBe(0)
    })
  })

})