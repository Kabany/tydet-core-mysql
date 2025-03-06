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

### Entity Definition

To define an entity class simply extend the class with the `MysqlEntity` class like the following:

```js
class User extends MysqlEntity {
  id: number
  firstName: string
  lastName: string
  createdAt: Date
}

let user = new User({firstName: "Luis", lastName: "Example"})
user.createdAt = new Date()
```

Additional from the class, it's required to define the entity's table schema. Just use the static method `DefineSchema()`.
In this definition it will declare the Table's name, the columns and other settings:

```js
class User extends MysqlEntity {
  id: number
  firstName: string
  lastName: string
  createdAt: Date
}

User.DefineSchema("users", {
  id: {
    type: MysqlDataType.INT,
    primaryKey: true
  },
  firstName: MysqlDataType.VARCHAR,
  lastName: MysqlDataType.VARCHAR,
  createdAt: {
    type: MysqlDataType.DATETIME,
    required: true,
    default: MysqlDefaultValues.DATENOW
  }
})
```

In the schema definition, you can set:

* **Schema's Name**: The Table's name
* **Columns**: A set of columns for the table where you can define:
  * **type** The Column Data Type. It's a enum with the name `MysqlDataType` with the options: `VARCHAR`, `TEXT`, `LONGTEXT`, `TINYINT`, `SMALLINT`, `MEDIUMINT`, `INT`, `BIGINT`, `DECIMAL`, `DATE`, `DATETIME` and `BOOLEAN`.
  * **required**: Similar as the `NOT NULL` statement. It will add validators to avoid updating or inserting empty values in the column. By default it is `false`.
  * **default**: Set the default value for the column. It can accept any value including a function. You can also use the enum `MysqlDataType` to allow a predefined "on-creation" value (`NULL`, `DATENOW`, `UUIDV1` and `UUIDV4`). By default it is `null`.
  * **columnName**: In the case that the entity parameter key is different from the column's name, then you can define it in the `columnName` property like:
  ```js
  {
    createdAt: {
      type: MysqlDataType.DATETIME,
      default: MysqlDefaultValues.DATENOW,
      columnName: "created_at"
    }
  }
  ```
  * **primaryKey**: Define the table's primary key. It is recommended that every table has one primary key. By default it's false.
  * **validators**: It's an array of functions to validate the value of the column. This function needs to have an input to send the current value and returns an object with `success` for the boolean result of the validation and optionaly a `message` to send a custom error message:
  ```js
  let customValidation = (value: any) => {
    let result = value != null && value.length >= 5
    return {success: result, message: result ? null : "Invalid value"}
  }
  let validations = [customValidation]
  ```
  * **min**: This parameter will only be considered if the column data type is a number. It adds a validation that will force the column to have a value greater or equal than this option.
  * **max**: This parameter will only be considered if the column data type is a number. It adds a validation that will force the column to have a value lower or equal than this option.
  * **minLength**: This parameter will only be considered if the column data type is a string. It adds a validation that will force the column to have a length greather or equal than this option. If the value is `null`, the length will be considered as `0`. The validation will be ignored if the value is `null` and is not required.
  * **maxLength**: This parameter will only be considered if the column data type is a string. It adds a validation that will force the column to have a length lower or equal than this option. If the value is `null`, the length will be considered as `0`. The validation will be ignored if the value is `null` and is not required.

### Entity Static methods

The entity class have a set of methods to easily execute CRUD operations:

```js
let users = await User.Find(db, {firstName: {$like: "L%"}})
```

#### `Entity.Find(db: MysqlConnector, where?: MysqlWhereOptions, options?: MysqlEntityFindOptions): Promise<any[]>`

Similar as the `QueryFind` method, it will fetch records from the database with a select statement.

