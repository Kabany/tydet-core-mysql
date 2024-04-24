import { MysqlEntityValidationError } from "../src/mysql.error"
import { MysqlJoinType, QueryCount, QueryFind, QueryFindOne } from "../src/mysql.query"
import { MysqlDataType, MysqlDefaultValues, MysqlEntity } from "../src/mysql.schema"
import { MysqlQuery } from "../src/mysql.service"



class User extends MysqlEntity {
  id: number
  firstName: string
  lastName: string
  email: string

  comments?: Comment[]
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

class Comment extends MysqlEntity {
  id: number
  userId: number
  message: string
  createdAt: Date

  user?: User
}

Comment.DefineSchema("comments", {
  id: {
    type: MysqlDataType.INT,
    primaryKey: true,
    required: true
  },
  userId: {
    type: MysqlDataType.INT,
    required: true
  },
  message: MysqlDataType.VARCHAR,
  createdAt: {
    type: MysqlDataType.DATETIME,
    default: MysqlDefaultValues.DATENOW
  }
})

User.hasMany(Comment, "userId", "comments")
Comment.belongsTo(User, "userId")



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
      expect(query.sql).toBe("SELECT * FROM `users` WHERE `name` = ? LIMIT ? OFFSET ?;")
    })
    it("Entity FindOne query", async () => {
      let result = await User.FindOne(null as any, {name: "Luis"})
      let query = result
      expect(query.params.length).toBe(3)
      expect(query.params[0]).toBe("Luis")
      expect(query.params[1]).toBe(1)
      expect(query.params[2]).toBe(0)
      expect(query.sql).toBe("SELECT * FROM `users` WHERE `name` = ? LIMIT ? OFFSET ?;")
    })
    it("Entity Count query", async () => {
      let result = await User.Count(null as any, {name: "Luis"}) as any
      let query = result as MysqlQuery
      expect(query.params.length).toBe(1)
      expect(query.params[0]).toBe("Luis")
      expect(query.sql).toBe("SELECT COUNT(`id`) AS `total` FROM `users` WHERE `name` = ?;")
    })
    it("Entity Select options", async () => {
      let result = await User.Find(null as any, {firstName: "Luis"}, {select: ["firstName", "lastName"]})
      let query = result[0]
      expect(query.params.length).toBe(3)
      expect(query.params[0]).toBe("Luis")
      expect(query.params[1]).toBe(1000)
      expect(query.params[2]).toBe(0)
      expect(query.sql).toBe("SELECT `firstName`, `lastName` FROM `users` WHERE `firstName` = ? LIMIT ? OFFSET ?;")
    })
    it("Entity Join options", async () => {
      let result = await User.Find(null as any, {"$t.users.firstName": "Luis"}, {populate: [Comment]})
      let query = result[0]
      expect(query.params.length).toBe(3)
      expect(query.params[0]).toBe("Luis")
      expect(query.params[1]).toBe(1000)
      expect(query.params[2]).toBe(0)
      expect(query.sql).toBe("SELECT * FROM `users` INNER JOIN `comments` ON `users`.`id` = `comments`.`userId` WHERE `users`.`firstName` = ? LIMIT ? OFFSET ?;")
    })
  })

})