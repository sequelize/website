---
sidebar_position: 5
---

# SELECT Queries: In Depth

Sequelize provides various methods to assist querying your database for data.

*Important notice: to perform production-ready queries with Sequelize, make sure you have read the [Transactions guide](../other-topics/transactions.md) as well. Transactions are important to ensure data integrity and to provide other benefits.*

This guide will show how to make the standard [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) queries.

## Simple SELECT queries

You can read the whole table from the database with the [`findAll`](pathname:///api/v7/classes/Model.html#findAll) method:

```js
// Find all users
const users = await User.findAll();
console.log(users.every(user => user instanceof User)); // true
console.log("All users:", JSON.stringify(users, null, 2));
```

```sql
SELECT * FROM ...
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
SELECT foo, bar FROM my_table;
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
      [literal('DATEDIFF(year, "birthdate", GETDATE())'), 'age'],
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
import { fn, col } from '@sequelize/core';

interface Data {
  authorId: number;
  postCount: number;
}

// this will return an array of plain objects with the shape of the "Data" interface
const data: Data[] = await Post.findAll<Data>({
  attributes: [
    [fn('COUNT', col('id')), 'postCount'],
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

// SELECT * FROM posts WHERE "authorId" = 2;
```

You can specify multiple attributes in the `where` object, and they will be joined by an `AND` operator:

```js
Post.findAll({
  where: {
    authorId: 2,
    status: 'active',
  },
});

// SELECT * FROM posts WHERE "authorId" = 2 AND "status" = 'active';
```

If you need to specify an `OR` condition, you can use the [Op.or](pathname:///api/v7/interfaces/_sequelize_core.OpTypes.html#or) operator or the [`or`](pathname:///api/v7/functions/_sequelize_core.or.html) function:

```js
import { or } from '@sequelize/core';

Post.findAll({
  where: or({
    authorId: 2,
    status: 'active',
  }),
});

// SELECT * FROM posts WHERE "authorId" = 2 OR "status" = 'active';
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

// SELECT * FROM posts WHERE "authorId" = 2 AND "status" = 'active' AND ("title" = 'foo' OR "title" = 'bar');
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

// SELECT * FROM posts WHERE "views" > 100 AND "views" <= 500;
```

You can find the complete list of operators, and more, in the [Operators guide](./operators.mdx).

### Casting

- shorthand casting syntax
- longhand casting syntax

### Advanced queries with functions (not just columns)

[//]: # (TODO: THIS HAS NOT BEEN REWRITTEN YET)

What if you wanted to obtain something like `WHERE char_length("content") = 7`?

```js
import { where, fn, col } from '@sequelize/core';

Post.findAll({
  where: where(fn('char_length', col('content')), 7)
});
// SELECT ... FROM "posts" AS "post" WHERE char_length("content") = 7
```

Note the usage of the  [`fn`](pathname:///api/v7/index.html#fn) and [`col`](pathname:///api/v7/index.html#col) methods, which should be used to specify an SQL function call and a table column, respectively. These methods should be used instead of passing a plain string (such as `char_length(content)`) because Sequelize needs to treat this situation differently (for example, using other symbol escaping approaches).

What if you need something even more complex?

```js
import { where, fn, col, Op } from '@sequelize/core';

Post.findAll({
  where: {
    [Op.or]: [
      where(fn('char_length', col('content')), 7),
      {
        content: {
          [Op.like]: 'Hello%'
        }
      },
      {
        [Op.and]: [
          { status: 'draft' },
          where(fn('char_length', col('content')), {
            [Op.gt]: 10
          })
        ]
      }
    ]
  }
});
```

The above generates the following SQL:

```sql
SELECT
  ...
FROM "posts" AS "post"
WHERE (
  char_length("content") = 7
  OR
  "post"."content" LIKE 'Hello%'
  OR (
    "post"."status" = 'draft'
    AND
    char_length("content") > 10
  )
)
```

### Querying JSON

JSON can be queried in three different ways:

```js
// Nested object
await Foo.findOne({
  where: {
    meta: {
      video: {
        url: {
          [Op.ne]: null
        }
      }
    }
  }
});

// Nested key
await Foo.findOne({
  where: {
    "meta.audio.length": {
      [Op.gt]: 20
    }
  }
});

// Containment
await Foo.findOne({
  where: {
    meta: {
      [Op.contains]: {
        site: {
          url: 'https://google.com'
        }
      }
    }
  }
});
```

#### MSSQL

MSSQL does not have a JSON data type, however it does provide some support for JSON stored as strings through certain functions since SQL Server 2016. Using these functions, you will be able to query the JSON stored in the string, but any returned values will need to be parsed separately.

```js
import { where, fn, col } from '@sequelize/core';

// ISJSON - to test if a string contains valid JSON
await User.findAll({
  where: where(fn('ISJSON', col('userDetails')), 1)
});

// JSON_VALUE - extract a scalar value from a JSON string
await User.findAll({
  attributes: [[ fn('JSON_VALUE', col('userDetails'), '$.address.Line1'), 'address line 1']]
});

// JSON_VALUE - query a scalar value from a JSON string
await User.findAll({
  where: where(fn('JSON_VALUE', col('userDetails'), '$.address.Line1'), '14, Foo Street')
});

// JSON_QUERY - extract an object or array
await User.findAll({
  attributes: [[ fn('JSON_QUERY', col('userDetails'), '$.address'), 'full address']]
});
```

### Postgres-only Range Operators

Range types can be queried with all supported operators.

Keep in mind, the provided range value can [define the bound inclusion/exclusion](../models/data-types.mdx#ranges-postgresql-only) as well.

```js
[Op.contains]: 2,            // @> '2'::integer  (PG range contains element operator)
[Op.contains]: [1, 2],       // @> [1, 2)        (PG range contains range operator)
[Op.contained]: [1, 2],      // <@ [1, 2)        (PG range is contained by operator)
[Op.overlap]: [1, 2],        // && [1, 2)        (PG range overlap (have points in common) operator)
[Op.adjacent]: [1, 2],       // -|- [1, 2)       (PG range is adjacent to operator)
[Op.strictLeft]: [1, 2],     // << [1, 2)        (PG range strictly left of operator)
[Op.strictRight]: [1, 2],    // >> [1, 2)        (PG range strictly right of operator)
[Op.noExtendRight]: [1, 2],  // &< [1, 2)        (PG range does not extend to the right of operator)
[Op.noExtendLeft]: [1, 2],   // &> [1, 2)        (PG range does not extend to the left of operator)
```

### Deprecated: Operator Aliases

In Sequelize v4, it was possible to specify strings to refer to operators, instead of using Symbols. This is now deprecated and heavily discouraged, and will probably be removed in the next major version. If you really need it, you can pass the `operatorAliases` option in the Sequelize constructor.

For example:

```js
import { Sequelize, Op } from '@sequelize/core';

const sequelize = new Sequelize('sqlite::memory:', {
  operatorsAliases: {
    $gt: Op.gt
  }
});

// Now we can use `$gt` instead of `[Op.gt]` in where clauses:
Foo.findAll({
  where: {
    $gt: 6 // Works like using [Op.gt]
  }
});
```

## Ordering and Grouping

Sequelize provides the `order` and `group` options to work with `ORDER BY` and `GROUP BY`.

### Ordering

The `order` option takes an array of items to order the query by or a sequelize method. These *items* are themselves arrays in the form `[column, direction]`. The column will be escaped correctly and the direction will be checked in a whitelist of valid directions (such as `ASC`, `DESC`, `NULLS FIRST`, etc).

```js
import { where, fn, col, literal } from '@sequelize/core';

Subtask.findAll({
  order: [
    // Will escape title and validate DESC against a list of valid direction parameters
    ['title', 'DESC'],

    // Will order by max(age)
    fn('max', col('age')),

    // Will order by max(age) DESC
    [fn('max', col('age')), 'DESC'],

    // Will order by  otherfunction(`col1`, 12, 'lalala') DESC
    [fn('otherfunction', col('col1'), 12, 'lalala'), 'DESC'],

    // Will order an associated model's createdAt using the model name as the association's name.
    [Task, 'createdAt', 'DESC'],

    // Will order through an associated model's createdAt using the model names as the associations' names.
    [Task, Project, 'createdAt', 'DESC'],

    // Will order by an associated model's createdAt using the name of the association.
    ['Task', 'createdAt', 'DESC'],

    // Will order by a nested associated model's createdAt using the names of the associations.
    ['Task', 'Project', 'createdAt', 'DESC'],

    // Will order by an associated model's createdAt using an association object. (preferred method)
    [Subtask.associations.Task, 'createdAt', 'DESC'],

    // Will order by a nested associated model's createdAt using association objects. (preferred method)
    [Subtask.associations.Task, Task.associations.Project, 'createdAt', 'DESC'],

    // Will order by an associated model's createdAt using a simple association object.
    [{model: Task, as: 'Task'}, 'createdAt', 'DESC'],

    // Will order by a nested associated model's createdAt simple association objects.
    [{model: Task, as: 'Task'}, {model: Project, as: 'Project'}, 'createdAt', 'DESC']
  ],

  // Will order by max age descending
  order: literal('max(age) DESC'),

  // Will order by max age ascending assuming ascending is the default order when direction is omitted
  order: fn('max', col('age')),

  // Will order by age ascending assuming ascending is the default order when direction is omitted
  order: col('age'),

  // Will order randomly based on the dialect (instead of fn('RAND') or fn('RANDOM'))
  order: sequelize.random()
});

Foo.findOne({
  order: [
    // will return `name`
    ['name'],
    // will return `username` DESC
    ['username', 'DESC'],
    // will return max(`age`)
    fn('max', col('age')),
    // will return max(`age`) DESC
    [fn('max', col('age')), 'DESC'],
    // will return otherfunction(`col1`, 12, 'lalala') DESC
    [fn('otherfunction', col('col1'), 12, 'lalala'), 'DESC'],
    // will return otherfunction(awesomefunction(`col`)) DESC, This nesting is potentially infinite!
    [fn('otherfunction', fn('awesomefunction', col('col'))), 'DESC']
  ]
});
```

To recap, the elements of the order array can be the following:

* A string (which will be automatically quoted)
* An array, whose first element will be quoted, second will be appended verbatim
* An object with a `raw` field:
  * The content of `raw` will be added verbatim without quoting
  * Everything else is ignored, and if raw is not set, the query will fail
* A call to `fn()` (which will generate a function call in SQL)
* A call to `col()` (which will quote the column name)

### Grouping

The syntax for grouping and ordering are equal, except that grouping does not accept a direction as last argument of the array (there is no `ASC`, `DESC`, `NULLS FIRST`, etc).

You can also pass a string directly to `group`, which will be included directly (verbatim) into the generated SQL. Use with caution and don't use with user generated content.

```js
Project.findAll({ group: 'name' });
// yields 'GROUP BY name'
```

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

## Literals (raw SQL)

It's not always possible for Sequelize to support every SQL feature in a clean way. It can sometimes be better to write the SQL query yourself.

This can be done in two ways:

- Either write a complete [raw query](./raw-queries.md) yourself,
- or use the [`literal()`](pathname:///api/v7/index.html#literal) function provided by Sequelize to insert raw SQL almost anywhere in queries built by Sequelize.

```typescript
import { literal } from '@sequelize/core';

User.findAll({
  where: literal('id = $id'),
  bind: {
    id: 5,
  },
});
```

`literal()` supports both [replacements](./raw-queries.md#replacements) and [bind parameters](./raw-queries.md#bind-parameters) as ways to safely include user input in your query.
