import { StringUtils, DateUtils } from "tydet-utils"
import { v1, v4 } from "uuid"
import { MysqlEntityValidationError } from "./mysql.error"
import { MysqlConnector, MysqlQuery } from "./mysql.service"


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

interface MysqlEntityParameter {
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

export class MysqlEntity {
  static getTableName() {
    return this.name
  }

  static getPrimaryKey() {
    return null
  }

  static getColumns() {
    return []
  }

  static DefineSchema(table: string, columns: {[column:string]: MysqlEntityColumn | MysqlDataType}, associations?: any[]) {
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

  async insert(db: MysqlConnector) {
    let errors = await this.validate(db, true)
    if (Object.keys(errors).length > 0) {
      throw new MysqlEntityValidationError("Some errors were found in the entity", errors)
    }

    let columns = (this.constructor as any).getColumns()
    let table = (this.constructor as any).getTableName()
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

  async update(db: MysqlConnector) {
    let errors = await this.validate(db)
    if (Object.keys(errors).length > 0) {
      throw new MysqlEntityValidationError("Some errors were found in the entity", errors)
    }

    let columns = (this.constructor as any).getColumns()
    let table = (this.constructor as any).getTableName()
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

  async remove(db: MysqlConnector) {
    let columns = (this.constructor as any).getColumns()
    let table = (this.constructor as any).getTableName()
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

  async validate(db: MysqlConnector, insert: boolean = false) {
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
      } else if (errors[column.name] == MysqlValidationError.REQUIRED && column.primaryKey == true && insert) {
        // skip
        delete errors[column.name]
      }
    }
    return errors
  }
}








/*
export enum MysqlValidationError {
  REQUIRED = "REQUIRED",
  INVALID_TYPE = "INVALID_TYPE",
  INVALID_VALUE = "INVALID_VALUE",
  MIN_LENGTH = "MIN_LENGTH",
  MAX_LENGTH = "MAX_LENGTH",
  MIN_VALUE = "MIN_VALUE",
  MAX_VALUE = "MAX_VALUE",
  DUPLICATED = "DUPLICATED"
}

export enum MysqlDataType {
  STRING = "STRING",
  TEXT = "TEXT",
  LONGTEXT = "LONGTEXT",
  INTEGER = "INTEGER",
  BIGINT = "BIGINT",
  DECIMAL = "DECIMAL",
  DATE = "DATE",
  DATETIME = "DATETIME",
  TIME = "TIME",
  BOOLEAN = "BOOLEAN"
}

interface MysqlSchemaColumn {
  name: string
  type: MysqlDataType
  size?: number
  default?: any
  primaryKey: boolean
  autoIncrement: boolean
  nullable: boolean
}

interface MysqlColumnDefinition {
  name: string
  column?: string
  type: MysqlDataType
  nullable: boolean
  default?: any
}

interface MysqlColumnStringDefinition extends MysqlColumnDefinition {
  type: MysqlDataType.STRING | MysqlDataType.TEXT | MysqlDataType.LONGTEXT
  default?: string
  size?: number
  primaryKey?: boolean
  unique?: boolean
  minLength?: number
  maxLength?: number
  validation?: (data: string) => boolean
}

interface MysqlColumnIntegerDefinition extends MysqlColumnDefinition {
  type: MysqlDataType.INTEGER | MysqlDataType.BIGINT
  default?: number
  size?: number
  primaryKey?: boolean
  autoIncrement?: boolean
  min?: number
  max?: number
  validation?: (data: string) => boolean
}

/

enum MysqlDataValidationError {

}



enum MysqlRelation {
  BELONGS_TO_MANY = "BELONGS_TO_MANY",
  BELONGS_TO = "BELONGS_TO",
  HAS_MANY = "HAS_MANY",
  HAS_ONE = "HAS_ONE"
}

interface MysqlEntityRelationDefinition {
  type: MysqlRelation

}

class MysqlEntityDefinition {
  table: string
  tableAlias?: string
  columns: MysqlEntityColumnDefinition[]
  relations: []
} *



export class MysqlEntity {
  // Schema helpers
  static getTableName() {
    return this.name
  }
  /static getSchemaDefinition(): MysqlEntityColumn[] {
    throw new MysqlCoreError(`Need to define the Entity's schema for the class ${this.name}.`)
  }
  static getPrimaryKey(): MysqlEntityColumn {
    throw new MysqlCoreError(`Need to define the Entity's schema for the class ${this.name}.`)
  }
  static getValidators() {}
  static getRelations() {}/
  
  // Schema definitions
  static DefineSchema(table: string, columns: (MysqlColumnStringDefinition | MysqlColumnIntegerDefinition)[]) {
    // table
    this.getTableName = () => {return table}

    // schema
    let shema: MysqlSchemaColumn[] = []
    let primaryKey: MysqlSchemaColumn

    // validators
    let validators: {name: string, validations: {validator: (data: any) => boolean, type: MysqlValidationError}[]}

    // setters

    // columns
    let cNames: string[] = []
    let mNames: string[] = []

    for (let column of columns) {
      let currentColumn: MysqlSchemaColumn

      if (mNames.indexOf(column.name) > -1) {
        throw new MysqlCoreError(`Duplicated variable name: ${column.name}`)
      } else if ((column.column != null && cNames.indexOf(column.column) > -1) || (column.column == null && cNames.indexOf(column.name) > -1)) {
        throw new MysqlCoreError(`Duplicated column name: ${column.column != null ? column.column : column.name}`)
      }
      mNames.push(column.name)
      column.column != null ? cNames.push(column.column) : cNames.push(column.name)

      // types
      if (column.type == MysqlDataType.STRING || column.type == MysqlDataType.TEXT || column.type == MysqlDataType.LONGTEXT) {
        let c = column as MysqlColumnStringDefinition
        currentColumn = {
          name: c.column != null ? c.column : c.name,
          type: c.type,
          size: c.size,
          default: c.default,
          primaryKey: c.primaryKey === true,
          autoIncrement: false,
          nullable: c.nullable === true
        }
        shema.push(currentColumn)

        // PK
        if (c.primaryKey === true) {
          primaryKey = currentColumn
        }

        // validations
        let v: {validator: (data: any) => boolean, type: MysqlValidationError}[] = []
        v.push({type: MysqlValidationError.INVALID_TYPE, validator: (data: any) => {
          return typeof data == "string" || data === undefined || data === null
        }})
        if (c.nullable === false) {
          v.push({type: MysqlValidationError.REQUIRED, validator: (data: string) => {
            return data !== undefined && data !== null
          }})
        }
        if (c.minLength !== undefined) {
          v.push({type: MysqlValidationError.MIN_LENGTH, validator: (data: string) => {
            return data.length >= c.minLength
          }})
        }
        if (c.maxLength !== undefined) {
          v.push({type: MysqlValidationError.MAX_LENGTH, validator: (data: string) => {
            return data.length <= c.maxLength
          }})
        }
        //if (c.unique === true) {
        //  v.push({type: MysqlValidationError.DUPLICATED, validator: (data: string) => {
        //    return data.length <= c.maxLength
        //  }})
        //}
        if (c.validation != null) {
          v.push({type: MysqlValidationError.INVALID_VALUE, validator: c.validation})
        }

        validators[column.name] = v

      } else if (column.type == MysqlDataType.INTEGER || column.type == MysqlDataType.BIGINT) {
        let c = column as MysqlColumnIntegerDefinition
        currentColumn = {
          name: c.column != null ? c.column : c.name,
          type: c.type,
          size: c.size,
          default: c.default,
          primaryKey: c.primaryKey === true,
          autoIncrement: c.autoIncrement === true,
          nullable: c.nullable === true
        }
        shema.push(currentColumn)

        if (c.primaryKey === true) {
          primaryKey = currentColumn
        }

        // validations
        let v: {validator: (data: any) => boolean, type: MysqlValidationError}[] = []
        v.push({type: MysqlValidationError.INVALID_TYPE, validator: (data: any) => {
          return typeof data == "number" || data === undefined || data === null
        }})
        if (c.nullable === false) {
          v.push({type: MysqlValidationError.REQUIRED, validator: (data: string) => {
            return data !== undefined && data !== null
          }})
        }
        if (c.min !== undefined) {
          v.push({type: MysqlValidationError.MIN_VALUE, validator: (data: string) => {
            return data.length >= c.min
          }})
        }
        if (c.max !== undefined) {
          v.push({type: MysqlValidationError.MAX_VALUE, validator: (data: string) => {
            return data.length <= c.max
          }})
        }
        //if (c.unique === true) {
        //  v.push({type: MysqlValidationError.DUPLICATED, validator: (data: string) => {
        //    return data.length <= c.maxLength
        //  }})
        //}
        if (c.validation != null) {
          v.push({type: MysqlValidationError.INVALID_VALUE, validator: c.validation})
        }

        validators[column.name] = v
        
      }
    }
  }

  // CRUD class
  static Find() {}
  static FindOne() {}
  static Count() {}
  static UpdateAll() {}
  static RemoveAll() {}

  // CRUD instance
  insert() {}
  update() {}
  remove() {}
}

*/