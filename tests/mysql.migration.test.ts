import { MysqlDataType, MysqlDefaultValues, MysqlEntity } from "../src/mysql.schema";
import { MysqlMigration, MysqlMigrationHandler } from "../src/mysql.migration"
import { MysqlConnector } from "../src/mysql.service";
import { MysqlJoinType, QueryCount, QueryCreateTable, QueryDropTable, QueryFind, QueryFindOne } from "../src/mysql.query";
import { Context } from "tydet-core";

const DB_HOST = "192.168.68.117"
const DB_USER = "core_test"
const DB_NAME = "tydet_mysql"
const DB_PASS = "core1234ABcde"

class User extends MysqlEntity {
  id: number
  firstName: string
  lastName: string
  createdAt: Date

  comments?: Comment[]
}

User.DefineSchema("users", {
  id: {
    type: MysqlDataType.INT,
    primaryKey: true
  },
  firstName: {
    type: MysqlDataType.VARCHAR,
    required: true
  },
  lastName: {
    type: MysqlDataType.VARCHAR,
    required: true
  },
  createdAt: {
    type: MysqlDataType.DATETIME,
    default: MysqlDefaultValues.DATENOW
  }
})

class Comment extends MysqlEntity {
  id: number
  userId: number
  message: string
  createdAt: string

  user?: User
}

Comment.DefineSchema("comments", {
  id: {
    type: MysqlDataType.INT,
    primaryKey: true
  },
  userId: {
    type: MysqlDataType.INT,
    required: true
  },
  message: {
    type: MysqlDataType.TEXT,
    required: true
  },
  createdAt: {
    type: MysqlDataType.DATETIME,
    default: MysqlDefaultValues.DATENOW
  }
})

User.hasMany(Comment, "userId", "comments")
Comment.belongsTo(User, "userId")

class Actor extends MysqlEntity {
  id: number
  name: string

  movies?: Movie[]
}

Actor.DefineSchema("actors", {
  id: {
    type: MysqlDataType.INT,
    primaryKey: true
  },
  name: {
    type: MysqlDataType.VARCHAR,
    required: true
  }
})

class Movie extends MysqlEntity {
  id: number
  title: string

  actors?: Actor[]
}

Movie.DefineSchema("movies", {
  id: {
    type: MysqlDataType.INT,
    primaryKey: true
  },
  title: {
    type: MysqlDataType.VARCHAR,
    required: true
  }
})

class Cast extends MysqlEntity {
  id: number
  actorId: number
  movieId: number
}

Cast.DefineSchema("cast", {
  id: {
    type: MysqlDataType.INT,
    primaryKey: true
  },
  actorId: {
    type: MysqlDataType.INT,
    required: true
  },
  movieId: {
    type: MysqlDataType.INT,
    required: true
  }
})

Actor.belongsToMany(Movie, Cast, "userId", "movies")
Movie.belongsToMany(Actor, Cast, "movieId", "actors")
Cast.hasOne(Movie, "movieId")
Cast.hasOne(Actor, "actorId")

class TestMigration extends MysqlMigration {
  override async up(db: MysqlConnector) {
    let createUser = QueryCreateTable("users", true)
      .addColumn("id", MysqlDataType.INT, {primaryKey: true, autoincrement: true, nullable: false})
      .addColumn("firstName", MysqlDataType.VARCHAR, {nullable: false, size: 100})
      .addColumn("lastName", MysqlDataType.VARCHAR, {nullable: false, size: 100})
      .addColumn("createdAt", MysqlDataType.DATETIME, {nullable: false})
      .toQuery()
    await db.run(createUser)
    let createComments = QueryCreateTable("comments", true)
      .addColumn("id", MysqlDataType.INT, {primaryKey: true, autoincrement: true, nullable: false})
      .addColumn("userId", MysqlDataType.INT, {nullable: false})
      .addColumn("message", MysqlDataType.TEXT, {nullable: false})
      .addColumn("createdAt", MysqlDataType.DATETIME, {nullable: false})
      .toQuery()
    await db.run(createComments)
  }

  override async down(db: MysqlConnector) {
    let dropUsers = QueryDropTable("users", true)
    await db.run(dropUsers)
    let dropComments = QueryDropTable("comments", true)
    await db.run(dropComments)
  }
}

