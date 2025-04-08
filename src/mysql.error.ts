import { CoreError } from "tydet-core";
import { MysqlWhereOptions } from "./mysql.query";

export class MysqlCoreError extends CoreError {
  sql: string

  constructor(message?: string, sql?: string) {
    super();
    Object.setPrototypeOf(this, MysqlCoreError.prototype);
    this.name = this.constructor.name
    this.message = message + (sql != null ? `-- Query: ${sql}` : "")
    this.sql = sql;
    if (Error.captureStackTrace) Error.captureStackTrace(this, MysqlCoreError);
  }
}

export class MysqlEntityDefinitionError extends MysqlCoreError {

  constructor(message: string) {
    super();
    Object.setPrototypeOf(this, MysqlEntityDefinitionError.prototype);
    this.name = this.constructor.name
    this.message = message
    if (Error.captureStackTrace) Error.captureStackTrace(this, MysqlEntityDefinitionError);
  }
}

export class MysqlEntityValidationError extends MysqlCoreError {
  errors: any

  constructor(message: string, errors: any) {
    super();
    Object.setPrototypeOf(this, MysqlEntityValidationError.prototype);
    this.name = this.constructor.name
    this.message = message
    this.errors = errors
    if (Error.captureStackTrace) Error.captureStackTrace(this, MysqlEntityValidationError);
  }
}

export class MysqlEntityNotFound extends MysqlCoreError {
  table: string
  pk: string
  where: any

  constructor(message: string, table: string, pk: string, where: MysqlWhereOptions) {
    super();
    Object.setPrototypeOf(this, MysqlEntityNotFound.prototype);
    this.name = this.constructor.name
    this.pk = pk
    this.table = table
    this.where = where
    this.message = message + ` -- Table: ${this.table}, pk: ${this.pk}, where: ${this.where}`;
    if (Error.captureStackTrace) Error.captureStackTrace(this, MysqlEntityNotFound);
  }
}