* **db**: The MysqlConnector service
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.
* **options**: An instance of MysqlEntityFindOptions for additional operators for the query:
  * **select**: An array of strings or MysqlSelectOptions to be included in the SELECT statement. If it is not defined or the array is empty, then the select statement will include the all columns ( * ):
  ```js
  let select = ["id", "name", {column: "email", as: "mail"}, {column: "total": table: "expenses", operator: MysqlOperator.SUM}]
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
  * **populate** An array of entity classes to include in the result. This option will include the joins if the Schema has defined relationships with other entities. Check [Entity Relationships](#entity-relationships) for more information.


#### `Entity.FindOne(db: MysqlConnector, where?: MysqlWhereOptions, options?: MysqlEntityFindOneOptions): Promise<any>`

Similar as the `QueryFindOne` method, it will fetch the first record from the database with a select statement.

* **db**: The MysqlConnector service
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.
* **options**: An instance of MysqlEntityFindOneOptions for additional operators for the query:
  * **select**: An array of strings or MysqlSelectOptions to be included in the SELECT statement. If it is not defined or the array is empty, then the select statement will include the all columns ( * ):
  ```js
  let select = ["id", "name", {column: "email", as: "mail"}, {column: "total": table: "expenses", operator: MysqlOperator.SUM}]
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
  * **populate** An array of entity classes to include in the result. This option will include the joins if the Schema has defined relationships with other entities. Check [Entity Relationships](#entity-relationships) for more information.

#### `Entity.FindOneOrThrow(db: MysqlConnector, where?: MysqlWhereOptions, options?: MysqlEntityFindOneOptions): Promise<any>`

Similar as the `QueryFindOne` method, it will fetch the first record from the database with a select statement. This method will throw an `MysqlEntityNotFound` exception if item is not found.

* **db**: The MysqlConnector service
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.
* **options**: An instance of MysqlEntityFindOneOptions for additional operators for the query:
  * **select**: An array of strings or MysqlSelectOptions to be included in the SELECT statement. If it is not defined or the array is empty, then the select statement will include the all columns ( * ):
  ```js
  let select = ["id", "name", {column: "email", as: "mail"}, {column: "total": table: "expenses", operator: MysqlOperator.SUM}]
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
  * **populate** An array of entity classes to include in the result. This option will include the joins if the Schema has defined relationships with other entities. Check [Entity Relationships](#entity-relationships) for more information.

#### `Entity.Count(db: MysqlConnector, where?: MysqlWhereOptions, options?: MysqlEntityCountOptions): Promise<number>`

Similar as the `QueryCount` method, it will execute a select statement with the `COUNT()` operator.

* **db**: The MysqlConnector service
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.
* **options**: An instance of MysqlFindOptions for additional operators for the query:
  * **countBy**: Define the column to be used in the count() operator. It's mostly used for performance because it's efficient to call one column in the count() operator instead of calling the whole table like `count(*)`, which is used by default.
  * **groupBy**: An array of strings or MysqlGroupOptions instances:
  ```js
  let groupBy = [
    "categoryId", {column: "id", table: "users"}
  ]
  ```


#### `Entity.UpdateAll(db: MysqlConnector, setVals: MysqlEntityUpdateSetValues, where?: MysqlWhereOptions): Promise<number>`

Similar as the `QueryUpdate` method, it will execute an update statement. 
It returns the number of added rows in the database.

* **db**: The MysqlConnector service
* **setVals**: An object with the values to update. It is required to have at least one value to execute the update statement:
```js
let setVals = {firstName: "Luis", lastName: "Example"}
```
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.


#### `Entity.RemoveAll(db: MysqlConnector, where: MysqlWhereOptions, force?: boolean): Promise<number>`

Similar as the `QueryDelete` method, it will execute a delete statement. 
It returns the number of deleted rows in the database.

* **db**: The MysqlConnector service
* **where**: An object to define the `where` filters in the select statement. Check the [Where Operators](#where-operators) section for more details.
* **force**: In the case the where options is empty, then it's required to use the force. By default it's `false`.



### Entity Instance methods

For Entity instances (objects) other methods are available using the instance parameters as values for the entity's columns.

```js
let user = new User({firstName: "Luis", lastName: "Example"})
user.createdAt = new Date()
await user.insert(db) // MysqlConnection
```

#### `EntityInstance.insert(db: MysqlConnector): Promise<any>`

Execute an `INSERT` statement using the values from the Entity's instance.
It returns the Primary Key generated from the database. 
This value is also assigned to the instance's primary key parameter.

#### `EntityInstance.update(db: MysqlConnector): Promise<any>`

Execute an `UPDATE` statement using the values from the Entity's instance.
It returns the number of updated rows from the database. 
This value should be `1`.

#### `EntityInstance.remove(db: MysqlConnector): Promise<any>`

Execute a `DELETE` statement using the primary key from the Entity's instance as filter.
It returns the number of deleted rows from the database. 
This value should be `1`.

#### `EntityInstance.validate(db?: MysqlConnector): Promise<any>`

Perform a validation using the column validations from the Entity Schema definitiom.
It returns an object with parameters where the `key` is the name of the instance parameter and the `value` the error message.

The default error messages can be one of the following:
* REQUIRED
* INVALID_TYPE
* INVALID_VALUE
* MAX_VALUE
* MIN_VALUE
* MAX_LENGTH
* MIN_LENGTH

Remember that custom error messages can be included in the Schema definition.

#### `EntityInstance.populate(db: MysqlConnector): Promise<void>`

It will add all relationships in the Entity instance. Check [Entity Relationships](#entity-relationships) for more information.

```js
class User extends MysqlEntity {
  id: number
  firstName: string
  lastName: string
  createdAt: string

  comments?: Comment[] // -> another class
}

class Comment extends MysqlEntity {
  id: number
  userId: number
  message: string

  user?: User
}

User.hasMany(Comment, "userId", "comments")
Comment.belongsTo(User, "userId", "user")

let user = User.FinOne(db)
user.comments // current value is undefined

await user.populate(db)
user.comments // an array of related comments
```


### Entity Relationships

The entity class supports standard associations like `One-To-One`, `One-To-Many` and `Many-to-Many` relationships.

To do this, you can use the following assosiations methods that should be combined to create the relationships between entities:

* Has One
* Belongs to
* Has Many
* Belongs to Many

```js
class A extends MysqlEntity { /* ... */ }
class B extends MysqlEntity { /* ... */ }

A.hasOne(B)     // A has one B (one-to-one where B has the foreign key of A)
A.belongsTo(B)  // A belongs to B (one-to-one or one-to-many where A has the foreign key of B)
A.hasMany(B)    // A has many B (one-to-many where A has the foreign key of B)
A.belongsToMany(B, /* through */ C)   // A belongs to many B (many-to-many where C has the foreign keys of A and B)
```

#### `Entity.hasOne(entity: typeof MysqlEntity, foreignKey: string, custom?: string)`

Create a One-To-One relationship where the foreignKey is located in the remote entity:

```js
class A extends MysqlEntity {
  id: number // Primary Key
  /* ... */
  customB: B
}

class B extends MysqlEntity {
  /* ... */
  aId: number // Foreign Key
}

A.hasOne(B, "aId", "customB") // A has one B
```

* **entity**: The entity to define an association with.
* **foreignKey**: The name of the column that will be used as the foreign key.
* **custom**: The name of the parameter that will be used to populate the association.


#### `Entity.belongsTo(entity: typeof MysqlEntity, foreignKey: string, custom?: string)`

Create a One-To-One or One-To-Many relationship where the foreignKey is located in the main entity:

```js
class A extends MysqlEntity {
  /* ... */
  bId: number // foreign Key
  customB: B
}

class B extends MysqlEntity {
  id: number // Primary Key
  /* ... */
}

A.belongsTo(B, "bId", "customB") // A belongs to B, so B can have one or many A.
```

* **entity**: The entity to define an association with.
* **foreignKey**: The name of the column that will be used as the foreign key.
* **custom**: The name of the parameter that will be used to populate the association.


#### `Entity.hasMany(entity: typeof MysqlEntity, foreignKey: string, custom?: string)`

Create a One-To-Many relationship where the foreignKey is located in the remote entity:

```js
class A extends MysqlEntity {
  id: number // Primary Key
  /* ... */
  customB: B[]
}

class B extends MysqlEntity {
  /* ... */
  aId: number // Foreign Key
}

A.hasMany(B, "aId", "customB") // A has many B
```

* **entity**: The entity to define an association with.
* **foreignKey**: The name of the column that will be used as the foreign key.
* **custom**: The name of the parameter that will be used to populate the association.


#### `Entity.belongsToMany(entity: typeof MysqlEntity, through: typeof MysqlEntity, foreignKey: string, custom?: string)`

Create a Many-To-Many relationship where the foreignKey is located in the "middle" entity:

```js
class A extends MysqlEntity {
  id: number // A Primary Key
  /* ... */
  customB: B[]
}

class B extends MysqlEntity {
  id: number // B Primary Key
  /* ... */
  customA: A[]
}

class C extends MysqlEntity {
  aId: number // Foreign Key 1
  bId: number // Foreign Key 2
}

A.belongsToMany(B, C, "aId", "customB") // A belongs to B through C, so A can have many B as B can have many A.
B.belongsToMany(A, C, "bId", "customA") // B belongs to A through C, so B can have many A as A can have many B.
C.belongsTo(A, "aId")
C.belongsTo(B, "bId")
```

It's important that the "middle" entity must define the association with the main and remote entities to match the relationship. Otherwise it will throw an error.

* **entity**: The entity to define an association with.
* **through**: The "middle" entity that will have the foreign keys of the main and remote entities.
* **foreignKey**: The name of the column that will be used as the foreign key.
* **custom**: The name of the parameter that will be used to populate the association.


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

This module will include methos that can be used to execute class level operations like:

### `entitiesMatch(ent1: MysqlEntity, ent2: MysqlEntity): boolean`

Used to compare two entity instances by comparing the values of its parameters:

```js
let user1 = new User({firstName: "Luis"})
let user2 = new User()
user2.firstName = "Luis"
entitiesMatch(user1, user2)   // true

user1.email = "test@email.com"
entitiesMatch(user1, user2)   // false
```