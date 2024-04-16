import { Context, Service } from "tydet-core";
import { LogLevel, Logger, LoggerMode } from "tydet-core-logger";
import { MysqlConnector } from "./mysql.service";
import { MysqlDataType, MysqlDefaultValues, MysqlEntity } from "./mysql.schema";
import { QueryCreateTable } from "./mysql.query";

export class MysqlMigration {
  async up(_db: MysqlConnector): Promise<void> {
    // TODO: On Migration
  }

  async down(_db: MysqlConnector): Promise<void> {
    // TODO: On Rollback
  }
}

const MIGRATION_HISTORY_TABLE = "db_migration_history"

class MysqlMigrationHistory extends MysqlEntity {
  id: number
  migration_name: string
  implemented_at: Date
}

MysqlMigrationHistory.DefineSchema(MIGRATION_HISTORY_TABLE, {
  id: {
    type: MysqlDataType.INT,
    primaryKey: true
  },
  migration_name: {
    type: MysqlDataType.LONGTEXT,
    required: true
  },
  implemented_at: {
    type: MysqlDataType.DATETIME,
    default: MysqlDefaultValues.DATENOW
  }
})

export class MysqlMigrationHandler {
  protected context: Context
  protected db: MysqlConnector
  protected migrations: (typeof MysqlMigration)[]

  constructor(db: MysqlConnector, migrations: (typeof MysqlMigration)[], context?: Context) {
    this.context = context
    this.db = db
    this.migrations = migrations
  }

  private loadLogger() {
    let l = this.context.getServiceSafe("logger")
    if (l == null) {
      if (this.context != null) {
        let logger = new Logger([
          {
            mode: LoggerMode.CONSOLE,
            min: LogLevel.INFO
          }
        ])
        this.context.mountService("logger", logger).then(() => {
          // OK!
        })
      }
    }
  }

  private getLogger() {
    return this.context.getServiceSafe("logger") as Logger | undefined
  }

  async prepare() {
    await this.loadLogger()
    this.getLogger()?.info(MysqlMigrationHandler.name, "Checking database migration settings...");
    let query = QueryCreateTable(MIGRATION_HISTORY_TABLE, true)
      .addColumn("id", MysqlDataType.INT, {autoincrement: true, primaryKey: true, nullable: false})
      .addColumn("migration_name", MysqlDataType.TEXT, {nullable: false})
      .addColumn("implemented_at", MysqlDataType.DATETIME, {nullable: false})
      .toQuery()
    await this.db.run(query)
  }

  async migrate() {
    for await (let migration of this.migrations) {
      let exist = await MysqlMigrationHistory.FindOne(this.db, {migration_name: migration.name});
      if (exist == null) {
        let m = new migration();
        try {
          await m.up(this.db);
          let mh = new MysqlMigrationHistory({migration_name: migration.name});
          await mh.insert(this.db);
          this.getLogger()?.success(MysqlMigrationHandler.name, `${migration.name} migration implemented successfully!`);
        } catch(err) {
          this.getLogger()?.error(MysqlMigrationHandler.name, `${migration.name} migration has errors!`, err);
          throw err
        }
      }
    }
    this.getLogger()?.info(MysqlMigrationHandler.name, `Database is up to date!`);
  }

  async rollback() {
    let reversed = [...this.migrations].reverse()
    for await (let migration of reversed) {
      let exist = await MysqlMigrationHistory.FindOne(this.db, {migration_name: migration.name});
      if (exist != null) {
        let m = new migration();
        try {
          await m.down(this.db);
          this.getLogger()?.success(MysqlMigrationHandler.name, `${migration.name} migration rollbacked successfully!`);
          await exist.remove(this.db);
        } catch(err) {
          this.getLogger()?.error(MysqlMigrationHandler.name, `${migration.name} migration has errors!`, err);
          throw err
        }
        break;
      }
    }
    this.getLogger()?.info(MysqlMigrationHandler.name, `Done!`);
  }
}