import { CoreError } from "tydet-core";

export class MysqlCoreError extends CoreError {
  name: string

  constructor(message?: string) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.stack = (new Error(message)).stack;  //`${this.message}\n${new Error().stack}`;
  }
}