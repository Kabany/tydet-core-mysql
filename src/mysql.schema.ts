import { StringUtils, DateUtils } from "tydet-utils"
import { v1, v4 } from "uuid"
import { MysqlCoreError, MysqlEntityValidationError } from "./mysql.error"
import { MysqlConnector, MysqlQuery } from "./mysql.service"
import { MysqlGroupOptions, MysqlOperator, MysqlOrderOptions, MysqlSelectOptions, MysqlWhereOptions, qgroupby, qlimit, qorderby, qselect, qwhere } from "./mysql.query"
import { entitiesMatch } from "./mysql.utils"


export enum MysqlDataType {
  VARCHAR = "VARCHAR",
  TEXT = "TEXT",
  LONGTEXT = "LONGTEXT",
  TINYINT = "TINYINT",
  SMALLINT = "SMALLINT",
  MEDIUMINT = "MEDIUMINT",
  INT = "INT",
  BIGINT = "BIGINT",
  DECIMAL = "DECIMAL",
  DATE = "DATE",
  DATETIME = "DATETIME",
  BOOLEAN = "BOOLEAN"
}


export enum MysqlDefaultValues {
  NULL = "NULL",
  DATENOW = "DATENOW",
  UUIDV1 = "UUIDV1",
  UUIDV4 = "UUIDV4"
}

export enum MysqlValidationError {
  REQUIRED = "REQUIRED",
  INVALID_TYPE = "INVALID_TYPE",
  INVALID_VALUE = "INVALID_VALUE",
  MAX_VALUE = "MAX_VALUE",
  MIN_VALUE = "MIN_VALUE",
  MAX_LENGTH = "MAX_LENGTH",
  MIN_LENGTH = "MIN_LENGTH"
}

export interface MysqlEntityParameter {
  name: string
  type: MysqlDataType
  default: any,
  required: boolean,
  primaryKey: boolean,
  columnName: string,
  unique: boolean
  validators: ((value: any) => MysqlParameterValidation)[]
}

interface MysqlParameterValidation {
  success: boolean
  message?: string
}

interface MysqlEntityColumn {
  type: MysqlDataType,
  default?: any,
  required?: boolean
  columnName?: string,
  primaryKey?: boolean,
  unique?: boolean
  validators?: ((data: any) => boolean | MysqlParameterValidation)[]
}

interface MysqlEntityStringColumn extends MysqlEntityColumn {
  type: MysqlDataType.VARCHAR | MysqlDataType.TEXT | MysqlDataType.LONGTEXT
  minLen?: number
  maxLen?: number
}

interface MysqlEntityNumberColumn extends MysqlEntityColumn {
  type: MysqlDataType.DECIMAL | MysqlDataType.TINYINT | MysqlDataType.SMALLINT | MysqlDataType.MEDIUMINT | MysqlDataType.INT | MysqlDataType.BIGINT
  min?: number
  max?: number
}

interface MysqlEntityOptions {
  readColumn: boolean
}

interface MysqlEntityInsert {
  rewriteTable?: string
}

interface MysqlEntityUpdate {
  rewriteTable?: string
}

interface MysqlEntityRemove {
  rewriteTable?: string
}

export enum MysqlAssociationType {
  BELONGS_TO = "BELONGS_TO",
  BELONGS_TO_MANY = "BELONGS_TO_MANY",
  HAS_ONE = "HAS_ONE",
  HAS_MANY = "HAS_MANY",
}

interface MysqlEntityAssociation {
  type: MysqlAssociationType
  entity: typeof MysqlEntity
  entityName: string
  foreignKey?: string
  through?: typeof MysqlEntity
}


export interface MysqlEntityFindOptions {
  select?: (string | MysqlSelectOptions)[]
  groupBy?: (string | MysqlGroupOptions)[]
  orderBy?: MysqlOrderOptions[]
  limit?: {page: number, per: number}
  populate?: typeof MysqlEntity[]
}

export interface MysqlEntityFindOneOptions {
  select?: (string | MysqlSelectOptions)[]
  groupBy?: (string | MysqlGroupOptions)[]
  orderBy?: MysqlOrderOptions[]
  populate?: typeof MysqlEntity[]
}

export interface MysqlEntityCountOptions {
  countBy?: string
  groupBy?: (string | MysqlGroupOptions)[]
}




export class MysqlEntity {
  static getTableName() {
    return this.name
  }

  static getPrimaryKey(): string | null {
    return null
  }

  static getColumns() {
    return [] as MysqlEntityParameter[]
  }

