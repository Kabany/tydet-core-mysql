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

The only argument (`MysqlParamsInterface`) required define the server `host`, `db` (Database name), `user`, `pass` and `port` (optional) required to establish a connection with a MySQL Database.

## Migrations

TyDeT Core MySQL can handle versioning with classes to migrate (up) or execute a rollback (down) like the following:

```js
class MigrationExample extends MysqlMigration {
  override async up(db: MysqlConnector) {
    await QueryCreateTable("users", true)
      .addColumn("id", MysqlDataType.INT, {primaryKey: true, autoincrement: true, nullable: false})
      .addColumn("firstName", MysqlDataType.VARCHAR, {nullable: false, size: 100})
      .addColumn("lastName", MysqlDataType.VARCHAR, {nullable: false, size: 100})
      .addColumn("createdAt", MysqlDataType.DATETIME, {nullable: false})
      .run(db)
  }

  override async down(db: MysqlConnector) {
    await QueryDropTable("users", true).run(db)
  }
}

let mysql = new MysqlConnector({host: "db.com", db: "mydb", user: "user", pass: "pass", port: 3306})
let migrationHandler = new MysqlMigrationHandler(db, [MigrationExample], app)
```

The handler requires the folloing parameters: 

* **db (`MysqlConnector`):** The MySQL Connection Service
* **migrations (`MysqlMigration[]`):** An array of migration definitions. It's important that the order in the array will define the order of execution.
* **context (`Context`):** (Optional) The Application Core Context. It's used to call other services like the TyDeT Logger.

The handler will create a table with the name `db_migration_history` in the database to register what migrations are already migrated to avoid double execution and to know wich migration should rollback when needed.

When executing the handler methods: 
* For a migration, it will execute in order all available migration classes avoiding the ones that are already executed in the past (registered in the migration history).
* For a rollback, it will execute only the last migration class implemented.

## Query Builders

To facilitate query building, this module have several methods available to you for CRUD operations like the following:


### `QueryCreateTable(table: string, ifNotExists?: boolean): MysqlCreateTableQuery`

Creates an instance to build a query object with a table create statement.

* **name**: The table name
* **ifNotExists**: Add the statement if added as parameter. By default it is true.

It has the following methods: 

#### `addColumn(name: string, type: MysqlDataType, options?: MysqlColumnOptions): MysqlCreateTableQuery`

Add a column to the table. Returns the current builder

* **name**: The column name
* **type**: MySQL Data Type: VARCHAR, TEXT, LONGTEXT, TINYINT, SMALLINT, MEDIUMINT, INT, BIGINT, DECIMAL, DATE, DATETIME, BOOLEAN
* **options**: 
  * **size**: For columns that requires to define the size of the variables like VARCHAR data type.
  * **decimal**: For number of decimals in DECIMAL data type.
  * **nullable**: Define the column as required
  * **primaryKey**: Define the column table primary key.
  * **unique**: Add the unique property in the column definition.
  * **autoincrement**: Set autoincrement
  * **default**: Define the default value for the column.

#### `toQuery(): MysqlQuery`

Returns the query object with the table create statement.

#### `run(db: MysqlConnector): Promise<any>`

Builds the query object then execute it with the DB Service. It returns the war result from the execution.

* **db**: The MysqlConnector service


### `QueryDropTable(table: string, ifExists?: boolean): MysqlDropTableQuery`

Creates an instance to build a query object with a drop table statement.

* **name**: The table name
* **ifNotExists**: Add the statement if added as parameter. By default it is true.

It has the following methods:

#### `toQuery(): MysqlQuery`

Returns the query object with the drop table statement.

#### `run(db: MysqlConnector): Promise<any>`

Builds the query object then execute it with the DB Service. It returns the war result from the execution.

* **db**: The MysqlConnector service


### `QueryRenameTable(current: string, newName: string): MysqlRenamteTableQuery`

Creates an instance to build a query object with a rename table statement.

* **current**: The current table name
* **newName**: The name to update the table

It has the following methods:

#### `toQuery(): MysqlQuery`

Returns the query object with the table rename statement.

