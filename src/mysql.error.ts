import { CoreError } from "tydet-core";
import { MysqlWhereOptions } from "./mysql.query";

export class MysqlCoreError extends CoreError {
  name: string
  sql: string

  constructor(message?: string, sql?: string) {
    super(message);
    this.name = "MysqlCoreError";
    this.message = message;
    this.sql = sql;
    if (sql != null && message != null) {
      this.message += `\nSQL Query: ${this.sql}`
    }
    this.stack = (new Error(this.message)).stack;  //`${this.message}\n${new Error().stack}`;
  }
}

export class MysqlEntityDefinitionError extends MysqlCoreError {
  name: string
  errors: any

  constructor(message: string) {
    super(message);
    this.name = "MysqlEntityDefinitionError";
    this.message = message;
    this.stack = (new Error(message)).stack;  //`${this.message}\n${new Error().stack}`;
  }
}

export class MysqlEntityValidationError extends MysqlCoreError {
  name: string
  errors: any

  constructor(message: string, errors: any) {
    super(message);
    this.name = "MysqlEntityValidationError";
    this.message = message;
    this.errors = errors;
    this.stack = (new Error(message)).stack;  //`${this.message}\n${new Error().stack}`;
  }
}

export class MysqlEntityNotFound extends MysqlCoreError {
  name: string
  errors: any
  table: string
  pk: string
  where: any

  constructor(message: string, table: string, pk: string, where: MysqlWhereOptions) {
    super(message);
    this.name = "MysqlEntityNotFound";
    this.message = message + ` -- Table: ${table}, pk: ${pk}, where: ${where}`;
    this.table = table;
    this.pk = pk;
    this.where = where;
    this.stack = (new Error(message)).stack;  //`${this.message}\n${new Error().stack}`;
  }
}