  static getAssociations() {
    return [] as MysqlEntityAssociation[]
  }

  static DefineSchema(table: string, columns: {[column:string]: MysqlEntityColumn | MysqlDataType}) {
    this.getTableName = () => {
      return table
    }
    
    let primaryKey: string
    let parameters: MysqlEntityParameter[] = []
    for (let column of Object.keys(columns)) {
      if ((columns[column] as MysqlDataType) in MysqlDataType) {
        let data = columns[column] as MysqlDataType
        parameters.push({
          name: column,
          type: data,
          default: undefined,
          required: false,
          primaryKey: false,
          columnName: column,
          validators: [],
          unique: false
        })
      } else {
        let data = columns[column] as MysqlEntityColumn
        let parameter: MysqlEntityParameter = {
          name: column,
          type: data.type,
          default: data.default,
          required: data.required === true,
          primaryKey: data.primaryKey === true,
          columnName: data.columnName || column,
          unique: data.unique === true,
          validators: []
        }
        if (data.primaryKey === true) {
          primaryKey = column
        }
        let validators = []
        if ([MysqlDataType.TINYINT, MysqlDataType.SMALLINT, MysqlDataType.MEDIUMINT, MysqlDataType.INT, MysqlDataType.BIGINT, MysqlDataType.DECIMAL].indexOf(data.type) >= 0) {
          // type
          let t = (value) => {
            if (typeof value === "number" || value === null || value === undefined) {
              return {success: true}
            } else {
              return {success: false, message: MysqlValidationError.INVALID_TYPE}
            }
          }
          validators.push(t)
  
          // required
          if (data.required === true) {
            let r = (value) => {
              if (value === null || value === undefined) {
                return {success: false, message: MysqlValidationError.REQUIRED}
              } else {
                return {success: true}
              }
            }
            validators.push(r)
          }
  
          // min
          if ((data as MysqlEntityNumberColumn).min != null) {
            let m = (value) => {
              if (typeof value === "number" && value >= (data as MysqlEntityNumberColumn).min) {
                return {success: true}
              } else {
                return {success: false, message: MysqlValidationError.MIN_VALUE}
              }
            }
            validators.push(m)
          }
  
          // max
          if ((data as MysqlEntityNumberColumn).max != null) {
            let m = (value) => {
              if (typeof value === "number" && value <= (data as MysqlEntityNumberColumn).max) {
                return {success: true}
              } else {
                return {success: false, message: MysqlValidationError.MAX_VALUE}
              }
            }
            validators.push(m)
          }
        } else if ([MysqlDataType.VARCHAR, MysqlDataType.TEXT, MysqlDataType.LONGTEXT].indexOf(data.type) >= 0) {
          // type
          let t = (value) => {
            if (StringUtils.isNotEmpty(value) || value === null || value === undefined) {
              return {success: true}
            } else {
              return {success: false, message: MysqlValidationError.INVALID_TYPE}
            }
          }
          validators.push(t)
  
          // required
          if (data.required === true) {
            let r = (value) => {
              if (!StringUtils.isNotBlank(value) || value === null || value === undefined) {
                return {success: false, message: MysqlValidationError.REQUIRED}
              } else {
                return {success: true}
              }
            }
            validators.push(r)
          }
  
          // min
          if ((data as MysqlEntityStringColumn).minLen != null) {
            let m = (value) => {
              if (StringUtils.length(value) >= (data as MysqlEntityStringColumn).minLen) {
                return {success: true}
              } else {
                return {success: false, message: MysqlValidationError.MIN_LENGTH}
              }
            }
            validators.push(m)
          }
  
          // max
          if ((data as MysqlEntityStringColumn).maxLen != null) {
            let m = (value) => {
              if (StringUtils.length(value) <= (data as MysqlEntityStringColumn).maxLen) {
                return {success: true}
              } else {
                return {success: false, message: MysqlValidationError.MIN_LENGTH}
              }
            }
            validators.push(m)
          }
        } else if (data.type == MysqlDataType.BOOLEAN) {
          // type
          let t = (value) => {
            if (typeof value == "boolean" || value === null || value === undefined) {
              return {success: true}
            } else {
              return {success: false, message: MysqlValidationError.INVALID_TYPE}
            }
          }
          validators.push(t)
  
          // required
          if (data.required === true) {
            let r = (value) => {
              if (value === true || value === false) {
                return {success: true}
              } else {
                return {success: false, message: MysqlValidationError.REQUIRED}
              }
            }
            validators.push(r)
          }
        } else if (data.type == MysqlDataType.DATE || data.type == MysqlDataType.DATETIME) {
          // type
          let t = (value) => {
            if (DateUtils.isValid(value) || value === null || value === undefined) {
              return {success: true}
            } else {
              return {success: false, message: MysqlValidationError.INVALID_TYPE}
            }
          }
          validators.push(t)
  
          // required
          if (data.required === true) {
            let r = (value) => {
              if (value === null || value === undefined) {
                return {success: false, message: MysqlValidationError.REQUIRED}
              } else {
                return {success: true}
              }
            }
            validators.push(r)
          }
        }
        parameter.validators = validators
        parameters.push(parameter)
      }
    }

    if (primaryKey != null) {
      this.getPrimaryKey = () => {
        return primaryKey
      }
    }

    this.getColumns = () => {
      return parameters
    }

    return this
  }

