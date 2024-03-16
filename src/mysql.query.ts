import { MysqlCoreError } from "./mysql.error"
import { MysqlDataType } from "./mysql.schema"
import { MysqlQuery } from "./mysql.service"




interface MysqlColumnOptions {
  size?: number
  decimal?: number
  nullable?: boolean
  primaryKey?: boolean
  unique?: boolean
  autoincrement?: boolean
  default?: any
}

interface MysqlColumnCreate extends MysqlColumnOptions {
  name: string
  type: MysqlDataType
}

class MysqlCreateTableQuery {
  private table: string
  private ifNotExists: boolean
  private columns: MysqlColumnCreate[]
  
  constructor(table: string, ifNotExists: boolean = true) {
    this.table = table
    this.ifNotExists = ifNotExists
    this.columns = []
  }

  addColumn(name: string, type: MysqlDataType, options: MysqlColumnOptions = {}) {
    let column = {
      name,
      type,
      ...options
    }
    this.columns.push(column)
    return this
  }

  toQuery() {
    if (this.columns.length == 0) {
      throw new MysqlCoreError(`No columns defined for the table'${this.table}'`);
    }
    let data: MysqlQuery = {query: "", params: []}
    data.query += `CREATE TABLE${this.ifNotExists ? " IF NOT EXISTS" : ""} \`${this.table}\` (`
    let isFirst = true
    for (let column of this.columns) {
      if (isFirst) {
        isFirst = false
      } else {
        data.query += `, `
      }

      data.query += `\`${column.name}\` ${column.type}`

      if (column.type == MysqlDataType.DECIMAL) {
        if (column.size == null) column.size = 10
        if (column.decimal == null) column.decimal = 2
        data.query += `(${column.size},${column.decimal})`
      } else if (column.type == MysqlDataType.VARCHAR) {
        if (column.size == null) column.size = 255
        data.query += `(${column.size})`
      } else if ([MysqlDataType.BOOLEAN, MysqlDataType.DATE, MysqlDataType.DATETIME, MysqlDataType.TINYINT, MysqlDataType.SMALLINT, MysqlDataType.MEDIUMINT, MysqlDataType.INT, MysqlDataType.BIGINT, MysqlDataType.TEXT, MysqlDataType.LONGTEXT].indexOf(column.type) >= 0) {
        // add nothing
      } else {
        if (column.size == null) {
          // do nothing
        } else {
          data.query += `(${column.size})`
        }
      }

      if (column.nullable) {
        data.query += ` NULL`
      } else {
        data.query += ` NOT NULL`
      }

      if (column.unique && [MysqlDataType.BOOLEAN, MysqlDataType.DATE, MysqlDataType.DATETIME].indexOf(column.type) == -1) {
        data.query += ` UNIQUE`
      }

      if (column.autoincrement && [MysqlDataType.TINYINT, MysqlDataType.SMALLINT, MysqlDataType.MEDIUMINT, MysqlDataType.INT, MysqlDataType.BIGINT].indexOf(column.type) >= 0) {
        data.query += ` AUTO_INCREMENT`
      }

      if (column.default !== undefined) {
        data.query += ` DEFAULT ?`
        data.params.push(column.default)
      }

      if (column.primaryKey && [MysqlDataType.TINYINT, MysqlDataType.SMALLINT, MysqlDataType.MEDIUMINT, MysqlDataType.INT, MysqlDataType.BIGINT, MysqlDataType.VARCHAR].indexOf(column.type) >= 0) {
        data.query += `, PRIMARY KEY (\`${column.name}\`)`;
      }
    }
    data.query += `);`
    return data
  }
}

export function CreateTable(table: string, ifNotExists: boolean = true) {
  return new MysqlCreateTableQuery(table, ifNotExists)
}

export function DropTable(table: string, ifNotExists: boolean = true) {
  let data: MysqlQuery = {query: `DROP TABLE${ifNotExists ? " IF NOT EXISTS" : ""} \`${table}\`;`, params: []}
  return data
}

export function RenameTable(oldName: string, newName: string) {
  let data: MysqlQuery = {query: `ALTER TABLE \`${oldName}\` RENAME TO \`${newName}\`;`, params: []}
  return data
}

