# Documentation

TyDeT (Typescript Developer Tools) Core MySQL is a module to handle a connection with a MySQL Database and managing the entities, validations, migrations and other tools.

## Basic usage

```js
import { Context } from 'tydet-core';
import { MysqlConnector, MysqlEntity, QueryFind } from 'tydet-core-mysql';

// Add connector as Service
let app = new Context()
let mysql = new MysqlConnector({host: "db.com", db: "mydb", user: "user", pass: "pass", port: 3306})
await app.mountService("mysql", mysql)

// Execute queries
let query = QueryFind(mysql, "users", {firstName: "My name"})
let data = await mysql.run(query)

// Define entities
class User extends MysqlEntity {
  id: number
  firstName: string
  lastName: string
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
  lastName: MysqlDataType.VARCHAR
})

class Comment extends MysqlEntity {
  id: number
  message: string
  userId: number
  createdAt: Date

  user?: User
}

Comment.DefineSchema("comments", {
  id: {
    type: MysqlDataType.INT,
    primaryKey: true
  },
  message: {
    type: MysqlDataType.VARCHAR,
    required: true
  },
  userId: MysqlDataType.INT,
  createdAt: {
    type: MysqlDataType.DATETIME,
    default: MysqlDefaultValue.NOW
  }
})

User.hasMany(Comment, "userId")
Comment.belongsTo(User, "userId", "user")

let users = await User.Find(mysql, {firstName: "My name"})

```

## Configuration

The input arguments are required and will define the connection to the database:

```js
let mysql = new MysqlConnector({host: "db.com", db: "mydb", user: "user", pass: "pass", port: 3306})
```

The only argument (`MysqlParamsInterface`) define the server `host`, `db` (Database name), `user`, `pass` and `port` (optional) required to establish a connection with a MySQL Database.

## Migrations

## Query Builders

## Entities