  constructor(data?: any, options?: MysqlEntityOptions) {
    let opts = options || {readColumn: false}
    let columns = (this.constructor as any).getColumns()

    if (data != null) {
      for (let column of columns) {
        (this as any)[column.name] = data[opts.readColumn ? column.columnName : column.name]

        if (column.type == MysqlDataType.DATE || column.type == MysqlDataType.DATETIME) {
          if ((this as any)[column.name] !== null && (this as any)[column.name] !== undefined) {
            (this as any)[column.name] = new Date((this as any)[column.name])
          } else {
            if (typeof column.default == "function") {
              (this as any)[column.name] = column.default()
            } else if (column.default == MysqlDefaultValues.DATENOW) {
              (this as any)[column.name] = new Date()
            } else {
              (this as any)[column.name] = column.default
            }
          }
        } else if (column.type == MysqlDataType.BOOLEAN) {
          if ((this as any)[column.name] !== null && (this as any)[column.name] !== undefined) {
            if (typeof (this as any)[column.name] == "number") {
              (this as any)[column.name] = (this as any)[column.name] === 1
            }
          } else {
             if (typeof column.default == "function") {
              (this as any)[column.name] = column.default()
            } else {
              (this as any)[column.name] = column.default
            }
          }
        } else if ([MysqlDataType.TINYINT, MysqlDataType.SMALLINT, MysqlDataType.MEDIUMINT, MysqlDataType.INT, MysqlDataType.BIGINT, MysqlDataType.DECIMAL].indexOf(data.type) >= 0) {
          if ((this as any)[column.name] === null || (this as any)[column.name] === undefined) {
            if (typeof column.default == "function") {
              (this as any)[column.name] = column.default()
            } else {
              (this as any)[column.name] = column.default
            }
          }
        } else if ([MysqlDataType.VARCHAR, MysqlDataType.TEXT, MysqlDataType.LONGTEXT].indexOf(data.type) >= 0) {
          if ((this as any)[column.name] === null || (this as any)[column.name] === undefined) {
            if (typeof column.default == "function") {
              (this as any)[column.name] = column.default()
            } else if (column.default == MysqlDefaultValues.UUIDV1) {
              (this as any)[column.name] = v1()
            } else if (column.default == MysqlDefaultValues.UUIDV4) {
              (this as any)[column.name] = v4()
            } else {
              (this as any)[column.name] = column.default
            }
          }
        }
      }
    }
  }

  static hasOne(entity: typeof MysqlEntity, foreignKey: string, custom?: string) {
    let table = entity.getTableName()
    let name = table.charAt(0).toLowerCase() + table.slice(1)
    let association: MysqlEntityAssociation = {
      type: MysqlAssociationType.HAS_ONE,
      entity,
      entityName: custom || name,
      foreignKey
    }
    let current = this.getAssociations()
    current.push(association)
    this.getAssociations = () => { return current }
  }

  static hasMany(entity: typeof MysqlEntity, foreignKey: string, custom?: string) {
    let table = entity.getTableName()
    let name = table.charAt(0).toLowerCase() + table.slice(1)
    let association: MysqlEntityAssociation = {
      type: MysqlAssociationType.HAS_MANY,
      entity,
      entityName: custom || name,
      foreignKey
    }
    let current = this.getAssociations()
    current.push(association)
    this.getAssociations = () => { return current }
  }

  static belongsTo(entity: typeof MysqlEntity, foreignKey: string, custom?: string) {
    let table = entity.getTableName()
    let name = table.charAt(0).toLowerCase() + table.slice(1)
    let association: MysqlEntityAssociation = {
      type: MysqlAssociationType.BELONGS_TO,
      entity,
      entityName: custom || name,
      foreignKey: foreignKey
    }
    let current = this.getAssociations()
    current.push(association)
    this.getAssociations = () => { return current }
  }

