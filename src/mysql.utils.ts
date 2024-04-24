import { isEqual } from "tydet-utils/dist/compare.utils";
import { MysqlEntity } from "./mysql.schema";

export function entitiesMatch(ent1: MysqlEntity, ent2: MysqlEntity) {
  let t1 = (ent1.constructor as any).getTableName()
  let t2 = (ent2.constructor as any).getTableName()
  let c1 = (ent1.constructor as any).getColumns()
  let c2 = (ent2.constructor as any).getColumns()
  if (t1 != t2 || c1.length != c2.length) {
    return false
  }
  for (let column of c1) {
    if (!isEqual(ent1[column.name],ent2[column.name])) {
      return false
    }
  }
  return true
}