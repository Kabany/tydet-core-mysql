import { MysqlCoreError } from "./mysql.error"
import { MysqlDataType } from "./mysql.schema"
import { MysqlConnector, MysqlQuery } from "./mysql.service"


// Table operations

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
    let data: MysqlQuery = {sql: "", params: []}
    data.sql += `CREATE TABLE${this.ifNotExists ? " IF NOT EXISTS" : ""} \`${this.table}\` (`
    let isFirst = true
    for (let column of this.columns) {
      if (isFirst) {
        isFirst = false
      } else {
        data.sql += `, `
      }

      data.sql += `\`${column.name}\` ${column.type}`

      if (column.type == MysqlDataType.DECIMAL) {
        if (column.size == null) column.size = 10
        if (column.decimal == null) column.decimal = 2
        data.sql += `(${column.size},${column.decimal})`
      } else if (column.type == MysqlDataType.VARCHAR) {
        if (column.size == null) column.size = 255
        data.sql += `(${column.size})`
      } else if ([MysqlDataType.BOOLEAN, MysqlDataType.DATE, MysqlDataType.DATETIME, MysqlDataType.TINYINT, MysqlDataType.SMALLINT, MysqlDataType.MEDIUMINT, MysqlDataType.INT, MysqlDataType.BIGINT, MysqlDataType.TEXT, MysqlDataType.LONGTEXT].indexOf(column.type) >= 0) {
        // add nothing
      } else {
        if (column.size == null) {
          // do nothing
        } else {
          data.sql += `(${column.size})`
        }
      }

      if (column.nullable) {
        data.sql += ` NULL`
      } else {
        data.sql += ` NOT NULL`
      }

      if (column.unique && [MysqlDataType.BOOLEAN, MysqlDataType.DATE, MysqlDataType.DATETIME].indexOf(column.type) == -1) {
        data.sql += ` UNIQUE`
      }

      if (column.autoincrement && [MysqlDataType.TINYINT, MysqlDataType.SMALLINT, MysqlDataType.MEDIUMINT, MysqlDataType.INT, MysqlDataType.BIGINT].indexOf(column.type) >= 0) {
        data.sql += ` AUTO_INCREMENT`
      }

      if (column.default !== undefined) {
        data.sql += ` DEFAULT ?`
        data.params.push(column.default)
      }

      if (column.primaryKey && [MysqlDataType.TINYINT, MysqlDataType.SMALLINT, MysqlDataType.MEDIUMINT, MysqlDataType.INT, MysqlDataType.BIGINT, MysqlDataType.VARCHAR].indexOf(column.type) >= 0) {
        data.sql += `, PRIMARY KEY (\`${column.name}\`)`;
      }
    }
    data.sql += `);`
    return data
  }

  async run(db: MysqlConnector) {
    return await db.run(this.toQuery())
  }
}

export function QueryCreateTable(table: string, ifNotExists: boolean = true) {
  return new MysqlCreateTableQuery(table, ifNotExists)
}

class MysqlDropTableQuery {
  private table: string
  private ifExists: boolean
  constructor(table: string, ifExists: boolean = true) {
    this.table = table
    this.ifExists = ifExists
  }
  toQuery() {
    let data: MysqlQuery = {sql: `DROP TABLE${this.ifExists ? " IF EXISTS" : ""} \`${this.table}\`;`, params: []}
    return data
  }
  async run(db: MysqlConnector) {
    return await db.run(this.toQuery())
  }
}

export function QueryDropTable(table: string, ifExists: boolean = true) {
  return new MysqlDropTableQuery(table, ifExists)
}

class MysqlRenameTableQuery {
  private current: string
  private newName: string
  constructor(current: string, newName: string) {
    this.current = current
    this.newName = newName
  }
  toQuery() {
    let data: MysqlQuery = {sql: `ALTER TABLE \`${this.current}\` RENAME TO \`${this.newName}\`;`, params: []}
  return data
  }
  async run(db: MysqlConnector) {
    return await db.run(this.toQuery())
  }
}