  static belongsToMany(entity: typeof MysqlEntity, through: typeof MysqlEntity, foreignKey: string, custom?: string) {
    let table = entity.getTableName()
    let name = table.charAt(0).toLowerCase() + table.slice(1)
    let association: MysqlEntityAssociation = {
      type: MysqlAssociationType.BELONGS_TO,
      entity,
      entityName: custom || name,
      foreignKey: foreignKey,
      through
    }
    let current = this.getAssociations()
    current.push(association)
    this.getAssociations = () => { return current }
  }

  async populate(db: MysqlConnector) {
    let associations = (this.constructor as any).getAssociations()
    let pk = (this.constructor as any).getPrimaryKey() || "id"
  
    for await (let association of associations) {
      let w: any = {}
      if (association.type == MysqlAssociationType.HAS_MANY || association.type == MysqlAssociationType.HAS_ONE) {
        w[association.foreignKey] = this[pk]
        if (association.type == MysqlAssociationType.HAS_ONE) {
          let entity = await association.entity.FindOne(db, w)
          this[association.entityName] = entity
        } else {
          let entity = await association.entity.Find(db, w)
          this[association.entityName] = entity
        }
      } else if (association.type == MysqlAssociationType.BELONGS_TO) {
        let remotePk = association.entity.getPrimaryKey() || "id"
        w[remotePk] = this[association.foreignKey]
        let entity = await association.entity.FindOne(db, w)
        this[association.entityName] = entity
      } else {
        // TODO: handle many to many
        
      }
    }
  }

  async insert(db: MysqlConnector, options?: MysqlEntityInsert) {
    let errors = await this.validate(db, {insert: true})
    if (Object.keys(errors).length > 0) {
      throw new MysqlEntityValidationError("Some errors were found in the entity", errors)
    }

    let loptions = options || {}

    let columns = (this.constructor as any).getColumns()
    let table = loptions.rewriteTable != null ? loptions.rewriteTable : (this.constructor as any).getTableName()
    let ins: MysqlQuery = {sql: "", params: []}
    ins.sql = `INSERT INTO \`${table}\` (`
    let qparams = `VALUES (`
    let isFirst = true
    let pk: MysqlEntityParameter
    for (let column of columns) {
      if (column.primaryKey) {
        pk = column
        continue
      }

      if (isFirst) {
        isFirst = false
      } else {
        ins.sql += ", "
        qparams += ", "
      }
      ins.sql += `\`${column.columnName}\``
      qparams += "?"
      ins.params.push(this[column.name])
    }
    ins.sql += `) ${qparams});`

    if (db == null) {
      return ins
    } else {
      let result = await db.run(ins)
      this[pk.name] = result.result.insertId
      return result.result.insertId
    }
  }

  async update(db: MysqlConnector, options?: MysqlEntityUpdate) {
    let errors = await this.validate(db)
    if (Object.keys(errors).length > 0) {
      throw new MysqlEntityValidationError("Some errors were found in the entity", errors)
    }

    let loptions = options || {}

    let columns = (this.constructor as any).getColumns()
    let table = loptions.rewriteTable != null ? loptions.rewriteTable : (this.constructor as any).getTableName()
    let upt: MysqlQuery = {sql: "", params: []}
    upt.sql = `UPDATE \`${table}\` SET `
    let isFirst = true
    let pk: MysqlEntityParameter
    for (let column of columns) {
      if (column.primaryKey) {
        pk = column
        continue
      }

      if (isFirst) {
        isFirst = false
      } else {
        upt.sql += ", "
      }
      upt.sql += `\`${column.columnName}\` = ?`
      upt.params.push(this[column.name])
    }
    upt.sql += ` WHERE \`${pk.columnName}\` = ?;`
    upt.params.push(this[pk.name])

    if (db == null) {
      return upt
    } else {
      let result = await db.run(upt)
      return result.result.changedRows
    }
  }

