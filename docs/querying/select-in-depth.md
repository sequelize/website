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

## Specifying attributes for SELECT queries

To select only some attributes, you can use the `attributes` option:

```js
Model.findAll({
  attributes: ['foo', 'bar']
});
```

```sql
SELECT foo, bar FROM ...
```

Attributes can be renamed using a nested array:

```js
Model.findAll({
  attributes: ['foo', ['bar', 'baz'], 'qux']
});
```

```sql
SELECT foo, bar AS baz, qux FROM ...
```

You can use [`fn`](pathname:///api/v7/index.html#fn) to do aggregations:

```js
import { fn, col } from '@sequelize/core';

Model.findAll({
  attributes: [
    'foo',
    [fn('COUNT', col('hats')), 'n_hats'],
    'bar'
  ]
});
```

```sql
SELECT foo, COUNT(hats) AS n_hats, bar FROM ...
```

When using aggregation function, you must give it an alias to be able to access it from the model. In the example above you can get the number of hats with `instance.n_hats`.

Sometimes it may be tiresome to list all the attributes of the model if you only want to add an aggregation:

```js
import { fn, col } from '@sequelize/core';

// This is a tiresome way of getting the number of hats (along with every column)
Model.findAll({
  attributes: [
    'id', 'foo', 'bar', 'baz', 'qux', 'hats', // We had to list all attributes...
    [fn('COUNT', col('hats')), 'n_hats'] // To add the aggregation...
  ]
});

// This is shorter, and less error prone because it still works if you add / remove attributes from your model later
Model.findAll({
  attributes: {
    include: [
      [fn('COUNT', col('hats')), 'n_hats']
    ]
  }
});
```

```sql
SELECT id, foo, bar, baz, qux, hats, COUNT(hats) AS n_hats FROM ...
```

Similarly, it's also possible to remove a selected few attributes:

```js
Model.findAll({
  attributes: { exclude: ['baz'] }
});
```

```sql
-- Assuming all columns are 'id', 'foo', 'bar', 'baz' and 'qux'
SELECT id, foo, bar, qux FROM ...
```

## Applying WHERE clauses

[//]: # (TODO: replace link to a guide that details every operator)

The `where` option is used to filter the query. There are lots of operators to use for the `where` clause, available as Symbols from [`Op`](pathname:///api/v7/index.html#Op).

### The basics

```js
Post.findAll({
  where: {
    authorId: 2
  }
});
// SELECT * FROM post WHERE authorId = 2;
```

Observe that no operator (from `Op`) was explicitly passed, so Sequelize assumed an equality comparison by default. The above code is equivalent to:

```js
const { Op } = require('@sequelize/core');

Post.findAll({
  where: {
    authorId: {
      [Op.eq]: 2
    }
  }
});
// SELECT * FROM post WHERE authorId = 2;
```

Multiple checks can be passed:

```js
Post.findAll({
  where: {
    authorId: 12,
    status: 'active'
  }
});
// SELECT * FROM post WHERE authorId = 12 AND status = 'active';
```

Just like Sequelize inferred the `Op.eq` operator in the first example, here Sequelize inferred that the caller wanted an `AND` for the two checks. The code above is equivalent to:

```js
const { Op } = require('@sequelize/core');

Post.findAll({
  where: {
    [Op.and]: [
      { authorId: 12 },
      { status: 'active' }
    ]
  }
});
// SELECT * FROM post WHERE authorId = 12 AND status = 'active';
```

An `OR` can be easily performed in a similar way:

```js
const { Op } = require('@sequelize/core');

Post.findAll({
  where: {
    [Op.or]: [
      { authorId: 12 },
      { authorId: 13 }
    ]
  }
});
// SELECT * FROM post WHERE authorId = 12 OR authorId = 13;
```

Since the above was an `OR` involving the same field, Sequelize allows you to use a slightly different structure which is more readable and generates the same behavior:

```js
const { Op } = require('@sequelize/core');

Post.destroy({
  where: {
    authorId: {
      [Op.or]: [12, 13]
    }
  }
});
// DELETE FROM post WHERE authorId = 12 OR authorId = 13;
```

### Operators

Sequelize provides several operators.

```js
const { Op, literal, fn } = require('@sequelize/core');

Post.findAll({
  where: {
    [Op.and]: [{ a: 5 }, { b: 6 }],            // (a = 5) AND (b = 6)
    [Op.or]: [{ a: 5 }, { b: 6 }],             // (a = 5) OR (b = 6)
    someAttribute: {
      // Basics
      [Op.eq]: 3,                              // = 3
      [Op.ne]: 20,                             // != 20
      [Op.is]: null,                           // IS NULL
      [Op.not]: true,                          // IS NOT TRUE
      [Op.or]: [5, 6],                         // (someAttribute = 5) OR (someAttribute = 6)

      // Using dialect specific column identifiers (PG in the following example):
      [Op.col]: 'user.organization_id',        // = "user"."organization_id"

      // Number comparisons
      [Op.gt]: 6,                              // > 6
      [Op.gte]: 6,                             // >= 6
      [Op.lt]: 10,                             // < 10
      [Op.lte]: 10,                            // <= 10
      [Op.between]: [6, 10],                   // BETWEEN 6 AND 10
      [Op.notBetween]: [11, 15],               // NOT BETWEEN 11 AND 15

      // Other operators

      [Op.all]: literal('SELECT 1'), // > ALL (SELECT 1)

      [Op.in]: [1, 2],                         // IN [1, 2]
      [Op.notIn]: [1, 2],                      // NOT IN [1, 2]

      [Op.like]: '%hat',                       // LIKE '%hat'
      [Op.notLike]: '%hat',                    // NOT LIKE '%hat'
      [Op.startsWith]: 'hat',                  // LIKE 'hat%'
      [Op.endsWith]: 'hat',                    // LIKE '%hat'
      [Op.substring]: 'hat',                   // LIKE '%hat%'
      [Op.iLike]: '%hat',                      // ILIKE '%hat' (case insensitive) (PG only)
      [Op.notILike]: '%hat',                   // NOT ILIKE '%hat'  (PG only)
      [Op.regexp]: '^[h|a|t]',                 // REGEXP/~ '^[h|a|t]' (MySQL/PG only)
      [Op.notRegexp]: '^[h|a|t]',              // NOT REGEXP/!~ '^[h|a|t]' (MySQL/PG only)
      [Op.iRegexp]: '^[h|a|t]',                // ~* '^[h|a|t]' (PG only)
      [Op.notIRegexp]: '^[h|a|t]',             // !~* '^[h|a|t]' (PG only)

      [Op.any]: [2, 3],                        // ANY (ARRAY[2, 3]::INTEGER[]) (PG only)
      [Op.match]: fn('to_tsquery', 'fat & rat') // match text search for strings 'fat' and 'rat' (PG only)

      // In Postgres, Op.like/Op.iLike/Op.notLike can be combined to Op.any:
      [Op.like]: { [Op.any]: ['cat', 'hat'] }  // LIKE ANY (ARRAY['cat', 'hat'])

      // There are more postgres-only range operators, see below
    }
  }
});
```

#### Shorthand syntax for `Op.in`

Passing an array directly to the `where` option will implicitly use the `IN` operator:

```js
Post.findAll({
  where: {
    id: [1,2,3] // Same as using `id: { [Op.in]: [1,2,3] }`
  }
});
// SELECT ... FROM "posts" AS "post" WHERE "post"."id" IN (1, 2, 3);
```

### Logical combinations with operators

The operators `Op.and`, `Op.or` and `Op.not` can be used to create arbitrarily complex nested logical comparisons.

#### Examples with `Op.and` and `Op.or`

```js
const { Op } = require('@sequelize/core');

Foo.findAll({
  where: {
    rank: {
      [Op.or]: {
        [Op.lt]: 1000,
        [Op.eq]: null
      }
    },
    // rank < 1000 OR rank IS NULL

    {
      createdAt: {
        [Op.lt]: new Date(),
        [Op.gt]: new Date(new Date() - 24 * 60 * 60 * 1000)
      }
    },
    // createdAt < [timestamp] AND createdAt > [timestamp]

    {
      [Op.or]: [
        {
          title: {
            [Op.like]: 'Boat%'
          }
        },
        {
          description: {
            [Op.like]: '%boat%'
          }
        }
      ]
    }
    // title LIKE 'Boat%' OR description LIKE '%boat%'
  }
});
```

#### Examples with `Op.not`

```js
Project.findAll({
  where: {
    name: 'Some Project',
    [Op.not]: [
      { id: [1,2,3] },
      {
        description: {
          [Op.like]: 'Hello%'
        }
      }
    ]
  }
});
```

The above will generate:

```sql
SELECT *
FROM `Projects`
WHERE (
  `Projects`.`name` = 'Some Project'
  AND NOT (
    `Projects`.`id` IN (1,2,3)
    AND
    `Projects`.`description` LIKE 'Hello%'
  )
)
```

### Advanced queries with functions (not just columns)

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

Keep in mind, the provided range value can [define the bound inclusion/exclusion](../other-topics/other-data-types.mdx#ranges-postgresql-only) as well.

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
const { Sequelize, Op } = require('@sequelize/core');

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
