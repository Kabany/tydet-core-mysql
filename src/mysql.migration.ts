import { Context } from "tydet-core";
import { MysqlConnector } from "./mysql.service";
import { MysqlDataType, MysqlDefaultValues, MysqlEntity } from "./mysql.schema";
import { QueryCreateTable } from "./mysql.query";
import { MysqlCoreError } from "./mysql.error";

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

export type MysqlMigrationStatusCallback = (context: Context, dbName: string, message: string, err?: any) => void

export class MysqlMigrationHandler {
  protected context: Context
  protected db: MysqlConnector
  protected migrations: (typeof MysqlMigration)[]

  onStatusUpdate: MysqlMigrationStatusCallback

  constructor(db: MysqlConnector, migrations: (typeof MysqlMigration)[], context?: Context) {
    this.context = context
    this.db = db
    this.migrations = migrations
  }

  async prepare() {
    if (this.onStatusUpdate) this.onStatusUpdate(this.context, this.db.getName(), "Checking database migration settings...")
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
          if (this.onStatusUpdate) this.onStatusUpdate(this.context, this.db.getName(), `Migration '${migration.name}' implemented successfully!`)
        } catch(err) {
          let e: any
          if (err instanceof MysqlCoreError) {
            e = err
          } else if (err instanceof Error) {
            e = new MysqlCoreError(err.message)
          } else {
            e = new MysqlCoreError(err)
          }
          if (this.onStatusUpdate) this.onStatusUpdate(this.context, this.db.getName(), `Migration '${migration.name}' has errors!`, e)
          throw e
        }
      }
    }
    if (this.onStatusUpdate) this.onStatusUpdate(this.context, this.db.getName(), `Database is up to date!`)
  }

  async rollback() {
    let reversed = [...this.migrations].reverse()
    for await (let migration of reversed) {
      let exist = await MysqlMigrationHistory.FindOne(this.db, {migration_name: migration.name});
      if (exist != null) {
        let m = new migration();
        try {
          await m.down(this.db);
          if (this.onStatusUpdate) this.onStatusUpdate(this.context, this.db.getName(), `Migration '${migration.name}' rollbacked successfully!`)
          await exist.remove(this.db);
        } catch(err) {
          let e: any
          if (err instanceof MysqlCoreError) {
            e = err
          } else if (err instanceof Error) {
            e = new MysqlCoreError(err.message)
          } else {
            e = new MysqlCoreError(err)
          }
          if (this.onStatusUpdate) this.onStatusUpdate(this.context, this.db.getName(), `Migration '${migration.name}' has errors!`, e)
          throw e
        }
        break;
      }
    }
    if (this.onStatusUpdate) this.onStatusUpdate(this.context, this.db.getName(), `Done`)
  }
}