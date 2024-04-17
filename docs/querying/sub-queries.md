---
title: Subqueries
sidebar_position: 10
---

Subqueries are queries that are nested inside another query. They are a powerful tool that can be used to achieve complex queries that would otherwise be impossible to write.

In Sequelize, subqueries currently require writing raw SQL. However, Sequelize can help you with the main query, and you can use [the `sql` tag](./raw-queries.mdx) to insert the sub-query into the main query.

**Example**:

Consider you have two models, `Post` and `Reaction`, with a One-to-Many relationship set up, so that one post has many reactions:

<details>
<summary>Click to see the model definition of Post & Reaction</summary>

```ts
import {
  Sequelize,
  Model,
  DataTypes,
  InferCreationAttributes,
  InferAttributes,
} from '@sequelize/core';
import {
  Attribute,
  AutoIncrement,
  PrimaryKey,
  NotNull,
  HasMany,
} from '@sequelize/decorators-legacy';
import { SqliteDialect } from '@sequelize/sqlite3';

class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  @PrimaryKey
  @Attribute(DataTypes.INTEGER)
  @AutoIncrement
  declare id: number;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare content: string;

  @HasMany(() => Reaction, 'postId')
  declare reactions?: NonAttribute<Reaction[]>;
}

enum ReactionType {
  Like = 'Like',
  Angry = 'Angry',
  Laugh = 'Laugh',
  Sad = 'Sad',
}

class Reaction extends Model {
  @PrimaryKey
  @Attribute(DataTypes.INTEGER)
  @AutoIncrement
  declare id: number;

  @Attribute(DataTypes.ENUM(Object.keys(ReactionType)))
  @NotNull
  declare type: ReactionType;

  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare postId: number;
}

const sequelize = new Sequelize({
  dialect: SqliteDialect,
  storage: ':memory:',
  models: [Post, Reaction],
});
```

</details>

If you want to get all posts that have at least one reaction of type `Laugh`, you can do that with a sub-query:

```ts
import { sql, Op } from '@sequelize/core';

Post.findAll({
  where: {
    id: {
      [Op.in]: sql`
        SELECT DISTINCT "postId"
        FROM "reactions" AS "reaction"
        WHERE "reaction"."type" = 'Laugh'
      `,
    },
  },
});
```

And thanks to the flexibility of the `sql` tag, you can customize the sub-query to your needs:

```ts
import { sql, Op } from '@sequelize/core';

function postHasReactionOfType(type: ReactionType) {
  return {
    id: {
      [Op.in]: sql`
        SELECT DISTINCT "postId"
        FROM "reactions" AS "reaction"
        WHERE "reaction"."type" = ${type}
      `,
    },
  };
}

Post.findAll({
  where: postHasReactionOfType(ReactionType.Laugh),
});
```
