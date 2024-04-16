import mysql from "mysql"
import { Context, Service } from "tydet-core"
import { MysqlCoreError } from "./mysql.error"

interface MysqlParamsInterface {
  host?: string
  port?: number
  user: string
  pass: string
  db: string
}

export interface MysqlQuery {
  sql: string
  params: any[]
  nested?: boolean
}

export type MysqlStatusCallback = (configurations: {host, port, user, name}) => void

const DB_HOST = "DB_HOST";
const DB_PORT = "DB_PORT";
const DB_USER = "DB_USER";
const DB_PASS = "DB_PASS";
const DB_NAME = "DB_NAME";

export class MysqlConnector extends Service {
  connection: mysql.Connection

  onConnected: MysqlStatusCallback
  onDisconnected: MysqlStatusCallback

  constructor(params: MysqlParamsInterface) {
    let map = new Map()
    map.set(DB_HOST, params.host || "localhost");
    map.set(DB_PORT, params.port || 3306);
    map.set(DB_USER, params.user);
    map.set(DB_PASS, params.pass);
    map.set(DB_NAME, params.db);
    super(map);
  }

  async connect() {
    this.connection = mysql.createConnection({
      host: this.params.get(DB_HOST),
      database: this.params.get(DB_NAME),
      port: this.params.get(DB_PORT),
      user: this.params.get(DB_USER),
      password: this.params.get(DB_PASS)
    });
    await new Promise<void>((resolve, reject) => {
      this.connection!.connect((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async disconnect() {
    if (this.connection != null) {
      this.connection.destroy();
    }
  }

  override async beforeMount(context: Context) {
    let errors: any = {}
    if (!this.params.has(DB_HOST)) {
      errors.dbHost = "Not defined";
    }
    if (!this.params.has(DB_PORT)) {
      errors.dbPort = "Not defined";
    }
    if (!this.params.has(DB_USER)) {
      errors.dbUser = "Not defined";
    }
    if (!this.params.has(DB_PASS)) {
      errors.dbPass = "Not defined";
    }
    if (!this.params.has(DB_NAME)) {
      errors.dbName = "Not defined";
    }

    if (Object.keys(errors).length > 0) {
      let msg = "Error with configuration parameters:\n";
      for (let key of Object.keys(errors)) {
        msg += `${key}: ${errors[key]}\n`;
      }
      throw new MysqlCoreError(msg);
    }

    await super.beforeMount(context)
  }

  override async onMount() {
    await this.connect()
  }

  override async beforeUnmount() {
    await this.disconnect()
  }

  getName() {
    return this.params.get(DB_NAME) as string;
  }

  async exec(sql: string, data?: any[], nested?: boolean) {
    return new Promise<any>((resolve, reject) => {
      this.connection!.query({sql, nestTables: nested === true}, data || [], (err, result, fields) => {
        if (err) {
          //console.log(err)
          let sql = typeof err == "object" && err.sql != null ? err.sql : null
          reject(new MysqlCoreError(`${err}`, sql));
        } else {
          resolve({result, fields});
        }
      });
    });
  }

  async run(query: MysqlQuery) {
    return this.exec(query.sql, query.params, query.nested)
  }
}