enum MysqlAlterAction {
  ADD_COLUMN = "ADD COLUMN",
  MODIFY_COLUMN = "MODIFY COLUMN",
  DROP_COLUMN = "DROP COLUMN"
}

interface MysqlModifyColumnOptions extends MysqlColumnOptions {
  newName?: string
  after?: "FISRT" | string
}

interface MysqlAddColumnOptions extends MysqlColumnOptions {
  after?: "FISRT" | string
}

interface MysqlColumnAlter extends MysqlModifyColumnOptions {
  name: string
  action: MysqlAlterAction
  type?: MysqlDataType
}

class MysqlAlterTableQuery {
  private table: string
  private changes: MysqlColumnAlter[]

  constructor(table: string) {
    this.table = table
    this.changes = []
  }

  addColumn(name: string, type: MysqlDataType, options: MysqlAddColumnOptions = {}) {
    let change = {
      name,
      action: MysqlAlterAction.ADD_COLUMN,
      type,
      ...options
    }
    this.changes.push(change)
    return this
  }

  modifyColumn(name: string, type: MysqlDataType, options: MysqlModifyColumnOptions = {}) {
    let change = {
      name,
      action: MysqlAlterAction.MODIFY_COLUMN,
      type,
      ...options
    }
    this.changes.push(change)
    return this
  }

  dropColumn(name: string) {
    let change = {
      name,
      action: MysqlAlterAction.DROP_COLUMN
    }
    this.changes.push(change)
    return this
  }

  toQuery() {
    if (this.changes.length == 0) {
      throw new MysqlCoreError(`No changes defined for the table'${this.table}'`);
    }
    let data: MysqlQuery = {query: "", params: []}
    data.query += `ALTER TABLE \`${this.table}\``
    let isFirst = true
    for (let change of this.changes) {
      if (isFirst) {
        isFirst = false
      } else {
        data.query += `,`
      }

      data.query += ` ${change.action} \`${change.name}\``

      if (change.action == MysqlAlterAction.DROP_COLUMN) {
        // add nothing
      } else {
        data.query += ` ${change.type}`

        if (change.type == MysqlDataType.DECIMAL) {
          if (change.size == null) change.size = 10
          if (change.decimal == null) change.decimal = 2
          data.query += `(${change.size},${change.decimal})`
        } else if (change.type == MysqlDataType.VARCHAR) {
          if (change.size == null) change.size = 255
          data.query += `(${change.size})`
        } else if ([MysqlDataType.BOOLEAN, MysqlDataType.DATE, MysqlDataType.DATETIME, MysqlDataType.TINYINT, MysqlDataType.SMALLINT, MysqlDataType.MEDIUMINT, MysqlDataType.INT, MysqlDataType.BIGINT, MysqlDataType.TEXT, MysqlDataType.LONGTEXT].indexOf(change.type) >= 0) {
          // add nothing
        } else {
          if (change.size == null) {
            // do nothing
          } else {
            data.query += `(${change.size})`
          }
        }

        if (change.nullable) {
          data.query += ` NULL`
        } else {
          data.query += ` NOT NULL`
        }

        if (change.unique && [MysqlDataType.BOOLEAN, MysqlDataType.DATE, MysqlDataType.DATETIME].indexOf(change.type) == -1) {
          data.query += ` UNIQUE`
        }
  
        if (change.autoincrement && [MysqlDataType.TINYINT, MysqlDataType.SMALLINT, MysqlDataType.MEDIUMINT, MysqlDataType.INT, MysqlDataType.BIGINT].indexOf(change.type) >= 0) {
          data.query += ` AUTO_INCREMENT`
        }
  
        if (change.default !== undefined) {
          data.query += ` DEFAULT ?`
          data.params.push(change.default)
        }

        if (change.after == "FIRST") {
          data.query += ` FIRST`
        } else if (change.after != null) {
          data.query += ` AFTER \`${change.after}\``
        }
      }
    }
    data.query += `;`
    return data
  }
}

export function AlterTable(table: string) {
  return new MysqlAlterTableQuery(table)
}