  async remove(db: MysqlConnector, options?: MysqlEntityRemove) {
    let loptions = options || {}

    let columns = (this.constructor as any).getColumns()
    let table = loptions.rewriteTable != null ? loptions.rewriteTable : (this.constructor as any).getTableName()
    let rmv: MysqlQuery = {sql: "", params: []}
    rmv.sql = `DELETE FROM \`${table}\` WHERE `
    let pk: MysqlEntityParameter
    for (let column of columns) {
      if (column.primaryKey) {
        pk = column
        break
      }
    }
    
    if (pk != null && this[pk.name] != null) {
      rmv.sql += `\`${pk.columnName}\` = ?;`
      rmv.params.push(this[pk.name])
    } else {
      let err = {}
      err[pk.name] = MysqlValidationError.REQUIRED
      throw new MysqlEntityValidationError("No PK was found or it is null", err)
    }

    if (db == null) {
      return rmv
    } else {
      let result = await db.run(rmv)
      return result.result.affectedRows
    }
  }

  async validate(db: MysqlConnector, options: {insert: boolean} = {insert: false}) {
    let columns = (this.constructor as any).getColumns()
    let errors: any = {}
    for await (let column of columns) {
      for (let validation of column.validators) {
        let result = validation(this[column.name])
        if (result === true || (result as MysqlParameterValidation).success == true) {
          // OK
        } else if (result === false) {
          errors[column.name] = MysqlValidationError.INVALID_VALUE
          break
        } else if ((result as MysqlParameterValidation).success == false) {
          errors[column.name] = (result as MysqlParameterValidation).message || MysqlValidationError.INVALID_VALUE
          break
        }
      }
      if (errors[column.name] == null && column.unique === true) {
        // TODO
      } else if (errors[column.name] == MysqlValidationError.REQUIRED && column.primaryKey == true && options.insert) {
        // skip
        delete errors[column.name]
      }
    }
    return errors
  }

  static async Find(db: MysqlConnector, where?: MysqlWhereOptions, options?: MysqlEntityFindOptions): Promise<any[]> {
    let wh = where || {}
    let opt = options || {}
    let find: MysqlQuery = {sql: "", params: []}
    let table = this.getTableName()  
    let pk = this.getPrimaryKey()
    let relations = this.getAssociations()

    let select: MysqlQuery = {sql: "", params: []}
    select = qselect(opt.select || [])
    find.sql += `${select.sql} FROM \`${table}\``
    find.params.push(...select.params)

    let joins: MysqlEntityAssociation[] = []
    if (opt.populate != null && opt.populate.length) {
      for (let populate of opt.populate) {
        let exist = relations.find(r => r.entity.getTableName() == populate.getTableName())
        if (exist) {
          joins.push(exist)
        } else {
          throw new MysqlCoreError(`The entity "${populate.getTableName()}" is not defined in the associations of this entity "${table}".`)
        }
      }
    }
    let joinquery: MysqlQuery = {sql: "", params: []}
    if (joins.length) {
      for (let join of joins) {
        if (join.type == MysqlAssociationType.BELONGS_TO) {
          joinquery.sql += ` INNER JOIN \`${join.entityName}\` ON \`${table}\`.\`${join.foreignKey}\` = \`${join.entityName}\`.\`${join.entity.getPrimaryKey() || "id"}\``
        } else if (join.type == MysqlAssociationType.HAS_MANY || join.type == MysqlAssociationType.HAS_ONE) {
          joinquery.sql += ` INNER JOIN \`${join.entityName}\` ON \`${table}\`.\`${this.getPrimaryKey()}\` = \`${join.entityName}\`.\`${join.foreignKey}\``
        } else if (join.type == MysqlAssociationType.BELONGS_TO_MANY) {
          let mjoin = join.through.getAssociations()
          let base: MysqlEntityAssociation
          let target: MysqlEntityAssociation
          for (let m of mjoin) {
            if (m.entity.getTableName() == table && m.type == MysqlAssociationType.HAS_MANY) {
              base = m
            } else if (m.entity.getTableName() == join.entity.getTableName() && m.type == MysqlAssociationType.HAS_MANY) {
              target = m
            }
          }
          if (base == null || target == null) {
            throw new MysqlCoreError(`The entity "${join.entity.getTableName()}" is not defined in the associations of this entity "${table}".`)
          }
          joinquery.sql += ` INNER JOIN \`${join.through.getTableName()}\` ON \`${table}\`.\`${pk}\` = \`${join.through.getTableName()}\`.\`${base.foreignKey}\``
          joinquery.sql += ` INNER JOIN \`${join.entity.getTableName()}\` ON \`${join.through.getTableName()}\`.\`${target.foreignKey}\` = \`${join.entity.getTableName()}\`.\`${target.entity.getPrimaryKey()}\``
        }
      }
    }
    find.sql += joinquery.sql
    find.params.push(...joinquery.params)

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
      let list = []
      let holder: any[] = []
      let jlen = joins.length + 1
      for (let result of data.result) {
        if (joins.length) {
          
          // set row items
          let pos = 0
          let row: MysqlEntity[] = []
          let d = result[table]
          if (d != null) {
            row.push(new this(d, {readColumn: true}))
          } else {
            row.push(null)
          }
          for (let join of joins) {
            let data = result[join.entity.getTableName()]
            if (data != null) {
              row.push(new join.entity(data, {readColumn: true}))
            } else {
              row.push(null)
            }
          }

          // compare holder
          if (pos < holder.length) {
            for (let x = 0; x < jlen; x++) {
              if (entitiesMatch(row[x],holder[x])) {
                pos++
              } else {
                break
              }
            }
          }
          // clean holder (and set cumulative to previous)
          if (pos < holder.length) {
            let current = pos + 0
            if (current < jlen) {
              for (let x = jlen - 1; x >= pos; x--) {
                if (x == 0) {
                  let h = holder[x]
                  list.push(h)
                } else {
                  let j = joins[x-1]
                  let h = holder[0]
                  if (j.type == MysqlAssociationType.HAS_ONE || j.type == MysqlAssociationType.BELONGS_TO) {
                    if (h != null) {
                      h[j.entityName] = holder[x]
                      holder[0] = h
                      holder[x] = null
                    }
                  } else if (j.type == MysqlAssociationType.HAS_MANY || j.type == MysqlAssociationType.BELONGS_TO_MANY) {
                    if (h != null) {
                      if (h[j.entityName] == null) h[j.entityName] = []
                      h[j.entityName].push(holder[x])
                      holder[0] = h
                      holder[x] = null
                    }
                  }
                }
              }
            }
          }
          // set holder (with result data)
          if (pos >= 0 && pos < jlen) {
            for (let x = pos; x < jlen; x++) {
              holder[x] = row[x]
            }
          }
        } else {
          let base = new this(result[table], {readColumn: true})
          list.push(base)
        }
      }
      // clean last time
      if (holder[0] != null) {
        if (holder.length) {
          for (let x = jlen - 1; x >= 0; x--) {
            if (x == 0) {
              let h = holder[x]
              list.push(h)
            } else {
              let j = joins[x-1]
              let h = holder[0]
              if (j.type == MysqlAssociationType.HAS_ONE || j.type == MysqlAssociationType.BELONGS_TO) {
                if (h != null) {
                  h[j.entityName] = holder[x]
                  holder[0] = h
                  holder[x] = null
                }
              } else if (j.type == MysqlAssociationType.HAS_MANY || j.type == MysqlAssociationType.BELONGS_TO_MANY) {
                if (h != null) {
                  if (h[j.entityName] == null) h[j.entityName] = []
                  h[j.entityName].push(holder[x])
                  holder[0] = h
                  holder[x] = null
                }
              }
            }
          }
        }
      }
      return list
    }