export function QueryRenameTable(current: string, newName: string) {
  return new MysqlRenameTableQuery(current, newName)
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
    let data: MysqlQuery = {sql: "", params: []}
    data.sql += `ALTER TABLE \`${this.table}\``
    let isFirst = true
    for (let change of this.changes) {
      if (isFirst) {
        isFirst = false
      } else {
        data.sql += `,`
      }

      data.sql += ` ${change.action} \`${change.name}\``

      if (change.action == MysqlAlterAction.DROP_COLUMN) {
        // add nothing
      } else {
        data.sql += ` ${change.type}`

        if (change.type == MysqlDataType.DECIMAL) {
          if (change.size == null) change.size = 10
          if (change.decimal == null) change.decimal = 2
          data.sql += `(${change.size},${change.decimal})`
        } else if (change.type == MysqlDataType.VARCHAR) {
          if (change.size == null) change.size = 255
          data.sql += `(${change.size})`
        } else if ([MysqlDataType.BOOLEAN, MysqlDataType.DATE, MysqlDataType.DATETIME, MysqlDataType.TINYINT, MysqlDataType.SMALLINT, MysqlDataType.MEDIUMINT, MysqlDataType.INT, MysqlDataType.BIGINT, MysqlDataType.TEXT, MysqlDataType.LONGTEXT].indexOf(change.type) >= 0) {
          // add nothing
        } else {
          if (change.size == null) {
            // do nothing
          } else {
            data.sql += `(${change.size})`
          }
        }

        if (change.nullable) {
          data.sql += ` NULL`
        } else {
          data.sql += ` NOT NULL`
        }

        if (change.unique && [MysqlDataType.BOOLEAN, MysqlDataType.DATE, MysqlDataType.DATETIME].indexOf(change.type) == -1) {
          data.sql += ` UNIQUE`
        }
  
        if (change.autoincrement && [MysqlDataType.TINYINT, MysqlDataType.SMALLINT, MysqlDataType.MEDIUMINT, MysqlDataType.INT, MysqlDataType.BIGINT].indexOf(change.type) >= 0) {
          data.sql += ` AUTO_INCREMENT`
        }
  
        if (change.default !== undefined) {
          data.sql += ` DEFAULT ?`
          data.params.push(change.default)
        }

        if (change.after == "FIRST") {
          data.sql += ` FIRST`
        } else if (change.after != null) {
          data.sql += ` AFTER \`${change.after}\``
        }
      }
    }
    data.sql += `;`
    return data
  }

  async run(db: MysqlConnector) {
    return await db.run(this.toQuery())
  }
}

export function QueryAlterTable(table: string) {
  return new MysqlAlterTableQuery(table)
}





// CRUD operations

export enum MysqlOperator {
  COUNT = "COUNT",
  DISTINCT = "DISTINCT",
  SUM = "SUM"
}

export interface MysqlSelectOptions {
  column: string
  as?: string
  table?: string
  operator?: MysqlOperator
}

export enum MysqlJoinType {
  INNER = "INNER",
  LEFT = "LEFT",
  RIGHT = "RIGHT",
  CROSS = "CROSS"
}

export interface MysqlJoinCondition {
  column: string
  table?: string
}

export interface MysqlJoinOptions {
  table: string | MysqlTableOptions
  type: MysqlJoinType
  on: string | MysqlJoinCondition
  with: string | MysqlJoinCondition
}

export interface MysqlFindOptions {
  select?: (string | MysqlSelectOptions)[]
  join?: MysqlJoinOptions[]
  groupBy?: (string | MysqlGroupOptions)[]
  orderBy?: MysqlOrderOptions[]
  limit?: {page: number, per: number}
}





