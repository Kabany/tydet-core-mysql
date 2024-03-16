import { MysqlCoreError } from "./mysql.error"
import { MysqlQuery } from "./mysql.service"


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