    /*let join: MysqlEntityAssociation
    if (opt.populate != null) {
      let exist = relations.find(r => r.entity.getTableName() == opt.populate.getTableName())
      if (exist) {
        join = exist
      } else {
        throw new MysqlCoreError(`The entity "${opt.populate.getTableName()}" is not defined in the associations of this entity "${table}".`)
      }
    }
    let jselect: MysqlQuery = {sql: "", params: []}
    let joinquery: MysqlQuery = {sql: "", params: []}
    if (join != null) {
      let jcolumns = join.entity.getColumns()
      for (let column of jcolumns) {
        jselect.sql += `, \`${join.entityName}\`.\`${column.columnName}\``
      }
      if (join.type == MysqlAssociationType.BELONGS_TO) {
        joinquery.sql += ` INNER JOIN \`${join.entityName}\` ON \`${table}\`.\`${join.foreignKey}\` = \`${join.entityName}\`.\`${join.entity.getPrimaryKey() || "id"}\``
      } else if (join.type == MysqlAssociationType.HAS_MANY || join.type == MysqlAssociationType.HAS_ONE) {
        joinquery.sql += ` INNER JOIN \`${join.entityName}\` ON \`${table}\`.\`${this.getPrimaryKey()}\` = \`${join.entityName}\`.\`${join.foreignKey}\``
      } else {
        // TODO: handle many to many
      }
    }

    let select: MysqlQuery = {sql: "", params: []}
    if (opt.select == null || opt.select.length == 0) {
      let isFirst = true
      let pretable = join != null ? `\`${table}\`.` : "" // if join add table name
      for (let column of columns) {
        if (isFirst) {
          select.sql += "SELECT "
          isFirst = false
        } else {
          select.sql += ", "
        }
        select.sql += `${pretable}\`${column.columnName}\``
      }
    } else {
      select = qselect(opt.select || [])
    }
    find.sql += `${select.sql}${jselect.sql} FROM \`${table}\`${joinquery.sql}`
    find.params.push(...select.params)

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
      let list = []
      let holder: MysqlEntity
      let subholder: MysqlEntity[] = []
      for (let result of data.result) {
        if (join != null) {
          if (holder != null) {
            if (holder[pk] != result[table][pk]) {
              if (join.type == MysqlAssociationType.BELONGS_TO || join.type == MysqlAssociationType.HAS_ONE) {
                holder[join.entityName] = subholder[0] != null ? new join.entity(subholder[0]) : undefined
                subholder = []
                list.push(holder)
                holder = null
              } else if (join.type == MysqlAssociationType.HAS_MANY) {
                holder[join.entityName] = [...subholder]
                subholder = []
                list.push(holder)
                holder = null
              } else {
                // TODO: Handle many to many
              }
            } else {
              if (result[join.entityName] != null) {
                let sub = new join.entity(result[join.entityName], {readColumn: true})
                subholder.push(sub)
              }
            }
          }

          if (holder == null) {
            holder = new this(result[table], {readColumn: true})
            if (result[join.entityName] != null) {
              let sub = new join.entity(result[join.entityName], {readColumn: true})
              subholder.push(sub)
            }
          }
        } else {
          let entity = new this(result[table], {readColumn: true})
          list.push(entity)
        }
      }
      if (join != null) {
        if (join.type == MysqlAssociationType.BELONGS_TO || join.type == MysqlAssociationType.HAS_ONE) {
          holder[join.entityName] = subholder[0] != null ? new join.entity(subholder[0]) : undefined
          subholder = []
          list.push(holder)
          holder = null
        } else if (join.type == MysqlAssociationType.HAS_MANY) {
          holder[join.entityName] = [...subholder]
          subholder = []
          list.push(holder)
          holder = null
        } else {
          // TODO: Handle many to many
        }
      }
      return list
    }*/
  }

  static async FindOne(db: MysqlConnector, where?: MysqlWhereOptions, options?: MysqlEntityFindOneOptions): Promise<any> {
    let wh = where || {}
    let opt = options || {}
    let find: MysqlQuery = {sql: "", params: []}
    let table = this.getTableName()
    let pk = this.getPrimaryKey()
    let relations = this.getAssociations()

    let select: MysqlQuery = {sql: "", params: []}
    select = qselect(opt.select || [])
    find.sql += `${select.sql} FROM \`${table}\``
    find.params.push(...select.params)

    let joins: MysqlEntityAssociation[] = []
    if (opt.populate != null && opt.populate.length) {
      for (let populate of opt.populate) {
        let exist = relations.find(r => r.entity.getTableName() == populate.getTableName())
        if (exist) {
          joins.push(exist)
        } else {
          throw new MysqlCoreError(`The entity "${populate.getTableName()}" is not defined in the associations of this entity "${table}".`)
        }
      }
    }
    let joinquery: MysqlQuery = {sql: "", params: []}
    if (joins.length) {
      for (let join of joins) {
        if (join.type == MysqlAssociationType.BELONGS_TO) {
          joinquery.sql += ` INNER JOIN \`${join.entityName}\` ON \`${table}\`.\`${join.foreignKey}\` = \`${join.entityName}\`.\`${join.entity.getPrimaryKey() || "id"}\``
        } else if (join.type == MysqlAssociationType.HAS_MANY || join.type == MysqlAssociationType.HAS_ONE) {
          joinquery.sql += ` INNER JOIN \`${join.entityName}\` ON \`${table}\`.\`${this.getPrimaryKey()}\` = \`${join.entityName}\`.\`${join.foreignKey}\``
        } else if (join.type == MysqlAssociationType.BELONGS_TO_MANY) {
          let mjoin = join.through.getAssociations()
          let base: MysqlEntityAssociation
          let target: MysqlEntityAssociation
          for (let m of mjoin) {
            if (m.entity.getTableName() == table && m.type == MysqlAssociationType.HAS_MANY) {
              base = m
            } else if (m.entity.getTableName() == join.entity.getTableName() && m.type == MysqlAssociationType.HAS_MANY) {
              target = m
            }
          }
          if (base == null || target == null) {
            throw new MysqlCoreError(`The entity "${join.entity.getTableName()}" is not defined in the associations of this entity "${table}".`)
          }
          joinquery.sql += ` INNER JOIN \`${join.through.getTableName()}\` ON \`${table}\`.\`${pk}\` = \`${join.through.getTableName()}\`.\`${base.foreignKey}\``
          joinquery.sql += ` INNER JOIN \`${join.entity.getTableName()}\` ON \`${join.through.getTableName()}\`.\`${target.foreignKey}\` = \`${join.entity.getTableName()}\`.\`${target.entity.getPrimaryKey()}\``
        }
      }
    }
    find.sql += joinquery.sql
    find.params.push(...joinquery.params)

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
      let list = []
      let holder: any[] = []
      let jlen = joins.length + 1
      for (let result of data.result) {
        if (joins.length) {
          
          // set row items
          let pos = 0
          let row: MysqlEntity[] = []
          let d = result[table]
          if (d != null) {
            row.push(new this(d, {readColumn: true}))
          } else {
            row.push(null)
          }
          for (let join of joins) {
            let data = result[join.entity.getTableName()]
            if (data != null) {
              row.push(new join.entity(data, {readColumn: true}))
            } else {
              row.push(null)
            }
          }

          // compare holder
          if (pos < holder.length) {
            for (let x = 0; x < jlen; x++) {
              if (entitiesMatch(row[x],holder[x])) {
                pos++
              } else {
                break
              }
            }
          }
          // clean holder (and set cumulative to previous)
          if (pos < holder.length) {
            let current = pos + 0
            if (current < jlen) {
              for (let x = jlen - 1; x >= pos; x--) {
                if (x == 0) {
                  let h = holder[x]
                  list.push(h)
                } else {
                  let j = joins[x-1]
                  let h = holder[0]
                  if (j.type == MysqlAssociationType.HAS_ONE || j.type == MysqlAssociationType.BELONGS_TO) {
                    if (h != null) {
                      h[j.entityName] = holder[x]
                      holder[0] = h
                      holder[x] = null
                    }
                  } else if (j.type == MysqlAssociationType.HAS_MANY || j.type == MysqlAssociationType.BELONGS_TO_MANY) {
                    if (h != null) {
                      if (h[j.entityName] == null) h[j.entityName] = []
                      h[j.entityName].push(holder[x])
                      holder[0] = h
                      holder[x] = null
                    }
                  }
                }
              }
            }
          }
          // set holder (with result data)
          if (pos >= 0 && pos < jlen) {
            for (let x = pos; x < jlen; x++) {
              holder[x] = row[x]
            }
          }
        } else {
          let base = new this(result[table], {readColumn: true})
          list.push(base)
        }
      }
      // clean last time
      if (holder[0] != null) {
        if (holder.length) {
          for (let x = jlen - 1; x >= 0; x--) {
            if (x == 0) {
              let h = holder[x]
              list.push(h)
            } else {
              let j = joins[x-1]
              let h = holder[0]
              if (j.type == MysqlAssociationType.HAS_ONE || j.type == MysqlAssociationType.BELONGS_TO) {
                if (h != null) {
                  h[j.entityName] = holder[x]
                  holder[0] = h
                  holder[x] = null
                }
              } else if (j.type == MysqlAssociationType.HAS_MANY || j.type == MysqlAssociationType.BELONGS_TO_MANY) {
                if (h != null) {
                  if (h[j.entityName] == null) h[j.entityName] = []
                  h[j.entityName].push(holder[x])
                  holder[0] = h
                  holder[x] = null
                }
              }
            }
          }
        }
      }
      // send data
      if (list.length) {
        return list[0]
      } else {
        return null
      }
    }
  }

  static async Count(db: MysqlConnector, where?: MysqlWhereOptions, options?: MysqlEntityCountOptions): Promise<number> {
    let wh = where || {}
    let opt = options || {}
    let columns = this.getColumns() as MysqlEntityParameter[]
    
    let find: MysqlQuery = {sql: "", params: []}
    let table = this.getTableName()

    let pk = this.getPrimaryKey()
    if (opt.countBy != null) {
      pk = opt.countBy
    } else {
      let pkC = columns.find(c => c.name == pk)
      if (pkC != null) {
        pk = pkC.columnName
      }
    }

    let select = qselect([{column: pk, as: "total", operator: MysqlOperator.COUNT}])
    find.sql += `${select.sql} FROM \`${table}\``
    find.params.push(...select.params)

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
}