export function qselect(columns: (string | MysqlSelectOptions)[]) {
  let query: MysqlQuery = {sql: "SELECT ", params: []}
  if (columns == null || columns.length == 0) {
    query.sql += "*"
  } else {
    let isFirst = true
    for (let column of columns) {
      if (isFirst) {
        isFirst = false
      } else {
        query.sql += ", "
      }
      
      if (typeof column == "string") {
        query.sql += `\`${column}\``
      } else if (typeof column == "object") {
        let pre = column.table != null ? `\`${column.table}\`.` : ""
        if (column.operator != null) {
          let col = ["*"].indexOf(column.column) > -1 ? column.column : `\`${column.column}\``
          query.sql += `${column.operator}(${pre}${col})${column.as != null ? (" AS `" + column.as + "`") : ""}`
        } else {
          let col = ["*"].indexOf(column.column) > -1 ? column.column : `\`${column.column}\``
          query.sql += `${pre}${col}${column.as != null ? (" AS `" + column.as + "`") : ""}`
        }
      }
    }
  }
  return query
}



export interface MysqlWhereOptions {
  [column:string]: any
}

function qwhereParams(key: string, obj: any): MysqlQuery {
  let data: MysqlQuery = {sql: "", params: []};

  if (obj["$eq"] !== undefined) {
    data.sql = `${key} = ?`;
    data.params.push(obj["$eq"]);
  } else if (obj["$neq"] !== undefined) {
    data.sql = `${key} <> ?`;
    data.params.push(obj["$neq"]);
  } else if (obj["$gt"] !== undefined) {
    data.sql = `${key} > ?`;
    data.params.push(obj["$gt"]);
  } else if (obj["$gte"] !== undefined) {
    data.sql = `${key} >= ?`;
    data.params.push(obj["$gte"]);
  } else if (obj["$lt"] !== undefined) {
    data.sql = `${key} < ?`;
    data.params.push(obj["$lt"]);
  } else if (obj["$lte"] !== undefined) {
    data.sql = `${key} <= ?`;
    data.params.push(obj["$lte"]);
  } else if (obj["$is"] !== undefined) {
    data.sql = `${key} is ?`;
    data.params.push(obj["$is"]);
  } else if (obj["$not"] !== undefined) {
    data.sql = `${key} is not ?`;
    data.params.push(obj["$not"]);
  } else if (obj["$between"] !== undefined) {
    data.sql = `(${key} BETWEEN ? AND ?)`;
    data.params.push(obj["$between"]["$from"], obj["$between"]["$to"]);
  } else if (obj["$nbetween"] !== undefined) {
    data.sql = `(${key} NOT BETWEEN ? AND ?)`;
    data.params.push(obj["$nbetween"]["$from"], obj["$nbetween"]["$to"]);
  } else if (obj["$in"] !== undefined) {
    data.sql = `${key} IN (?)`;
    data.params.push(obj["$in"]);
  } else if (obj["$nin"] !== undefined) {
    data.sql = `${key} NOT IN (?)`;
    data.params.push(obj["$nin"]);
  } else if (obj["$like"] !== undefined) {
    data.sql = `${key} LIKE ?`;
    data.params.push(obj["$like"]);
  } else if (obj["$nlike"] !== undefined) {
    data.sql = `${key} NOT LIKE ?`;
    data.params.push(obj["$like"]);
  } else {
    data.sql = `${key} = ?`;
    data.params.push(obj);
  }

  return data;
}