describe("Mysql Migration", () => {
  it("should migrate, then execute CRUD operations, then rollback", async () => {
    
    // prepare
    let app = new Context()
    let db = new MysqlConnector({host: DB_HOST, db: DB_NAME, user: DB_USER, pass: DB_PASS})
    await app.mountService("mysql", db)

    let migrationHandler = new MysqlMigrationHandler(db, [TestMigration], app)
    await migrationHandler.prepare()
    await migrationHandler.migrate()

    // create
    let user1 = new User({firstName: "User", lastName: "1"})
    await user1.insert(db)
    expect(user1.id).not.toBeUndefined()
    expect(user1.createdAt).not.toBeUndefined()

    let comment1 = new Comment({
      userId: user1.id,
      message: "This is the first comment"
    })
    await comment1.insert(db)
    expect(comment1.id).not.toBeUndefined()
    expect(comment1.createdAt).not.toBeUndefined()

    let comment2 = new Comment({
      userId: user1.id,
      message: "This is the second comment"
    })
    await comment2.insert(db)
    expect(comment2.id).not.toBeUndefined()
    expect(comment2.createdAt).not.toBeUndefined()

    let user2 = new User({firstName: "User", lastName: "2"})
    await user2.insert(db)
    expect(user2.id).not.toBeUndefined()
    expect(user2.createdAt).not.toBeUndefined()

    let comment3 = new Comment({
      userId: user2.id,
      message: "This is the first comment"
    })
    await comment3.insert(db)
    expect(comment3.id).not.toBeUndefined()
    expect(comment3.createdAt).not.toBeUndefined()

    let comment4 = new Comment({
      userId: user2.id,
      message: "This is the second comment"
    })
    await comment4.insert(db)
    expect(comment4.id).not.toBeUndefined()
    expect(comment4.createdAt).not.toBeUndefined()

    let comment5 = new Comment({
      userId: user2.id,
      message: "This is the third comment"
    })
    await comment5.insert(db)
    expect(comment5.id).not.toBeUndefined()
    expect(comment5.createdAt).not.toBeUndefined()

    // read with query methods
    let qusers = await QueryFind(db, "users")
    expect(qusers.length).toBe(2)
    expect(qusers[0].users).not.toBeUndefined()
    expect(qusers[0].users.lastName).toBe("1")
    expect(qusers[1].users.lastName).toBe("2")

    let quser1 = await QueryFindOne(db, "users", {lastName: "2"})
    expect(quser1.users).not.toBeUndefined()
    expect(quser1.users.lastName).toBe("2")

    let qcount = await QueryCount(db, "comments")
    expect(qcount).toBe(5)

    // joins with query methods
    let qusers2 = await QueryFind(db, "users", {}, {join: [
      {table: "comments", type: MysqlJoinType.INNER, on: {table: "users", column: "id"}, with: "userId"}
    ]})
    expect(qusers2.length).toBe(5)
    expect(qusers2[0].users.id).toBe(qusers2[1].users.id)
    expect(qusers2[0].comments.id).not.toBe(qusers2[1].comments.id)
    expect(qusers2[0].users.id).not.toBe(qusers2[2].users.id)

    let quser2 = await QueryFindOne(db, "users", {"$t.users.lastName": "2"}, {join: [
      {table: "comments", type: MysqlJoinType.INNER, on: {table: "users", column: "id"}, with: "userId"}
    ]})
    expect(quser2.users.id).toBe(quser2.comments.userId)

    let count = await QueryCount(db, "users", {"$t.users.lastName": "2"}, {join: [
      {table: "comments", type: MysqlJoinType.INNER, on: {table: "users", column: "id"}, with: "userId"}
    ]})
    expect(count).toBe(3)

    // joins with entity
    let userWithComments = await User.Find(db, {}, {populate: [Comment]})
    console.log(userWithComments)
    expect(userWithComments.length).toBe(2)
    expect(userWithComments[0].id).not.toBe(userWithComments[1].id)
    expect(userWithComments[0].comments.length).toBe(2)
    expect(userWithComments[1].comments.length).toBe(3)
    expect(userWithComments[0].comments[0].id).not.toBe(userWithComments[0].comments[1].id)
    expect(userWithComments[1].comments[0].id).not.toBe(userWithComments[1].comments[1].id)
    expect(userWithComments[1].comments[0].id).not.toBe(userWithComments[1].comments[2].id)
    
    // drop
    await migrationHandler.rollback()

    // close service
    await app.unmountServices()
  })
})