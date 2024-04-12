import { MysqlEntityValidationError } from "../src/mysql.error"
import { MysqlJoinType, QueryCount, QueryFind, QueryFindOne } from "../src/mysql.query"
import { MysqlDataType, MysqlEntity } from "../src/mysql.schema"
import { MysqlQuery } from "../src/mysql.service"



class User extends MysqlEntity {
  id: number
  firstName: string
  lastName: string
  email: string
}

User.DefineSchema("users", {
  id: {
    type: MysqlDataType.INT,
    primaryKey: true,
    required: true
  },
  firstName: MysqlDataType.VARCHAR,
  lastName: {
    type: MysqlDataType.VARCHAR,
    required: true
  },
  email: {
    type: MysqlDataType.VARCHAR
  }
})



describe("Mysql Schema", () => {

  describe("MysqlEntity default class", () => {
    it("Should return the class name", () => {
      expect(MysqlEntity.getTableName()).toBe("MysqlEntity")
    })
    it("Should return null for the PK", () => {
      expect(MysqlEntity.getPrimaryKey()).toBeNull()
    })
    it("Should return an empty array for the columns", () => {
      expect(MysqlEntity.getColumns().length).toBe(0)
    })
  })

  describe("User extends MysqlEntity default class", () => {
    it("Should return user as the table name", () => {
      expect(User.getTableName()).toBe("users")
    })
    it("Should return id as the PK", () => {
      expect(User.getPrimaryKey()).toBe("id")
    })
    it("Should an array for the columns", () => {
      expect(User.getColumns().length).toBe(4)
    })
    it("Create User instance without parameters", () => {
      let user = new User()
      expect(user.firstName).toBeUndefined()
      expect(user.lastName).toBeUndefined()
    })
    it("Create User instance with parameters", () => {
      let user = new User({
        firstName: "First",
        lastName: "Last"
      })
      expect(user.firstName).toBe("First")
      expect(user.lastName).toBe("Last")
    })
    it("Use insert from User instance", async () => {
      let user = new User({
        firstName: "First",
        lastName: "Last"
      })
      let result = await user.insert(null as any)
      expect(result.params.length).toBe(3)
      expect(result.params[0]).toBe("First")
      expect(result.params[1]).toBe("Last")
      expect(result.params[2]).toBeUndefined()
      expect(result.sql).toBe("INSERT INTO `users` (`firstName`, `lastName`, `email`) VALUES (?, ?, ?);")
    })
    it("Use update from User instance", async () => {
      let user = new User({
        firstName: "First",
        lastName: "Last"
      })
      user.id = 1
      user.lastName = "updated"
      let result = await user.update(null as any)
      expect(result.params.length).toBe(4)
      expect(result.params[0]).toBe("First")
      expect(result.params[1]).toBe("updated")
      expect(result.params[2]).toBeUndefined()
      expect(result.params[3]).toBe(1)
      expect(result.sql).toBe("UPDATE `users` SET `firstName` = ?, `lastName` = ?, `email` = ? WHERE `id` = ?;")
    })
    it("Use remove from User instance", async () => {
      let user = new User({
        firstName: "First",
        id: 1
      })
      let result = await user.remove(null as any)
      expect(result.params.length).toBe(1)
      expect(result.params[0]).toBe(1)
      expect(result.sql).toBe("DELETE FROM `users` WHERE `id` = ?;")
    })
    it("Throw validation errors", async () => {
      let user = new User({
        firstName: "First"
      })
      try {
        let result = await user.insert(null as any)
      } catch(err) {
        expect(err.name).toBe("MysqlEntityValidationError")
        expect(err.errors.lastName).toBe("REQUIRED")
        expect(err.errors.id).toBeUndefined()
      }

      try {
        let result = await user.update(null as any)
      } catch(err) {
        expect(err.name).toBe("MysqlEntityValidationError")
        expect(err.errors.lastName).toBe("REQUIRED")
        expect(err.errors.id).toBe("REQUIRED")
      }

      try {
        let result = await user.remove(null as any)
      } catch(err) {
        expect(err.name).toBe("MysqlEntityValidationError")
        expect(err.errors.lastName).toBeUndefined()
        expect(err.errors.id).toBe("REQUIRED")
      }
    })
    it("Entity Find query", async () => {
      let result = await User.Find(null as any, {name: "Luis"})
      let query = result[0]
      expect(query.params.length).toBe(3)
      expect(query.params[0]).toBe("Luis")
      expect(query.params[1]).toBe(1000)
      expect(query.params[2]).toBe(0)
      expect(query.sql).toBe("SELECT `id`, `firstName`, `lastName`, `email` FROM `users` WHERE `name` = ? LIMIT ? OFFSET ?;")
    })
    it("Entity FindOne query", async () => {
      let result = await User.FindOne(null as any, {name: "Luis"})
      let query = result
      expect(query.params.length).toBe(3)
      expect(query.params[0]).toBe("Luis")
      expect(query.params[1]).toBe(1)
      expect(query.params[2]).toBe(0)
      expect(query.sql).toBe("SELECT `id`, `firstName`, `lastName`, `email` FROM `users` WHERE `name` = ? LIMIT ? OFFSET ?;")
    })
    it("Entity Count query", async () => {
      let result = await User.Count(null as any, {name: "Luis"})
      let query = result as MysqlQuery
      expect(query.params.length).toBe(1)
      expect(query.params[0]).toBe("Luis")
      expect(query.sql).toBe("SELECT COUNT(`id`) AS `total` FROM `users` WHERE `name` = ?;")
    })
  })

  describe("MysqlEntity query methods", () => {
    it("QueryFind", async () => {
      let result = await QueryFind(null as any, "users", {name: "Luis"})
      let query = result as MysqlQuery
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
      let result = await QueryCount(null as any, "users", {name: "Luis"})
      let query = result as MysqlQuery
      expect(query.params.length).toBe(1)
      expect(query.params[0]).toBe("Luis")
      expect(query.sql).toBe("SELECT COUNT(*) AS `total` FROM `users` WHERE `name` = ?;")
    })
    it("Query Select options", async () => {
      let result = await QueryFind(null as any, "users", {name: "Luis"}, {select: ["id", "email", {column: "firstName", as: "name"}, {column: "lastName", table: "users"}]})
      let query = result as MysqlQuery
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
      let query = result as MysqlQuery
      expect(query.params.length).toBe(3)
      expect(query.params[0]).toBe("Luis")
      expect(query.params[1]).toBe(1000)
      expect(query.params[2]).toBe(0)
      expect(query.sql).toBe("SELECT * FROM `users` INNER JOIN `comments` ON `users`.`id` = `userId` WHERE `name` = ? LIMIT ? OFFSET ?;")
    })
    it("Query Where options", async () => {
      let result = await QueryFind(null as any, "users", {name: "Luis", $or: [{status: 1}, {status: 2, isDeleted: false}]})
      let query = result as MysqlQuery
      expect(query.params.length).toBe(6)
      expect(query.params[0]).toBe("Luis")
      expect(query.params[1]).toBe(1)
      expect(query.params[2]).toBe(2)
      expect(query.params[3]).toBeFalsy()
      expect(query.params[4]).toBe(1000)
      expect(query.params[5]).toBe(0)
      expect(query.sql).toBe("SELECT * FROM `users` WHERE `name` = ? AND ((`status` = ?) OR (`status` = ? AND `isDeleted` = ?)) LIMIT ? OFFSET ?;")
    })
    it("Query Where options 2", async () => {
      let result = await QueryFind(null as any, "users", {name: {$in: ["Luis", "Bastidas"]}, $and: [{age: {$gte: 18}}, {age: {$lte: 65}}], createdAt: {$between: {$from: new Date("2024-01-01"), $to: new Date("2024-04-01")}}})
      let query = result as MysqlQuery
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
      let query = result as MysqlQuery
      expect(query.params.length).toBe(3)
      expect(query.params[0]).toBe("Luis")
      expect(query.params[1]).toBe(1000)
      expect(query.params[2]).toBe(0)
      expect(query.sql).toBe("SELECT * FROM `users` WHERE `name` = ? GROUP BY `status`, `users`.`role` LIMIT ? OFFSET ?;")
    })
    it("Query Order by options", async () => {
      let result = await QueryFind(null as any, "users", {name: "Luis"}, {orderBy: [{column: "lastName", order: "ASC"}, {column: "email", order: "ASC", table: "users"}]})
      let query = result as MysqlQuery
      expect(query.params.length).toBe(3)
      expect(query.params[0]).toBe("Luis")
      expect(query.params[1]).toBe(1000)
      expect(query.params[2]).toBe(0)
      expect(query.sql).toBe("SELECT * FROM `users` WHERE `name` = ? ORDER BY `lastName` ASC, `users`.`email` ASC LIMIT ? OFFSET ?;")
    })
    it("Query Limit options", async () => {
      let result = await QueryFind(null as any, "users", {name: "Luis"}, {limit: {page: 2, per: 10}})
      let query = result as MysqlQuery
      expect(query.params.length).toBe(3)
      expect(query.params[0]).toBe("Luis")
      expect(query.params[1]).toBe(10)
      expect(query.params[2]).toBe(10)
      expect(query.sql).toBe("SELECT * FROM `users` WHERE `name` = ? LIMIT ? OFFSET ?;")
    })
  })

})