export function qwhere(where: MysqlWhereOptions, _subquery: boolean = false): MysqlQuery {
  let data: MysqlQuery = {sql: "", params: []};

  let keys = Object.keys(where);
  if (keys.length) {
    let isFirst = true;
    if (_subquery) {
      data.sql += "(";
    }
    for (let key of keys) {
      switch(key) {
        case "$and":
          let and = where[key]
          if (Array.isArray(and)) {
            for (let opt of and) {
              if (isFirst) {
                isFirst = false;
                if (!_subquery) {
                  data.sql += " WHERE ";
                }
              } else {
                data.sql += " AND ";
              }
              let andObj = qwhere(opt || {}, true);
              data.sql += andObj.sql;
              data.params.push(...andObj.params);
            }
          } else {
            if (isFirst) {
              isFirst = false;
              if (!_subquery) {
                data.sql += " WHERE ";
              }
            } else {
              data.sql += " AND ";
            }
            let andObj = qwhere(where[key] || {}, true);
            data.sql += andObj.sql;
            data.params.push(...andObj.params);
          }
          break;
        case "$or":
          let needClose = false;
          let orFirst = true;
          let orOptions = where[key] || [];
          if (isFirst) {
            isFirst = false;
            if (!_subquery) {
              data.sql += " WHERE ";
            }
          } else {
            data.sql += " AND (";
            needClose = true;
          }
          for (let opt of orOptions) {
            let and = qwhere(opt, true);
            if (orFirst) {
              orFirst = false;
            } else {
              data.sql += " OR ";
            }
            data.sql += and.sql;
            data.params.push(...and.params);
          }
          if (needClose) {
            data.sql += ")";
          }
          break;
        default:
          if (isFirst) {
            isFirst = false;
            if (!_subquery) {
              data.sql += " WHERE ";
            }
          } else {
            data.sql += " AND ";
          }
          let type = typeof where[key]
          let keyName = key.startsWith("$t.") ? `\`${key.split(".")[1]}\`.\`${key.split(".")[2]}\`` : `\`${key}\``
          // resolve table name
          if (where[key] === null || where[key] === undefined) {
            data.sql += `${keyName} IS NULL`;
          } else if (type == "object") {
            let c = qwhereParams(keyName, where[key])
            data.sql += c.sql;
            data.params.push(...c.params)
          } else {
            data.sql += `${keyName} = ?`;
            data.params.push(where[key]);
          }
          break;
      }
    }
  }
  if (_subquery) {
    data.sql += ")";
  }
  
  return data;
}

export function qjoin(joins: MysqlJoinOptions[]) {
  let query: MysqlQuery = {sql: "", params: []};
  if (joins != null && joins.length) {
    for (let join of joins) {
      query.sql += ` ${join.type} JOIN `
      if (typeof join.table == "string") {
        query.sql += `\`${join.table}\``
      } else if (typeof join.table == "object") {
        query.sql += `\`${join.table.table}\`${join.table.as != null ? (" AS `" + join.table.as + "`") : ""}`
      }
      
      let on = ""
      if (typeof join.on == "string") {
        on += `\`${join.on}\``
      } else if (typeof join.on == "object") {
        on += `\`${join.on.table}\`.\`${join.on.column}\``
      }

      let wit = ""
      if (typeof join.with == "string") {
        wit += `\`${join.with}\``
      } else if (typeof join.with == "object") {
        wit += `\`${join.with.table}\`.\`${join.with.column}\``
      }

      query.sql += ` ON ${on} = ${wit}`
    }
  }
  return query
}

export interface MysqlGroupOptions {
  column: string
  table?: string
}

export function qgroupby(groups?: (string | MysqlGroupOptions)[]) {
  let query: MysqlQuery = {sql: "", params: []};
  let isFirst = true;
  if (groups != null && groups.length > 0) {
    for (let item of groups) {
      if (isFirst) {
        query.sql += " GROUP BY ";
        isFirst = false;
      } else {
        query.sql += ", ";
      }
      if (typeof item == "string") {
        query.sql += `\`${item}\``;
      } else {
        let t = item.table != null ? `\`${item.table}\`.` : ""
        query.sql += `${t}\`${item.column}\``;
      }
    }
  }
  return query;
}

export interface MysqlOrderOptions {
  column: string
  table?: string
  order: "DESC" | "ASC"
}

export function qorderby(options?: MysqlOrderOptions[]) {
  let query: MysqlQuery = {sql: "", params: []}
  let isFirst = true;
  if (options != null) {
    for (let item of options) {
      if (isFirst) {
        query.sql += " ORDER BY "
        isFirst = false
      } else {
        query.sql += ", "
      }
      let t = item.table != null ? `\`${item.table}\`.` : ""
      query.sql += `${t}\`${item.column}\` ${item.order}`
    }
  }
  return query;
}

