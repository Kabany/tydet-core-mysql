import { MysqlDataType, MysqlDefaultValues, MysqlEntity } from "../src/mysql.schema";
import { MysqlMigration, MysqlMigrationHandler } from "../src/mysql.migration"
import { MysqlConnector } from "../src/mysql.service";
import { MysqlJoinType, QueryCount, QueryCreateTable, QueryDropTable, QueryFind, QueryFindOne } from "../src/mysql.query";
import { Context } from "tydet-core";

const DB_HOST = "192.168.68.127"
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
Comment.belongsTo(User, "userId", "user")

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
Cast.belongsTo(Movie, "movieId")
Cast.belongsTo(Actor, "actorId")

class TestMigration extends MysqlMigration {
  override async up(db: MysqlConnector) {
    await QueryCreateTable("users", true)
      .addColumn("id", MysqlDataType.INT, {primaryKey: true, autoincrement: true, nullable: false})
      .addColumn("firstName", MysqlDataType.VARCHAR, {nullable: false, size: 100})
      .addColumn("lastName", MysqlDataType.VARCHAR, {nullable: false, size: 100})
      .addColumn("createdAt", MysqlDataType.DATETIME, {nullable: false})
      .run(db)
    await QueryCreateTable("comments", true)
      .addColumn("id", MysqlDataType.INT, {primaryKey: true, autoincrement: true, nullable: false})
      .addColumn("userId", MysqlDataType.INT, {nullable: false})
      .addColumn("message", MysqlDataType.TEXT, {nullable: false})
      .addColumn("createdAt", MysqlDataType.DATETIME, {nullable: false})
      .run(db)
    await QueryCreateTable("actors", true)
      .addColumn("id", MysqlDataType.INT, {primaryKey: true, autoincrement: true, nullable: false})
      .addColumn("name", MysqlDataType.VARCHAR, {nullable: false})
      .run(db)
    await QueryCreateTable("movies", true)
      .addColumn("id", MysqlDataType.INT, {primaryKey: true, autoincrement: true, nullable: false})
      .addColumn("title", MysqlDataType.VARCHAR, {nullable: false})
      .run(db)
    await QueryCreateTable("cast", true)
      .addColumn("id", MysqlDataType.INT, {primaryKey: true, autoincrement: true, nullable: false})
      .addColumn("actorId", MysqlDataType.INT, {nullable: false})
      .addColumn("movieId", MysqlDataType.INT, {nullable: false})
      .run(db)
  }

  override async down(db: MysqlConnector) {
    await QueryDropTable("users", true).run(db)
    await QueryDropTable("comments", true).run(db)
    await QueryDropTable("actors", true).run(db)
    await QueryDropTable("movies", true).run(db)
    await QueryDropTable("cast", true).run(db)
  }
}


describe("Mysql Migration", () => {
  let app = new Context()
  let db = new MysqlConnector({host: DB_HOST, db: DB_NAME, user: DB_USER, pass: DB_PASS})
  let migrationHandler: MysqlMigrationHandler

  beforeAll(async () => {
    // prepare
    await app.mountService("mysql", db)

    migrationHandler = new MysqlMigrationHandler(db, [TestMigration], app)
    await migrationHandler.prepare()
    await migrationHandler.migrate()
  })

  it("should execute CRUD operations with users and comments - one to many", async () => {
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
    expect(userWithComments.length).toBe(2)
    expect(userWithComments[0].id).not.toBe(userWithComments[1].id)
    expect(userWithComments[0].comments.length).toBe(2)
    expect(userWithComments[1].comments.length).toBe(3)
    expect(userWithComments[0].comments[0].id).not.toBe(userWithComments[0].comments[1].id)
    expect(userWithComments[1].comments[0].id).not.toBe(userWithComments[1].comments[1].id)
    expect(userWithComments[1].comments[0].id).not.toBe(userWithComments[1].comments[2].id)

    let userComments = await User.FindOne(db, {}, {populate: [Comment]})
    expect(userComments.comments.length).toBe(2)
    expect(userComments.comments[0].id).not.toBe(userComments.comments[1].id)

    let comment = await Comment.FindOne(db, {}, {populate: [User]})
    expect(comment.user).not.toBeUndefined()

    let usr2 = await User.FindOne(db, {lastName: "2"})
    expect(usr2).not.toBeNull()
    expect(usr2.comments).toBeUndefined()
    await usr2.populate(db)
    expect(usr2.comments).not.toBeUndefined()
    expect(usr2.comments.length).toBe(3)
  })

  it("should execute CRUD operations with actors and movies - many to many", async () => {
    // add actors and movies
    let actor1 = new Actor({name: "Luis"})
    await actor1.insert(db)
    let actor2 = new Actor({name: "Adrian"})
    await actor2.insert(db)
    let actor3 = new Actor({name: "Daniel"})
    await actor3.insert(db)
    let movie1 = new Movie({title: "The movie 1"})
    await movie1.insert(db)
    let movie2 = new Movie({title: "The movie 2"})
    await movie2.insert(db)
    let movie3 = new Movie({title: "The movie 3"})
    await movie3.insert(db)
    let movie4 = new Movie({title: "The movie 4"})
    await movie4.insert(db)
    // set relations
    let cast1a = new Cast({actorId: actor1.id, movieId: movie1.id})
    let cast1b = new Cast({actorId: actor2.id, movieId: movie1.id})
    await cast1a.insert(db)
    await cast1b.insert(db)
    let cast2a = new Cast({actorId: actor2.id, movieId: movie2.id})
    let cast2b = new Cast({actorId: actor3.id, movieId: movie2.id})
    await cast2a.insert(db)
    await cast2b.insert(db)
    let cast3a = new Cast({actorId: actor1.id, movieId: movie3.id})
    let cast3b = new Cast({actorId: actor3.id, movieId: movie3.id})
    await cast3a.insert(db)
    await cast3b.insert(db)
    let cast4a = new Cast({actorId: actor1.id, movieId: movie4.id})
    let cast4b = new Cast({actorId: actor2.id, movieId: movie4.id})
    let cast4c = new Cast({actorId: actor3.id, movieId: movie4.id})
    await cast4a.insert(db)
    await cast4b.insert(db)
    await cast4c.insert(db)

    let a1 = await Actor.Find(db, {name: "Luis"}, {populate: [Movie]})
    expect(a1.length).toBe(1)
    expect(a1[0].movies.length).toBe(3)
    expect(a1[0].movies[0].id).not.toBe(a1[0].movies[1].id)
    expect(a1[0].movies[0].id).not.toBe(a1[0].movies[2].id)

    let a2 = await Actor.FindOne(db, {name: "Adrian"})
    expect(a2).not.toBeNull()
    expect(a2.movies).toBeUndefined()
    await a2.populate(db)
    expect(a2.movies).not.toBeUndefined()
    expect(a2.movies.length).toBe(3)
    expect(a2.movies[0].id).not.toBe(a2.movies[1].id)
    expect(a2.movies[0].id).not.toBe(a2.movies[2].id)
  })

  afterAll(async () => {
    // drop
    await migrationHandler.rollback()

    // close service
    await app.unmountServices()
  })
})