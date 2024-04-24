import { MysqlDataType, MysqlEntity } from "../src/mysql.schema"
import { entitiesMatch } from "../src/mysql.utils"

class Actor extends MysqlEntity {
  id: number
  name: string
}

Actor.DefineSchema("actors", {
  id: {
    type: MysqlDataType.INT,
    primaryKey: true
  },
  name: {
    type: MysqlDataType.VARCHAR,
    required: true
  }
})

describe("Mysql Utils", () => {
  let actor1 = new Actor({name: "Luis", id: 1})
  let actor2 = new Actor({name: "Adrian", id: 2})
  let compareActor1 = new Actor({name: "luis", id: 1})
  let compareActor2 = new Actor({name: "Luis", id: 1})
  let actor3 = new Actor({name: "Adrian", id: 2});
  (actor3 as any).lastName = "MyLastName"

  it("should return true if two entities are equal", async () => {
    expect(entitiesMatch(actor1, actor1)).toBeTruthy()
    expect(entitiesMatch(actor1, compareActor2)).toBeTruthy()
    expect(entitiesMatch(actor2, actor3)).toBeTruthy()
  })

  it("should return false if two entities are not equal", async () => {
    expect(entitiesMatch(actor1, actor2)).toBeFalsy()
    expect(entitiesMatch(actor1, compareActor1)).toBeFalsy()
  })
})