export function qlimit(per = 100, page = 1): MysqlQuery {
  let data: MysqlQuery = {sql: " LIMIT ? OFFSET ?", params: [per, (per * (page - 1))]}
  return data;
}

export interface MysqlFindOneOptions {
  select?: (string | MysqlSelectOptions)[]
  join?: MysqlJoinOptions[]
  groupBy?: (string | MysqlGroupOptions)[]
  orderBy?: MysqlOrderOptions[]
}

export interface MysqlCountOptions {
  countBy?: string
  join?: MysqlJoinOptions[]
  groupBy?: (string | MysqlGroupOptions)[]
}








export interface MysqlTableOptions {
  table: string
  as?: string
}

export async function QueryFind(db: MysqlConnector, table: string | MysqlTableOptions, where?: MysqlWhereOptions, options?: MysqlFindOptions): Promise<any[]> {
  let wh = where || {}
  let opt = options || {}
  let find: MysqlQuery = {sql: "", params: []}

  let select: MysqlQuery = {sql: "", params: []}
  select = qselect(opt.select || [])
  find.sql += `${select.sql}`
  if (typeof table == "string") {
    find.sql += ` FROM \`${table}\``
  } else if (typeof table == "object") {
    find.sql += ` FROM \`${table.table}\`${table.as != null ? (" AS `" + table.as + "`") : ""}`
  }
  find.params.push(...select.params)

  let join: MysqlQuery = {sql: "", params: []}
  if (opt.join != null && opt.join.length > 0) {
    join = qjoin(opt.join)
  }
  find.sql += join.sql
  find.params.push(...join.params)

  let w: MysqlQuery = {sql: "", params: []}
  if (Object.keys(wh).length > 0) {
    w = qwhere(wh, false)
  }
  find.sql += w.sql
  find.params.push(...w.params)

  let group: MysqlQuery = {sql: "", params: []}
  if (opt.groupBy != null && opt.groupBy.length > 0) {
    group = qgroupby(opt.groupBy)
  }
  find.sql += group.sql
  find.params.push(...group.params)

  let order: MysqlQuery = {sql: "", params: []}
  if (opt.orderBy != null && opt.orderBy.length > 0) {
    order = qorderby(opt.orderBy)
  }
  find.sql += order.sql
  find.params.push(...order.params)

  let limit: MysqlQuery = {sql: "", params: []}
  if (opt.limit != null) {
    limit = qlimit(opt.limit.per, opt.limit.page)
  } else {
    limit = qlimit(1000, 1)
  }
  find.sql += `${limit.sql};`
  find.params.push(...limit.params)

  if (db == null) {
    return [find]
  } else {
    let data = await db.exec(find.sql, find.params, true)
    return data.result
  }
}

export async function QueryFindOne(db: MysqlConnector, table: string | MysqlTableOptions, where?: MysqlWhereOptions, options?: MysqlFindOneOptions): Promise<any> {
  let wh = where || {}
  let opt = options || {}
  let find: MysqlQuery = {sql: "", params: []}

  let select: MysqlQuery = {sql: "", params: []}
  select = qselect(opt.select || [])
  find.sql += `${select.sql}`
  if (typeof table == "string") {
    find.sql += ` FROM \`${table}\``
  } else if (typeof table == "object") {
    find.sql += ` FROM \`${table.table}\`${table.as != null ? (" AS `" + table.as + "`") : ""}`
  }
  find.params.push(...select.params)

  let join: MysqlQuery = {sql: "", params: []}
  if (opt.join != null && opt.join.length > 0) {
    join = qjoin(opt.join)
  }
  find.sql += join.sql
  find.params.push(...join.params)

  let w: MysqlQuery = {sql: "", params: []}
  if (Object.keys(wh).length > 0) {
    w = qwhere(wh, false)
  }
  find.sql += w.sql
  find.params.push(...w.params)

  let group: MysqlQuery = {sql: "", params: []}
  if (opt.groupBy != null && opt.groupBy.length > 0) {
    group = qgroupby(opt.groupBy)
  }
  find.sql += group.sql
  find.params.push(...group.params)

  let order: MysqlQuery = {sql: "", params: []}
  if (opt.orderBy != null && opt.orderBy.length > 0) {
    order = qorderby(opt.orderBy)
  }
  find.sql += order.sql
  find.params.push(...order.params)

  let limit = qlimit(1, 1)
  find.sql += `${limit.sql};`
  find.params.push(...limit.params)

  if (db == null) {
    return find
  } else {
    let data = await db.exec(find.sql, find.params, true)
    if (data.result.length > 0) {
      return data.result[0]
    } else {
      return null
    }
  }
}

