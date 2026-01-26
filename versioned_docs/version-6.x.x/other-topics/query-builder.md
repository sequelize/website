---
title: Query Builder (experimental)
---

The Query Builder provides a convenient and flexible interface to build arbitrary/complex queries programatically.

## Usage

It can be instantiated from the desired model:

```typescript
const query = User.select(); // Returns a QueryBuilder instance
```

This query builder uses a Builder pattern, each function returns a new immutable copy of the Query Builder with the new properties defined by the chain function.

### Chaining options

- `.select()` - Called from the static model, will instantiate the QueryBuilder
- `.attributes()` - Sets desired attributes to be selected, will default to `*` if none are provided
- `.where()` - WHERE conditions for the query, normal sequelize `WhereOptions` are used here
- `.includes()` - Custom JOIN conditions with other models\*. The parameters for this are:
  - `model: ModelStatic<M>` - Model to be joined with
  - `as` - Alias for this model
  - `on` - Mandatory join condition (`Record<keyof M, Col>`)
  - `attributes` - Attributes to be selected
  - `where` - Where conditions for this model
  - `required` - If true, will be an inner join
  - `joinType` - "LEFT" | "INNER" | "RIGHT"
- `.groupBy()` - GROUP BY clause (`GroupOption`)
- `.having()` - HAVING clause (`Literal`)
- `.andHaving()` - Chain an additional HAVING clause
- `.orderBy()` - ORDER BY clause (`Order`)
- `.limit()` - LIMIT number
- `.offset()` - OFFSET number

_\* = currently only supporting joining with base model, include inside include. But you can join multiple times with the base model_

To return the built query, you need to invoke the `getQuery()` method. You can optionally send `{ multiline: true }` so the builder breakes the SQL into multiple lines for convenience.

Additionally, `.execute()` can be ran to run the query instead of returning it, it will return a result like a raw `.query()` call. Joins will explode the resulting rows, the query builder doesn't handle dependency aggregation.

## Usage example

```typescript
User.select()
  .attributes(['name', ['age', 'userAge']])
  .includes({
    model: Post,
    as: 'p',
    on: sequelize.where(sequelize.col('User.id'), '=', sequelize.col('p.userId')),
    attributes: ['title'],
    where: { title: { [Op.iLike]: '%cr%' } },
    required: true,
  })
  .includes({
    model: Comments,
    as: 'c',
    on: sequelize.where(sequelize.col('User.id'), '=', sequelize.col('c.userId')),
    attributes: [[sequelize.literal('SUM("c"."likes")'), 'likeCount']],
    joinType: 'LEFT',
  })
  .where({
    [Op.or]: [
      { active: true },
      {
        [Op.and]: [{ age: { [Op.gte]: 18 } }, { name: { [Op.iLike]: '%admin%' } }],
      },
    ],
  })
  .groupBy([sequelize.col('User.id'), sequelize.col('p.id')])
  .having(sequelize.literal('SUM("c"."likes") > 10'))
  .andHaving(sequelize.literal('SUM("c"."likes") < 300'))
  .orderBy([
    ['name', 'DESC'],
    [sequelize.col('p.title'), 'ASC'],
  ])
  .getQuery({ multiline: true });
/**
 * Returns: 
    SELECT "User"."name", "User"."age" AS "userAge", "p"."title" AS "p.title", SUM("c"."likes") AS "c.likeCount"
    FROM "Users" AS "User"
    INNER JOIN "Posts" AS "p" ON "User"."id" = "p"."userId" AND "p"."title" ILIKE '%cr%'
    LEFT OUTER JOIN "Comments" AS "c" ON "User"."id" = "c"."userId"
    WHERE ("User"."active" = true OR ("User"."age" >= 18 AND "User"."name" ILIKE '%admin%'))
    GROUP BY "User"."id", "p"."id"
    HAVING (SUM("c"."likes") > 10 AND SUM("c"."likes") < 300)
    ORDER BY "User"."name" DESC, "p"."title" ASC;
 */
```