#### `run(db: MysqlConnector): Promise<any>`

Builds the query object then execute it with the DB Service. It returns the war result from the execution.

* **db**: The MysqlConnector service


### `QueryAlterTable(table: string): MysqlAlterTableQuery`

Creates an instance to build a query object with the table alter statement.

* **name**: The table name

It has the following methods: 

#### `addColumn(name: string, type: MysqlDataType, options?: MysqlAddColumnOptions): MysqlAlterTableQuery`

Add a column to the table. Returns the current builder.

* **name**: The column name
* **type**: MySQL Data Type: VARCHAR, TEXT, LONGTEXT, TINYINT, SMALLINT, MEDIUMINT, INT, BIGINT, DECIMAL, DATE, DATETIME, BOOLEAN
* **options**: 
  * **size**: For columns that requires to define the size of the variables like VARCHAR data type.
  * **decimal**: For number of decimals in DECIMAL data type.
  * **nullable**: Define the column as required
  * **primaryKey**: Define the column table primary key.
  * **unique**: Add the unique property in the column definition.
  * **autoincrement**: Set autoincrement
  * **default**: Define the default value for the column.
  * **after**: Defines the position in the table to add the new column.

#### `modifyColumn(name: string, type: MysqlDataType, options?: MysqlModifyColumnOptions): MysqlAlterTableQuery`

Modify an existing column from the table. Returns the current builder.

* **name**: The column name
* **type**: MySQL Data Type: VARCHAR, TEXT, LONGTEXT, TINYINT, SMALLINT, MEDIUMINT, INT, BIGINT, DECIMAL, DATE, DATETIME, BOOLEAN
* **options**: 
  * **size**: For columns that requires to define the size of the variables like VARCHAR data type.
  * **decimal**: For number of decimals in DECIMAL data type.
  * **nullable**: Define the column as required
  * **primaryKey**: Define the column table primary key.
  * **unique**: Add the unique property in the column definition.
  * **autoincrement**: Set autoincrement
  * **default**: Define the default value for the column.
  * **after**: Defines the position in the table to add the new column.
  * **newName**: Rename the column.

#### `dropColumn(name: string): MysqlAlterTableQuery`

Remove an existing column from the table. Returns the current builder.

* **name**: The column name

#### `toQuery(): MysqlQuery`

Returns the query object with the table alter statement.

#### `run(db: MysqlConnector): Promise<any>`

Builds the query object then execute it with the DB Service. It returns the war result from the execution.

* **db**: The MysqlConnector service


### `QueryFind(db: MysqlConnector, table: string | MysqlTableOptions, where?: MysqlWhereOptions, options?: MysqlFindOptions): Promise<any[]>`

Builds a query object to fetch records from the database using the select statement.

* **db**: The MysqlConnector service
* **table**: The table string name, or a instance of MysqlTableOptions where defines the table name (required) and the alias (optional). For example:
```js
let tableName = "my_table"
let tableOptions = {table: "my_table", as: "simple_alias"}
```
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.
* **options**: An instance of MysqlFindOptions for additional operators for the query:
  * **select**: An array of strings or MysqlSelectOptions to be included in the SELECT statement. If it is not defined or the array is empty, then the select statement will include the all columns ( * ):
  ```js
  let select = ["id", "name", {column: "email", as: "mail"}, {column: "total": table: "expenses", operator: MysqlOperator.SUM}]
  ```
  * **join**: An array of MysqlJoinOptions instances. The options for the `on` and `with` definitions can be a string to reference a column or a MysqlJoinCondition instance:
  ```js
  let joins = [
    {table: "comments", type: MysqlJoinType.INNER, on: "userId", with: {column: "id", table: "users"}}
  ]
  ```

  * **groupBy**: An array of strings or MysqlGroupOptions instances:
  ```js
  let groupBy = [
    "categoryId", {column: "id", table: "users"}
  ]
  ```

  * **orderBy**: An array of MysqlOrderOptions instances:
  ```js
  let orderBy = [
   {column: "firstName", order: "ASC"},
   {column: "age", table: "userInfo", order: "DESC"}
  ]
  ```

  * **limit**: An instance to define the pagination of the query with `per` for the number of elements in the result and `page` for the pagination. The maximum number of elements is 1000. By default is the first page with 1000 elements.
  ```js
  let limit = {page: 1, per: 1000}
  ```


