---
sidebar_position: 5
---

# SELECT Queries: In Depth

[In Finder Methods](./select-methods.md), we've seen what the various finder methods are. In this guide,
we'll focus on how to use [`findAll`](pathname:///api/v7/classes/Model.html#findAll) in depth. The information of this guide
is still relevant for other finder methods, as they are built on top of `findAll`.

## Simple SELECT queries

Without any options, [`findAll`](pathname:///api/v7/classes/Model.html#findAll) will return all rows of a table as instances of the model,
and [`findOne`](pathname:///api/v7/classes/Model.html#findOne) will return the first row of a table as an instance of the model:

```ts
const users = await User.findAll();
```

```sql
SELECT * FROM users;
```

## Selecting Attributes

By default, querying methods will load all attributes of the model. You can control which attributes are loaded by using the [`attributes`](pathname:///api/v7/interfaces/_sequelize_core.Projectable.html) option:

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
  // "password" is attributes of the "User" model
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

You can use [SQL Literals](./raw-queries.md#literals--raw-sql-) to select any SQL expression instead of a column.
When using SQL expressions like in the above example, you must give it an alias to be able to access it from the model.
In the above example, the alias is `age`.

:::caution TypeScript

Be aware that these attributes will not be typed, as methods such as `findAll` and `findOne` return 
instances of the model class.

If these attributes are part of your model, you could declare them as optional attributes on your model.

If they are not part of your model, 
One way to type these attributes is to use the `raw` option, which will return a plain object instead of an instance of the model class:

```ts
import { sql } from '@sequelize/core';

interface Data {
  authorId: number;
  postCount: number;
}

// this will return an array of plain objects with the shape of the "Data" interface
const data: Data[] = await Post.findAll<Data>({
  attributes: [
    [sql`COUNT(${sql.attribute('id')})`, 'postCount'],
  ],
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
  }
});
```

```sql
SELECT * FROM posts WHERE "authorId" = 2;
```

You can specify multiple attributes in the `where` object, and they will be joined by an `AND` operator:

```js
Post.findAll({
  where: {
    authorId: 2,
    status: 'active',
  },
});
```

```sql
SELECT * FROM posts WHERE "authorId" = 2 AND "status" = 'active';
```

If you need to specify an `OR` condition, you can use the [Op.or](./operators.mdx#logical-combinations-or-and-not) operator or the [`or`](pathname:///api/v7/functions/_sequelize_core.or.html) function:

```js
import { or } from '@sequelize/core';

Post.findAll({
  where: or({
    authorId: 2,
    status: 'active',
  }),
});
```

```sql
SELECT * FROM posts WHERE "authorId" = 2 OR "status" = 'active';
```

Of course, you can also nest and mix these operators:

```js
import { or, and } from '@sequelize/core';

Post.findAll({
  where: and(
    {
      authorId: 2,
      status: 'active',
    },
    or(
      { title: 'foo' },
      { title: 'bar' },
    ),
  ),
});
```

```sql
SELECT * FROM posts 
WHERE "authorId" = 2 
  AND "status" = 'active' 
  AND ("title" = 'foo' OR "title" = 'bar');
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

This syntax is only available on attributes, but you can also use [`sql.cast`](./raw-queries.md#sqlcast) to cast a value:

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

:::info More information

Head to our [Raw SQL guide](./raw-queries.md) for more information on how to use the `sql` tag.

:::

## Ordering

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
  order: [
    ['title', 'DESC'],
  ],
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
- `NULLS FIRST`
- `NULLS LAST`

You can also use [raw SQL](./raw-queries.md) to order by an expression:

```ts
Subtask.findAll({
  order: [
    [sql`UPPERCASE(${sql.attribute('title')})`, 'DESC'],
  ],
});
```

```sql
SELECT * FROM subtasks ORDER BY UPPERCASE("title") DESC;
```

You can use [raw SQL](./raw-queries.md) inside the `order` array, or as the entire `order` option:

```ts
Subtask.findAll({
  order: sql`UPPERCASE(${sql.attribute('title')}) DESC`,
});
```

```sql
SELECT * FROM subtasks ORDER BY UPPERCASE("title") DESC;
```

In queries that use [associations](../associations/basics.md), you can order by an associated model's attribute:

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
  include: [{
    association: Task.associations.subtasks,
    include: [Subtask.associations.author],
  }],
  order: [
    // The following examples are equivalent.
    
    // Will order by a nested associated model's title using the names of the associations.
    ['subtasks', 'author', 'firstName', 'DESC'],

    // Will order by a nested associated model's title using association objects.
    [Task.associations.subtasks, Subtask.associations.author, 'firstName', 'DESC'],
  ],
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

This option takes an array of attributes or [raw SQL](./raw-queries.md) to group by. Its most basic form is just an attribute name:

```ts
Project.findAll({ group: ['name'] });
```

```sql
SELECT * FROM "projects" GROUP BY "name";
```

:::warning

It's possible to set the `group` option to a string, which will be treated as raw SQL, but this is not recommended. [Use the `sql` tag instead](./raw-queries.md).

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

:::caution Interaction with includes

This option is designed to limit the number of instances of a model, not the total number of rows returned by the query.

For instance, the following query will return 2 users, but all projects that belong to these two users:

```ts
User.findAll({
  include: [User.associations.projects],
  limit: 2,
});
```

Due to how SQL works, the `limit` option will turn the query into a subquery. As a consequence,
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

Another solution is to use a subquery to filter your model:

```ts
User.findAll({
  include: [{
    association: User.associations.projects,
  }],
  // highlight-start
  where: {
    id: {
      [Op.in]: sql`
        SELECT DISTINCT "projects"."authorId" WHERE "projects"."name" = 'Project 1'
      `,
    }
  },
  // highlight-end
  limit: 2,
});
```

Subqueries are written in raw SQL. See [Raw Queries](./raw-queries.md) to learn how to write them.

We are redesigning this to make this more flexible. See [#15260](https://github.com/sequelize/sequelize/issues/15260) to follow the discussion.

:::