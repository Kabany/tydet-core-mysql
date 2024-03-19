import { MysqlEntityValidationError } from "../src/mysql.error"
import { MysqlDataType, MysqlEntity } from "../src/mysql.schema"



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
      expect(result.query).toBe("INSERT INTO `users` (`firstName`, `lastName`, `email`) VALUES (?, ?, ?);")
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
      expect(result.query).toBe("UPDATE `users` SET `firstName` = ?, `lastName` = ?, `email` = ? WHERE `id` = ?;")
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
    })
  })

})