### `QueryFindOne(db: MysqlConnector, table: string | MysqlTableOptions, where?: MysqlWhereOptions, options?: MysqlFindOneOptions): Promise<any>`

Builds a query object to fetch records from the database using the select statement by retrieveng only the first row.

* **db**: The MysqlConnector service
* **table**: The table string name, or a instance of MysqlTableOptions where defines the table name (required) and the alias (optional). For example:
```js
let tableName = "my_table"
let tableOptions = {table: "my_table", as: "simple_alias"}
```
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.
* **options**: An instance of MysqlFindOptions for additional operators for the query:
  * **select**: An array of strings or MysqlSelectOptions to be included in the SELECT statement. If it is not defined or the array is empty, then the select statement will include the all columns ( * ):
  ```js
  let select = ["id", "name", {column: "email", as: "mail"}, {column: "total": table: "expenses", operator: MysqlOperator.SUM}]
  ```
  * **join**: An array of MysqlJoinOptions instances. The options for the `on` and `with` definitions can be a string to reference a column or a MysqlJoinCondition instance:
  ```js
  let joins = [
    {table: "comments", type: MysqlJoinType.INNER, on: "userId", with: {column: "id", table: "users"}}
  ]
  ```

  * **groupBy**: An array of strings or MysqlGroupOptions instances:
  ```js
  let groupBy = [
    "categoryId", {column: "id", table: "users"}
  ]
  ```

  * **orderBy**: An array of MysqlOrderOptions instances:
  ```js
  let orderBy = [
   {column: "firstName", order: "ASC"},
   {column: "age", table: "userInfo", order: "DESC"}
  ]
  ```

### `QueryCount(db: MysqlConnector, table: string | MysqlTableOptions, where?: MysqlWhereOptions, options?: MysqlCountOptions): Promise<number>`

Builds a query object to fetch records from the database using the select count() statement.

* **db**: The MysqlConnector service
* **table**: The table string name, or a instance of MysqlTableOptions where defines the table name (required) and the alias (optional). For example:
```js
let tableName = "my_table"
let tableOptions = {table: "my_table", as: "simple_alias"}
```
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.
* **options**: An instance of MysqlFindOptions for additional operators for the query:
  * **countBy**: Define the column to be used in the count() operator. It's mostly used for performance because it's efficient to call one column in the count() operator instead of calling the whole table like `count(*)`, which is used by default.
  * **join**: An array of MysqlJoinOptions instances. The options for the `on` and `with` definitions can be a string to reference a column or a MysqlJoinCondition instance:
  ```js
  let joins = [
    {table: "comments", type: MysqlJoinType.INNER, on: "userId", with: {column: "id", table: "users"}}
  ]
  ```

  * **groupBy**: An array of strings or MysqlGroupOptions instances:
  ```js
  let groupBy = [
    "categoryId", {column: "id", table: "users"}
  ]
  ```

### `QueryInsert(db: MysqlConnector, table: string | MysqlTableOptions, setVals: MysqlInsertSetValues): Promise<{pk: any, query?: MysqlQuery}>`

Builds a query object to add a row in the database using the insert statement. 
It returns the Primary Key of the added row.

* **db**: The MysqlConnector service
* **table**: The table string name, or a instance of MysqlTableOptions where defines the table name (required) and the alias (optional). For example:
```js
let tableName = "my_table"
let tableOptions = {table: "my_table", as: "simple_alias"}
```
* **setVals**: An object with the values to update. It is required to have at least one value to execute the update statement:
```js
let setVals = {firstName: "Luis", lastName: "Example"}
```

### `QueryUpdate(db: MysqlConnector, table: string | MysqlTableOptions, setVals: MysqlUpdateSetValues, where?: MysqlWhereOptions): Promise<{changed: number, query?: MysqlQuery}>`

