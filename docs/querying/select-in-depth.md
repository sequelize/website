---
sidebar_position: 5
---

# SELECT Queries: In Depth

import { SupportTable } from '@site/src/components/support-table';

[In Finder Methods](./select-methods.md), we've seen what the various finder methods are. In this guide,
we'll focus on how to use [`findAll`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#findAll) in depth. The information of this guide
is still relevant for other finder methods, as they are built on top of `findAll`.

## Simple SELECT queries

Without any options, [`findAll`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#findAll) will return all rows of a table as instances of the model,
and [`findOne`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#findOne) will return the first row of a table as an instance of the model:

```ts
const users = await User.findAll();
```

```sql
SELECT * FROM users;
```

## Selecting Attributes

By default, querying methods will load all attributes of the model. You can control which attributes are loaded by using the [`attributes`](pathname:///api/v7/interfaces/_sequelize_core.index.Projectable.html) option:

To select a specific list of attributes, set that option to an array of attribute names, like this:

```js
User.findAll({
  // "firstName" and "lastName" are attributes of the "User" model
  attributes: ['firstName', 'lastName'],
});
```

This will result in roughly the following SQL query:

```sql
SELECT "firstName", "lastName" FROM "users";
```

### Excluding attributes

You also have the option to exclude attributes from the result set:

```js
User.findAll({
  // "password" is an attribute of the "User" model
  attributes: { exclude: ['password'] },
});
```

This will load all attributes that have been defined in the model, except for the `password` attribute.

### Extra attributes

You also have the option to load custom attributes that are not part of the model definition.
This is useful if you need to compute the value of one of your attributes, or if you need to load attributes that are not part of your model definition.

You can do this by using the `attributes.include` option, which will load all attributes that have been defined in the model, plus the extra attributes that you have specified:

```js
User.findAll({
  attributes: {
    include: [
      // This will include a dynamically computed "age" property on all returned instances.
      [sql`DATEDIFF(year, "birthdate", GETDATE())`, 'age'],
    ],
  },
});
```

You can use [SQL Literals](./raw-queries.mdx) to select any SQL expression instead of a column.
When using SQL expressions like in the above example, you must give it an alias to be able to access it from the model.
In the above example, the alias is `age`.

:::caution TypeScript

Be aware that these attributes will not be typed, as methods such as `findAll` and `findOne` return
instances of the model class.

If these attributes are part of your model, you could declare them as optional attributes on your model.

If they are not part of your model;
one way to type these attributes is to use the `raw` option,
which will return a plain object instead of an instance of the model class:

```ts
import { sql } from '@sequelize/core';

interface Data {
  authorId: number;
  postCount: number;
}

// this will return an array of plain objects with the shape of the "Data" interface
const data: Data[] = await Post.findAll<Data>({
  attributes: [[sql`COUNT(${sql.attribute('id')})`, 'postCount']],
  group: ['authorId'],
  raw: true,
});
```

:::

## Applying WHERE clauses

The `where` option is used to filter the query. Its most basic form is an object of attribute-value pairs,
which is a simple equality check:

```js
Post.findAll({
  where: {
    authorId: 2,
  },
});
```

```sql
SELECT * FROM posts WHERE "authorId" = 2;
```

### Operators

Sequelize supports many operators, which can be used to create more complex queries. Here is a short example:

```js
import { Op } from '@sequelize/core';

Post.findAll({
  where: {
    views: {
      // highlight-start
      [Op.gt]: 100,
      [Op.lte]: 500,
      // highlight-end
    },
  },
});
```

```sql
SELECT * FROM posts WHERE "views" > 100 AND "views" <= 500;
```

You can find the complete list of operators, and more, in the [Operators guide](./operators.mdx).

### Logical Combinations

You can use `Op.and`, `Op.or`, and `Op.not` to create more complex conditions.
Read about them in the [chapter about logical combinations](./operators.mdx#logical-combinations):

```ts
import { Op } from '@sequelize/core';

Post.findAll({
  where: {
    [Op.or]: {
      authorId: 12,
      status: 'active',
    },
  },
});
```

```sql
SELECT * FROM "posts" WHERE "authorId" = 12 OR "status" = 'active';
```

### Casting

Sequelize provides a convenient syntax to cast an attribute to a different type:

```ts
User.findAll({
  where: {
    // highlight-next-line
    'createdAt::text': {
      [Op.like]: '2012-%',
    },
  },
});
```

```sql
SELECT * FROM "users" AS "user" WHERE CAST("user"."createdAt" AS TEXT) LIKE '2012-%';
```

This syntax is only available on attributes, but you can also use [`sql.cast`](./raw-queries.mdx#sqlcast) to cast a value:

```ts
User.findAll({
  where: {
    createdAt: {
      [Op.gt]: sql.cast('2012-01-01', 'date'),
    },
  },
});
```

```sql
SELECT * FROM "users" AS "user" WHERE "user"."createdAt" > CAST('2012-01-01' AS DATE);
```

### Referring to other attributes

If you want to use the value of another attribute, you can use the [`sql.attribue`](./raw-queries.mdx#sqlattribute) function:

```js
Article.findAll({
  where: {
    // select all articles where the author is also the reviewer
    authorId: sql.attribute('reviewerId'),
  },
});
```

### Using functions & other SQL expressions

Operators are great, but barely scratch the surface of what you can do with SQL.
If you need to use a function or another SQL feature, you can use the `sql` tag to write raw SQL:

```ts
import { sql } from '@sequelize/core';

const maxLength = 7;

User.findAll({
  where: sql`char_length(${sql.attribute('content')}) <= ${maxLength}`,
});
```

```sql
SELECT * FROM "users" AS "user" WHERE char_length("user"."content") <= 7;
```

:::info More information

Head to our [Raw SQL guide](./raw-queries.mdx) for more information on how to use the `sql` tag.

:::

## Eager Loading (`include`)

:::note

This section assumes you understand [how to associate models](../associations/basics.md).

:::

**Eager Loading** is the act of querying data of several models in the same query (one 'main' model and one or more associated models).
At the SQL level, this is a query with one or more [joins](<https://en.wikipedia.org/wiki/Join_(SQL)>).

On the other hand, **Lazy Loading** is the act of querying data of several models in separate queries (one query per model).
This can be achieved easily by using the association getters of your association (see [`HasOne`](../associations/has-one.md#association-getter-getx),
[`HasMany`](../associations/has-many.md#association-getter-getx), [`BelongsTo`](../associations/belongs-to.md#association-getter-getx),
[`BelongsToMany`](../associations/belongs-to-many.md#association-getter-getx))

### Basics

In Sequelize, eager loading is done by using the `include` option of one of the [model finder](./select-methods.md).

```ts
class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  declare id: number;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare content: string;

  @HasMany(() => Comment, 'postId')
  // highlight-next-line
  declare comments?: NonAttribute<Comment[]>;
}

// This will load all posts along with all of their associated comments.
const posts = await Post.findAll({
  // highlight-next-line
  include: ['comments'],
});

// The list of comments will now be available in the `comments` property of each post instance:
console.log(posts[0].comments[0] instanceof Comment); // true
```

```sql
SELECT
  "Post"."id",
  "Post"."content",
  "comments"."id" AS "comments.id",
  "comments"."content" AS "comments.content",
  "comments"."postId" AS "comments.postId"
FROM "Posts" AS "Post"
// highlight-start
LEFT JOIN "Comments" AS "comments"
  ON "Post"."id" = "comments"."postId";
// highlight-end
```

The list of comments will now be available in the `comments` property of each post instance.

If the association is a `HasMany` of `BelongsToMany` association, the associated model will be an array of instances.
For `BelongsTo` and `HasOne` associations, the associated model will be a single instance (or `null`, if none is associated).

:::info Selecting the association

The string we pass to the `include` option is the name of the association we want to eagerly load, which is equal
to the name of the field on which the association decorator (`@HasOne`, `@HasMany`, `@BelongsTo`, `@BelongsToMany`) was applied.

:::

### Nested eager loading

You can load as many levels of association as you like, as the `include` option itself accepts an `include` option.

This example will load all posts, along with all of their associated comments, and the author of each comment:

```ts
const posts = await Post.findAll({
  include: [
    {
      association: 'comments',
      // highlight-next-line
      include: ['author'],
    },
  ],
});
```

```sql
SELECT
  "Post"."id",
  "Post"."content",
  "comments"."id" AS "comments.id",
  "comments"."content" AS "comments.content",
  "comments"."postId" AS "comments.postId",
  "comments->author"."id" AS "comments.author.id",
  "comments->author"."name" AS "comments.author.name"
FROM "Posts" AS "Post"
LEFT JOIN "Comments" AS "comments"
  ON "Post"."id" = "comments"."postId"
// highlight-start
LEFT JOIN "Authors" AS "comments->author"
  ON "comments"."authorId" = "comments->author"."id";
// highlight-end
```

This will cause the "author" property of each comment to be populated with the author of the comment.

### Separate eager-loading queries

Eager-loading produces a single query with multiple joins. This works great for `HasOne` and `BelongsTo` associations,
but for `HasMany` and `BelongsToMany` associations, it can cause a lot of duplicate data to be returned.

Sequelize will de-duplicate the data, but this can be inefficient. To avoid this, you can use the `separate` option.
This option will cause the finder to run two consecutive queries: one to fetch the main model, and another to fetch the associated models.

```ts
const posts = await Post.findAll({
  include: [
    {
      association: 'comments',
      // highlight-next-line
      separate: true,
    },
  ],
});
```

Which option is better depends on the data you are querying. Neither option is always better than the other.

:::tip

When using `separate`, you can order the associated models by using the `order` option of the `include`.

```ts
const posts = await Post.findAll({
  include: [
    {
      association: 'comments',
      separate: true,
      // highlight-next-line
      order: [['createdAt', 'DESC']],
    },
  ],
});
```

:::

### Required eager loading (`INNER JOIN`)

By default, Sequelize will generate a `LEFT JOIN` query when eager loading. This means that all parent models
will be returned, regardless of whether they have any associated models. If they do not have any associated model,
the association property will be an empty array (`[]`) or `null`, depending on the association plurality.

You can use the `required` include option to change this behavior. This will make Sequelize generate an `INNER JOIN` query instead,
meaning that only parent models with at least one associated model will be returned.

```ts
const posts = await Post.findAll({
  include: [
    {
      association: 'comments',
      // highlight-next-line
      required: true,
    },
  ],
});
```

```sql
SELECT
  "Post"."id",
  "Post"."content",
  "comments"."id" AS "comments.id",
  "comments"."content" AS "comments.content",
  "comments"."postId" AS "comments.postId"
FROM "Posts" AS "Post"
// highlight-next-line
INNER JOIN "Comments" AS "comments"
  ON "Post"."id" = "comments"."postId";
```

### `RIGHT JOIN`

<SupportTable
dialectLinks={{
PostgreSQL: 'https://www.postgresql.org/docs/current/queries-table-expressions.html',
MariaDB: 'https://mariadb.com/kb/en/join-syntax/',
MySQL: 'https://dev.mysql.com/doc/refman/8.0/en/join.html',
MSSQL: 'https://learn.microsoft.com/en-us/sql/relational-databases/performance/joins',
Snowflake: 'https://docs.snowflake.com/en/sql-reference/constructs/join',
db2: 'https://www.ibm.com/docs/sr/db2-for-zos/11?topic=table-right-outer-join',
ibmi: 'https://www.ibm.com/docs/en/i/7.4?topic=table-right-outer-join',
}}
/>

In preceding sections, we have seen how to load associated models using either a `LEFT OUTER JOIN` or an `INNER JOIN`.

Some dialects also support `RIGHT OUTER JOIN`, which Sequelize supports by setting the `right` option to `true`.
This option is incompatible with the [`required` option](#required-eager-loading-inner-join).

```ts
const posts = await Post.findAll({
  include: [
    {
      association: 'comments',
      // highlight-next-line
      right: true,
    },
  ],
});
```

```sql
SELECT
  "Post"."id",
  "Post"."content",
  "comments"."id" AS "comments.id",
  "comments"."content" AS "comments.content",
  "comments"."postId" AS "comments.postId"
FROM "Posts" AS "Post"
// highlight-next-line
RIGHT JOIN "Comments" AS "comments"
  ON "Post"."id" = "comments"."postId";
```

### Filtering associated models

The list of associated models can have its own `where` option, which can be used to filter which associated
will be loaded.

```ts
const posts = await Post.findAll({
  include: [
    {
      association: 'comments',
      required: false,
      // highlight-start
      where: {
        approved: true,
      },
      // highlight-end
    },
  ],
});
```

```sql
SELECT
  "Post"."id",
  "Post"."content",
  "comments"."id" AS "comments.id",
  "comments"."content" AS "comments.content",
  "comments"."postId" AS "comments.postId"
FROM "Posts" AS "Post"
LEFT JOIN "Comments" AS "comments"
  ON "Post"."id" = "comments"."postId"
  // highlight-next-line
  AND "comments"."approved" = true;
```

:::caution Where & Required

Using the `where` option on an include makes the `required` option default to `true`. This may be changed in the future.

:::

### Referencing associated models in a parent WHERE clause

It is possible to reference associated models in a parent `where` option:

```ts
Article.findAll({
  include: ['comments'],
  where: {
    // highlight-start
    '$comments.id$': { [Op.eq]: null },
    // highlight-end
  },
});
```

```sql
SELECT
  "Article"."id",
  "Article"."title",
  "comments"."id" AS "comments.id",
  "comments"."content" AS "comments.content",
  "comments"."articleId" AS "comments.articleId"
FROM "Articles" AS "Article"
LEFT JOIN "Comments" AS "comments"
  ON "Article"."id" = "comments"."articleId"
// highlight-next-line
WHERE "comments"."id" IS NULL;
```

Notice how the condition is added to the `WHERE` clause instead of the `ON` clause.

This allows you to create conditions that would not be possible to create using the `where` option of the `include`. For instance,
the above example showcases how you can select all articles that have no comments.

The `$nested.column$` syntax also works for columns that are nested several levels deep, such as `$some.super.deeply.nested.column$`.
Therefore, you can use this to make complex filters on deeply nested columns.

:::caution Interaction with `separate`

This syntax is not able to reference associations loaded using the [`separate`](#separate-eager-loading-queries) option.
Because those associations are loaded in subsequent queries, the data is simply not present and impossible to reference.

If you want to reference those associations, you must use [subqueries](./sub-queries.md) instead.

:::

:::caution Interaction with `LIMIT`

The `LIMIT` option is designed to limit the number of instances of a model, not the total number of rows returned by the query.

For instance, the following query will return 2 users, but all projects that belong to these two users:

```ts
User.findAll({
  include: [User.associations.projects],
  limit: 2,
});
```

Due to how SQL works, the `limit` option will turn queries that eager load into a subquery. As a consequence,
the top-level `where` option will not be able to reference attributes from the included models.

```ts
User.findAll({
  include: [User.associations.projects],
  where: {
    // error-start
    // This will not work.
    '$projects.name$': 'Project 1',
    // error-end
  },
  limit: 2,
});
```

You can remove that subquery, and revert back to a plain JOIN, by using the `subquery: false` option:

```ts
User.findAll({
  include: [User.associations.projects],
  where: {
    '$projects.name$': 'Project 1',
  },
  limit: 2,
  // highlight-next-line
  subquery: false,
});
```

However, this will make the limit option apply to the total number of rows returned by the query,
not the number of instances of the model. This is not a problem if your include can only return one row per instance,
but it will be a problem if it can return multiple rows per instance.

Another solution is to use a [subquery](./sub-queries.md) to filter your model:

```ts
User.findAll({
  include: [
    {
      association: User.associations.projects,
    },
  ],
  // highlight-start
  where: {
    id: {
      [Op.in]: sql`
        SELECT DISTINCT "projects"."authorId" WHERE "projects"."name" = 'Project 1'
      `,
    },
  },
  // highlight-end
  limit: 2,
});
```

We are redesigning this to make this more flexible. See [#15260](https://github.com/sequelize/sequelize/issues/15260) to follow the discussion.

:::

### Eager-loading the `BelongsToMany` through model

When you perform eager loading on a model with a Belongs-to-Many relationship,
Sequelize will fetch the junction model and make it available as a property on the target model.

This is useful when you want to add [additional attributes to the through model](../associations/belongs-to-many.md#customizing-the-junction-table).

```ts
class Author extends Model {
  @BelongsToMany(() => Book, {
    through: 'BookAuthor',
  })
  books;
}

const author = await Author.findOne({
  include: ['books'],
});

console.log(JSON.stringify(author[0]));
```

Console output:

```json
{
  "id": 1,
  "name": "John Doe",
  "books": [
    {
      "id": 1,
      "name": "A book.",
      // highlight-start
      "BookAuthor": {
        "bookId": 1,
        "authorId": 1
      }
      // highlight-end
    }
  ]
}
```

You can configure how the through model is fetched by using the `through` option. This option accepts the
same options as the `include` option, such as [`where`](#filtering-associated-models) and [`attributes`](#selecting-attributes)

```ts
const author = await Author.findOne({
  include: [
    {
      association: 'books',
      // highlight-start
      through: {
        attributes: [],
        where: {
          role: 'reviewer',
        },
      },
      // highlight-end
    },
  ],
});
```

## Ordering

### Basics

The `order` option can be used to sort the results of a query. It controls the `ORDER BY` clause of the SQL query.

This option takes an array of items to order the query by or a sequelize method. Its most basic form is just an attribute name:

```ts
Subtask.findAll({
  order: ['title'],
});
```

```sql
SELECT * FROM subtasks ORDER BY "title";
```

You can of course specify multiple attributes to order by:

```ts
Subtask.findAll({
  order: ['title', 'createdAt'],
});
```

```sql
SELECT * FROM subtasks ORDER BY "title", "createdAt";
```

By default, the direction is `ASC`, but you can specify it explicitly. To do so, you must use an array of `[attribute, direction]`:

```ts
Subtask.findAll({
  order: [['title', 'DESC']],
});
```

```sql
SELECT * FROM subtasks ORDER BY "title" DESC;
```

There are 2 valid directions: `ASC` (default) and `DESC`. You can also specify `NULLS FIRST` or `NULLS LAST`. Here are all possible combinations:

- `ASC`
- `DESC`
- `ASC NULLS FIRST`
- `DESC NULLS FIRST`
- `ASC NULLS LAST`
- `DESC NULLS LAST`

You can also use [raw SQL](./raw-queries.mdx) to order by an expression:

```ts
Subtask.findAll({
  order: [[sql`UPPERCASE(${sql.attribute('title')})`, 'DESC']],
});
```

```sql
SELECT * FROM subtasks ORDER BY UPPERCASE("title") DESC;
```

You can use [raw SQL](./raw-queries.mdx) inside the `order` array, or as the entire `order` option:

```ts
Subtask.findAll({
  order: sql`UPPERCASE(${sql.attribute('title')}) DESC`,
});
```

```sql
SELECT * FROM subtasks ORDER BY UPPERCASE("title") DESC;
```

### Ordering based on associated models

In queries that use [associations](#eager-loading-include), you can order by an associated model's attribute:

```ts
Task.findAll({
  include: [Task.associations.subtasks],
  order: [
    // The following examples are equivalent.

    // Will order by an associated model's title using the name of the association.
    ['subtasks', 'title', 'DESC'],

    // Will order by an associated model's title using an association object.
    [Task.associations.subtasks, 'title', 'DESC'],
  ],
});
```

And of course, you can also order by a nested associated model's attribute:

```ts
Task.findAll({
  include: [
    {
      association: Task.associations.subtasks,
      include: [Subtask.associations.author],
    },
  ],
  order: [
    // The following examples are equivalent.

    // Will order by a nested associated model's title using the names of the associations.
    ['subtasks', 'author', 'firstName', 'DESC'],

    // Will order by a nested associated model's title using association objects.
    [Task.associations.subtasks, Subtask.associations.author, 'firstName', 'DESC'],
  ],
});
```

### Ordering based on `BelongsToMany` through models

In the case of many-to-many relationships,
you are also able to sort by attributes in the through table.

For example, assuming we have a Many-to-Many relationship between `Division` and `Department` whose junction model is `DepartmentDivision`, you can do:

```js
Company.findAll({
  include: ['divisions'],
  order: [['divisions', DepartmentDivision, 'name', 'ASC']],
});
```

## Grouping

:::caution

Finder methods such as `findAll`, `findOne`, `findAndCountAll` are designed to return instances of a model.

Grouping produces a result that will typically not be mapped to the model properly.
Be aware that using this feature may result in unexpected behavior.

While this feature will not be removed, we are researching this subject and will introduce a better way to use it in the future.
See [#15260](https://github.com/sequelize/sequelize/issues/15260) to follow the discussion.

:::

The `group` options controls the `GROUP BY` clause of the SQL query. It can be used to group the results of a query.

This option takes an array of attributes or [raw SQL](./raw-queries.mdx) to group by. Its most basic form is just an attribute name:

```ts
Project.findAll({ group: ['name'] });
```

```sql
SELECT * FROM "projects" GROUP BY "name";
```

:::warning

It's possible to set the `group` option to a string, which will be treated as raw SQL, but this is not recommended. [Use the `sql` tag instead](./raw-queries.mdx).

The ability to treat a non-`sql` tagged string as raw SQL will be removed in a future version of Sequelize.

:::

## Limits and Pagination

The `limit` and `offset` options allow you to work with limiting / pagination:

```js
// Fetch 10 instances/rows
Project.findAll({ limit: 10 });

// Skip 8 instances/rows
Project.findAll({ offset: 8 });

// Skip 5 instances and fetch the 5 after that
Project.findAll({ offset: 5, limit: 5 });
```

Usually these are used alongside the `order` option.