export async function QueryCount(db: MysqlConnector, table: string | MysqlTableOptions, where?: MysqlWhereOptions, options?: MysqlCountOptions): Promise<number> {
  let wh = where || {}
  let opt = options || {}
  
  let find: MysqlQuery = {sql: "", params: []}
  let t: string

  let c = opt.countBy != null ? opt.countBy : "*"
  let select = qselect([{column: c, as: "total", operator: MysqlOperator.COUNT}])
  find.sql += `${select.sql}`
  if (typeof table == "string") {
    find.sql += ` FROM \`${table}\``
    t = table
  } else if (typeof table == "object") {
    t = table.as
    find.sql += ` FROM \`${table.table}\`${table.as != null ? (" AS `" + table.as + "`") : ""}`
  }
  find.params.push(...select.params)

  let join: MysqlQuery = {sql: "", params: []}
  if (opt.join != null && opt.join.length > 0) {
    join = qjoin(opt.join)
  }
  find.sql += join.sql
  find.params.push(...join.params)

  let w: MysqlQuery = {sql: "", params: []}
  if (Object.keys(wh).length > 0) {
    w = qwhere(wh, false)
  }
  find.sql += w.sql
  find.params.push(...w.params)

  let group: MysqlQuery = {sql: "", params: []}
  if (opt.groupBy != null && opt.groupBy.length > 0) {
    group = qgroupby(opt.groupBy)
  }
  find.sql += group.sql
  find.params.push(...group.params)

  find.sql += `;`

  if (db == null) {
    return find as any
  } else {
    let data = await db.exec(find.sql, find.params, true)
    if (data.result.length > 0) {
      return data.result[0][''].total as number
    } else {
      return 0
    }
  }
}

export interface MysqlUpdateSetValues {
  [column:string]: any
}

export async function QueryUpdate(db: MysqlConnector, table: string | MysqlTableOptions, setVals: MysqlUpdateSetValues, where?: MysqlWhereOptions): Promise<{changed: number, query?: MysqlQuery}> {
  let wh = where || {}
  let setV = setVals || {}
  
  let update: MysqlQuery = {sql: "", params: []}

  let t: MysqlQuery = {sql: "", params: []}
  if (typeof table == "string") {
    t.sql += `UPDATE \`${table}\``
  } else if (typeof table == "object") {
    t.sql += `UPDATE \`${table.table}\``
  }
  update.sql += t.sql

  let s: MysqlQuery = {sql: "", params: []}
  let keys = Object.keys(setV)
  let sIsFirst = true
  for (let key of keys) {
    if (sIsFirst) {
      sIsFirst = false
      s.sql += " SET "
    } else {
      s.sql += ", "
    }
    s.sql += `\`${key}\` = ?`
    s.params.push(setV[key])
  }
  update.sql += s.sql
  update.params.push(...s.params)

  let w: MysqlQuery = {sql: "", params: []}
  if (Object.keys(wh).length > 0) {
    w = qwhere(wh, false)
  }
  update.sql += w.sql
  update.params.push(...w.params)

  update.sql += `;`

  if (db == null) {
    return {query: update, changed: 0}
  } else {
    let data = await db.run(update)
    return {changed: data.result.changedRows}
  }
}