Builds a query object to update records in the database using the update statement. 
It returns the number of affected rows.

* **db**: The MysqlConnector service
* **table**: The table string name, or a instance of MysqlTableOptions where defines the table name (required) and the alias (optional). For example:
```js
let tableName = "my_table"
let tableOptions = {table: "my_table", as: "simple_alias"}
```
* **setVals**: An object with the values to update. It is required to have at least one value to execute the update statement:
```js
let setVals = {firstName: "Luis", lastName: "Example"}
```
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.

### `QueryDelete(db: MysqlConnector, table: string | MysqlTableOptions, where: MysqlWhereOptions, force?: boolean): Promise<{deleted: number, query: MysqlQuery}>`

Builds a query object to erase records in the database using the delete statement. 
It returns the number of affected rows and the executed query.

* **db**: The MysqlConnector service
* **table**: The table string name, or a instance of MysqlTableOptions where defines the table name (required) and the alias (optional). For example:
```js
let tableName = "my_table"
let tableOptions = {table: "my_table", as: "simple_alias"}
```
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.
* **force**: In the case the where options is empty, then it's required to use the force. By default it's `false`.

## Entities

As part of this module, you can create entities (or clases representing tables) as Database Access Objects for easy management to all CRUD operatios.


## Where Operators

* **$and**: By default, all parameters in an object are considered AND operators, but explicitely you can use the `$and` operator in an array like the following:
```js
let where1 = {status: "active", name: "Luis"} // status = "active" AND name = "Luis"
let where2 = {status: "active", "$and": [{age: 10}, {name: "Luis"}]} // status = "active" AND age = 10 AND name = "Luis"
let where3 = {status: "active", "$and": [{age: {"$gte": 18}}, {age: {"$lt": 65}}]} // status = "active" AND age >= 18 AND age < 65
```
* **$or**: It must be an array of objects where you can define the required options like the following:
```js
let where = {"$or": [{name: "Luis"}, {name: "David"}]} // name = "Luis" OR name = "David"
```

* **$eq**: Equals operator:
```js
let where = {age: {"$eq": 18}} // age = 18
```

* **$neq**: Not equals operator:
```js
let where = {age: {"$neq": 18}} // age <> 18
```

* **$gt**: Greater than operator:
```js
let where = {age: {"$gt": 18}} // age > 18
```

* **$gte**: Greater than equal operator:
```js
let where = {age: {"$gte": 18}} // age >= 18
```

* **$lt**: Lower than operator:
```js
let where = {age: {"$lt": 18}} // age < 18
```

* **$lte**: Lower than equal operator:
```js
let where = {age: {"$lte": 18}} // age <= 18
```

* **$is**: Is operator:
```js
let where = {age: {"$is": 18}} // age IS 18
```

* **$not**: Is not operator:
```js
let where = {isActive: {"$not": 18}} // age IS NOT 18
```

* **$between**: Between operator. It must be followed by an object with `$from` and `$to` keys:
```js
let where = {age: {"$between": {"$from": 18, "$to": 65}}} // age BETWEEN 18 AND 65
```

* **$nbetween**: Not between operator. It must be followed by an object with `$from` and `$to` keys:
```js
let where = {age: {"$nbetween": {"$from": 18, "$to": 65}}} // age NOT BETWEEN 18 AND 65
```

* **$in**: In operator. Mostly used for arrays:
```js
let where = {name: {"$in": ["Luis", "Miguel", "David", "Alejandro"]}} // name IN ("Luis", "Miguel", "David", "Alejandro")
```

* **$nin**: Not in operator. Mostly used for arrays:
```js
let where = {name: {"$nin": ["Luis", "Miguel", "David", "Alejandro"]}} // name NOT IN ("Luis", "Miguel", "David", "Alejandro")
```

* **$like**: Like operator:
```js
let where = {name: {"$like": "Lu%"}} // name LIKE "Lu%" (all string starting with 'Lu')
```

* **$nlike**: Not like operator:
```js
let where = {name: {"$nlike": "Lu%"}} // name NOT LIKE "Lu%" (all string not starting with 'Lu')
```

## Utils