import { CoreError } from "tydet-core";

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