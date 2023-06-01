---
sidebar_position: 8
title: Raw SQL (literals)
---

We believe that ORMs are inherently leaky abstractions. They are a compromise between the flexibility of SQL and the convenience of an object-oriented programming language.
As such, it does not make sense to try to provide a 100% complete abstraction over SQL (which could easily be more difficult to read than the SQL itself).

For this reason, Sequelize treats raw SQL as a first-class citizen. __You can use raw SQL almost anywhere in Sequelize__[^1], and thanks to the `sql` tag, it's
easy to write SQL that is both safe, readable and reusable.

## Writing raw SQL

The `sql` tag is a template literal tag that allows you to write raw SQL:

```typescript
import { sql } from '@sequelize/core';

const id = 5;

await sequelize.query(sql`SELECT * FROM users WHERE id = ${id}`);
```

As indicated above, raw SQL can be used almost anywhere in Sequelize. For instance, here is one way to use raw SQL to customize the `WHERE` clause of a `findAll` query:

```typescript
import { sql } from '@sequelize/core';

const id = 5;

const users = await User.findAll({
  where: sql`id = ${id}`,
});
```

In the above example, we used a variable in our raw SQL. Thanks to the `sql` tag, Sequelize will automatically escape that variable to remove any risk of SQL injection.

Sequelize supports two different ways to pass variables in raw SQL: __Replacements__ and __Bind Parameters__.  
Replacements and bind parameters are available in all querying methods, and can be used together in the same query.

### Replacements

Replacements are a way to pass variables in your Query. They are an alternative to [Bind Parameters](#bind-parameters).

The difference between replacements and bind parameters is that replacements are escaped and inserted into the query by Sequelize before the query is sent to the database,
whereas bind parameters are sent to the database separately from the SQL query text, and 'escaped' by the Database itself.

Replacements can be written in three different ways:

- By using the `sql` tag when the [query is in _replacement_ mode](#query-variable-mode)
- By using numeric identifiers (represented by a `?`) in the query. The `replacements` option must be an array. The values will be replaced in the order in which they appear in the array and query.
- Or by using alphanumeric identifiers (e.g. `:firstName`, `:status`, etc…). These identifiers follow common identifier rules (alphanumeric & underscore only, cannot start with a number). The `replacements` option must be a plain object which includes each parameter (without the `:` prefix).

The `replacements` option must contain all bound values, or Sequelize will throw an error.

#### Examples

```js
import { QueryTypes } from '@sequelize/core';

// This query use positional replacements
await sequelize.query(
  'SELECT * FROM projects WHERE status = ?',
  {
    replacements: ['active'],
  },
);

// This query uses named replacements
await sequelize.query(
  'SELECT * FROM projects WHERE status = :status',
  {
    replacements: { status: 'active' },
  },
);

// This query use replacements added by the sql tag
await sequelize.query(
  sql`SELECT * FROM projects WHERE status = ${'active'}`,
);

// Replacements are also available in other querying methods
await Project.findAll({
  where: {
    status: sql`:status`
  },
  replacements: { status: 'active' },
});
```

### Bind Parameters

Bind parameters are a way to pass variables in your Query. They are an alternative to [Replacements](#replacements).

The difference between replacements and bind parameters is that replacements are escaped and inserted into the query by Sequelize before the query is sent to the database,
whereas bind parameters are sent to the database separately from the SQL query text, and 'escaped' by the Database itself.

A query can have both bind parameters and replacements.

Each database uses a different syntax for bind parameters, but Sequelize provides its own unification layer.  

Inconsequentially to which database you use, in Sequelize bind parameters are written following a postgres-like syntax. You can either:

- By using the `sql` tag when the [query is in _bind parameter_ mode](#query-variable-mode)
- Use numeric identifiers (e.g. `$1`, `$2`, etc…). Note that these identifiers start at 1, not 0. The `bind` option must be an array which contains a value for each identifier used in the query (`$1` is bound to the 1st element in the array (`bind[0]`), etc…).
- Use alphanumeric identifiers (e.g. `$firstName`, `$status`, etc…). These identifiers follow common identifier rules (alphanumeric & underscore only, cannot start with a number). The `bind` option must be a plain object which includes each bind parameter (without the `$` prefix).

The `bind` option must contain all bound values, or Sequelize will throw an error.

:::info

Bind Parameters can only be used for data values. Bind Parameters cannot be used to dynamically change the name of a table, a column, or other non-data values parts of the query,
but you can use [`sql.attribute`](#sqlattribute), and [`sql.identifier`](#sqlidentifier) for that.

Your database may have further restrictions with bind parameters.

:::

#### Examples

```js
import { QueryTypes } from '@sequelize/core';

// This query use positional bind parameters
await sequelize.query(
  'SELECT * FROM projects WHERE status = $1',
  {
    bind: ['active'],
    type: QueryTypes.SELECT,
  },
);

// This query uses named bind parameters
await sequelize.query(
  'SELECT * FROM projects WHERE status = $status',
  {
    bind: { status: 'active' },
    type: QueryTypes.SELECT,
  },
);

// Bind parameters are also available in other querying methods
await Project.findAll({
  where: {
    status: sql`$status`
  },
  bind: { status: 'active' },
});
```

Sequelize does not currently support a way to [specify the DataType of a bind parameter](https://github.com/sequelize/sequelize/issues/14410).  
Until such a feature is implemented, you can cast your bind parameters if you need to change their DataType:

```js
import { QueryTypes } from '@sequelize/core';

await sequelize.query(
  'SELECT * FROM projects WHERE id = CAST($1 AS int)',
  {
    bind: [5],
    type: QueryTypes.SELECT,
  },
);
```

:::note Did you know?

Some dialects, such as PostgreSQL and IBM Db2, support a terser cast syntax that you can use if you prefer:

```typescript
await sequelize.query('SELECT * FROM projects WHERE id = $1::int');
```

:::

### ⚠️ Don't put parameters in strings

Never put parameters in strings, __including postgres dollar-quoted strings__, as this can very easily lead to SQL injection attacks.

You may be tempted to use parameters inside something like `DO` blocks,
and it is a common misconception that you can safely use replacements or bind parameters inside dollar-quoted strings, but that is not the case.

For this reason, if you use the `?`, `$bind` or `:replacements` syntax, Sequelize will not consider these tokens as parameters if they are inside a string or an identifier.

However, when using the `sql` tag, Sequelize gives you full control, and you are responsible for ensuring that your query is safe.

Here is an example of a query that is vulnerable to SQL injection:

```ts
const id = '$$';

sequelize.query(
  sql`
DO $$
DECLARE r record;
BEGIN
  SELECT * FROM users WHERE id = ${id};
END
$$;
  `
);
```

The above query looks like code, has syntax coloring that makes it look like code, but is really a regular dollar-quoted string 
that will be interpreted as SQL by the `DO` clause (similarly to `eval` in JavaScript).

Dollar-quoted strings end as soon as `$$` is encountered. If the user passes `$$` as the `id` parameter, the query will end early and will
at best be invalid SQL, and at worst will allow the user to execute arbitrary SQL.

```sql
DO $$
DECLARE r record;
BEGIN
  SELECT * FROM users WHERE id = '$$';
  --                              ^ the contents of the DO clause ends here
END
$$;
```

### Query Variable Mode

While bind parameters written using the `$` syntax, and replacements written using the `:` and `?` syntaxes, will always be interpreted as
bind parameters and replacements respectively, variables inserted in an `sql`-tagged template literal can be interpreted as bind parameters or replacements depending on the __Query Variable Mode__.

It is not currently possible to configure that mode per query (this feature is planned for a future release). Instead, the mode
is pre-determined by the method used to execute the query:

- `Model.insert`, `Model.destroy` and `Model.update` are in "bind parameter" mode.
- All other methods are in "replacement" mode.

This means that, for instance, variables used in `findAll` will be added to the query as replacements:

```ts
const fundingStatus = 'funded';

await Project.findAll({
  where: and(
    { status: 'active' },
    sql`funding = ${fundingStatus}`,
  ),
});
```

```sql
SELECT * FROM projects WHERE status = 'active' AND funding = 'funded'
```

Whereas variables used in `update` will be added to the query as bind parameters:

```ts
const fundingStatus = 'funded';

await Project.update(
  { funding: 'pending' },
  {
    where: and(
      { status: 'active' },
      sql`funding = ${fundingStatus}`,
    ),
  },
);
```

```sql
UPDATE projects SET funding = $1 WHERE status = $2 AND funding = $3
```

### `sql.identifier`

The `sql.identifier` function can be used to escape the name of an identifier (such as a table or column name) in a query.

```js
import { sql } from '@sequelize/core';

await sequelize.query(
  sql`SELECT * FROM ${sql.identifier('projects')}`,
);
```

```sql
-- The identifier quotes are dialect-specific, this is an example for PostgreSQL
SELECT * FROM "projects"
```

### `sql.list`

When using an array as a variable in a query, Sequelize will by default treat it as an SQL array:

```ts
const statuses = ['active', 'pending'];

await sequelize.query(
  sql`SELECT * FROM projects WHERE status = ANY(${statuses})`,
);
```

```sql
SELECT * FROM projects WHERE status = ANY(ARRAY['active', 'pending'])
```

The `sql.list` function can be used to tell Sequelize to treat the value as an SQL list instead:

```ts
const statuses = ['active', 'pending'];

await sequelize.query(
  sql`SELECT * FROM projects WHERE status IN ${sql.list(statuses)}`,
);
```

```sql
SELECT * FROM projects WHERE status IN ('active', 'pending')
```

:::caution

When using `sql.list` make sure that the array contains at least one value, otherwise `()` will be used as the list, which is invalid SQL.

Read more about this in [#15142](https://github.com/sequelize/sequelize/issues/15142)

:::

### `sql.where`

The `sql.where` function can be used to generate an SQL condition from a JavaScript object, using the same syntax as the [`where` option of the `findAll` method](./select-in-depth.md#applying-where-clauses).

```ts
const where = {
  status: 'active',
  funding: 'funded',
};

await sequelize.query(
  sql`SELECT * FROM projects WHERE ${sql.where(where)}`,
);
```

```sql
SELECT * FROM projects WHERE status = 'active' AND funding = 'funded'
```

It can also be used to generate an SQL condition where the left operand is something other than an attribute name:

```ts
Post.findAll({
  where: sql.where(
    new Date('2012-01-01'),
    Op.between,
    [sql.attribute('createdAt'), sql.attribute('publishedAt')]
  ),
});
```

```sql
-- The left operand is a literal value, and the right operands are column names
-- Something that is not possible to do with the POJO where syntax.
SELECT * FROM "projects" WHERE '2012-01-01' BETWEEN "createdAt" AND "publishedAt"
```

### `sql.attribute`

The `sql.attribute` function can be used to reference the name of a Model attribute. It is similar to the [`sql.identifier`](#sqlidentifier) function, 
but the name of the attribute will be mapped to the name of the column, whereas `sql.identifier` escapes its value as-is:

```ts
class User extends Model {
  @Attribute({
    type: DataTypes.STRING,
    columnName: 'first_name',
  })
  declare firstName: string;
}

User.findAll({
  where: sql.where(
    // highlight-next-line
    sql.attribute('firstName'),
    Op.eq,
    'John',
  ),
});
```

```sql
SELECT * FROM "users" WHERE "first_name" = 'John'
```

:::caution

Sequelize is only able to map the attribute name to the column name if it's aware of the Model.
This is typically the case for model methods, but is not the case for `sequelize.query`.

:::

On top of this mapping, `sql.attribute` also supports the entire range of the attribute syntax. This means that it's possible to:

#### Use the association reference syntax

When [eager loading associated models](./select-in-depth.md#eager-loading-include), you can reference includes using the association reference syntax.

The name of the association must start & end with a `$` character, and the name of the attribute must be separated from the association name with a `.` character.

```ts
User.findAll({
  include: [{
    association: User.associations.posts,
    where: sql.where(
      // highlight-next-line
      sql.attribute('$user$.name'),
      Op.eq,
      'Zoe',
    ),
  }],
});
```

#### Use the Casting Syntax

You can use the `::` syntax to cast the attribute to a different type, just like in [POJO attributes](./select-in-depth.md#casting)

```ts
User.findAll({
  where: sql.where(
    // highlight-next-line
    sql.attribute('createdAt::text'),
    Op.like,
    '2012-%',
  ),
});
```

#### Use the JSON Extraction syntax

You can use the JSON extraction syntax to access JSON properties, just like in [POJO attributes](./select-in-depth.md#json-extraction)

```ts
User.findAll({
  where: sql.where(
    // This will access the property `name` of the JSON column `data`
    // highlight-next-line
    sql.attribute('data.name'),
    Op.eq,
    'John',
  ),
});
```

### `sql.cast`

The `sql.cast` function can be used to cast a value to the type of your choice:

```ts
User.findAll({
  where: sql.where(
    // highlight-next-line
    sql.cast(sql.attribute('createdAt'), 'text'),
    Op.like,
    '2012-%',
  ),
});
```

```sql
SELECT * FROM "users" WHERE CAST("createdAt" AS text) LIKE '2012-%'
```

It's also possible to use a Sequelize DataType as the type:

```ts
User.findAll({
  where: sql.where(
    // highlight-next-line
    sql.cast(sql.attribute('createdAt'), DataTypes.TEXT),
    Op.like,
    '2012-%',
  ),
});
```

:::info

Attributes support a shorthand syntax for casting. See [Casting syntax in `sql.attribute`](#use-the-casting-syntax) and [Casting Syntax in POJOs](./select-in-depth.md#casting) for more information.

:::

### `sql.col`

:::caution

This function is available for backwards compatibility, and there are currently no plans to deprecate it, 
but it is not recommended to use in new code. Prefer instead to use [`sql.attribute`](#sqlattribute), [`sql.identifier`](#sqlidentifier),
and the `sql` template tag.

:::

This function is a third way to reference a column name. It's similar to [`sql.identifier`](#sqlidentifier), but gives special meaning to the `*` characters.

Here are a few examples:

| Input     | `sql.col`   | `sql.identifier` |
|-----------|-------------|------------------|
| `*`       | `*`         | `"*"`            |
| `users.*` | `"users".*` | `"users.*"`      |

Unlike [`sql.attribute`](#sqlattribute), this method does not support any other special syntax, and does not map its input to a column name.

### `sql.jsonPath`

This function can be used to extract a JSON property from a JSON value

```ts
sequelize.query(sql`
  SELECT ${sql.jsonPath(sql.identifier('data'), ['addresses', 0, 'country'])} AS country
  FROM users
`);
```

```sql
-- postgres
SELECT data#>ARRAY['addresses', '0', 'country'] AS country FROM users
-- other dialects
SELECT JSON_EXTRACT(data, '$.addresses[0].country') AS country FROM users
```

This can be useful to generate a JSON extraction query dynamically in a safe way.

The JSON Path array accepts a mix of strings and numbers. If a string is used, it will be treated as a property name (used to access an object property).
If a number is used, it will be treated as an index (used to access an array element).

Make sure to use the correct type for your use case, as using the string `'0'` will try to access the property named `'0'` instead of the first element of the array.

Read more about this feature in the [JSON Extraction](./select-in-depth.md#json-extraction) chapter.

:::info

Attributes support a shorthand syntax for JSON extraction. See [Casting syntax in `sql.attribute`](#use-the-json-extraction-syntax) for more information.

:::

### `sql.unquote`

The `sql.unquote` function is used to execute the `JSON_UNQUOTE` (or equivalent) function on a JSON value:

```ts
sequelize.query(sql`
  SELECT ${sql.unquote(sql.jsonPath(sql.identifier('data'), ['addresses', 0, 'country']))} AS country
  FROM users
`);
```

```sql
-- postgres (the #>> operator unquotes, unlike the #> operator)
SELECT data#>>ARRAY['addresses', '0', 'country'] AS country FROM users
-- other dialects
SELECT JSON_UNQUOTE(JSON_EXTRACT(data, '$.addresses[0].country')) AS country FROM users
```

Read more about this feature in the [JSON Extraction](./select-in-depth.md#json-extraction) chapter.

### `sql.fn`

This function exists for backwards compatibility with older versions of Sequelize but is not recommended for new code, as `sql` can be used to write
SQL functions in a more natural way.

For instance, the old way of writing a `lower` function would be:

```ts
sql.fn('LOWER', sql.attribute('name'));
```

And can now be written as:

```ts
sql`LOWER(${sql.attribute('name')})`;
```

Both result in

```sql
LOWER("name")
```

## `sequelize.query`

As there are often use cases in which it is just easier to execute raw / already prepared SQL queries, you can use the [`sequelize.query`](pathname:///api/v7/classes/_sequelize_core.index.Sequelize.html#query) method.

By default the function will return two arguments - a results array, and an object containing metadata (such as amount of affected rows, etc). Note that since this is a raw query, the metadata are dialect specific. Some dialects return the metadata "within" the results object (as properties on an array). However, two arguments will always be returned, but for MSSQL and MySQL it will be two references to the same object.

```js
const [results, metadata] = await sequelize.query("UPDATE users SET y = 42 WHERE x = 12");
// Results will be an empty array and metadata will contain the number of affected rows.
```

:::warning

When interpolating variables in your query, make absolutely sure that you are tagging your query with the `sql` tag. `sequelize.query` is
one of the few functions that will interpret plain strings as raw SQL, so forgetting to tag your query with `sql` can lead to SQL injection vulnerabilities:

```ts
// Dangerous
await sequelize.query(`SELECT * FROM users WHERE first_name = ${firstName}`);

// Safe
await sequelize.query(sql`SELECT * FROM users WHERE first_name = ${firstName}`);
```

All other functions that accept raw SQL will throw an error if you use a string that has not been tagged with `sql`.

This footgun may be removed in a future version of Sequelize.

:::

In cases where you don't need to access the metadata you can pass in a query type to tell sequelize how to format the results. For example, for a simple select query you could do:

```js
import { QueryTypes } from '@sequelize/core';
const users = await sequelize.query("SELECT * FROM `users`", { type: QueryTypes.SELECT });
// We didn't need to destructure the result here - the results were returned directly
```

Several other query types are available. [Peek into the source for details](https://github.com/sequelize/sequelize/blob/main/packages/core/src/query-types.ts).

A second option is the model. If you pass a model the returned data will be instances of that model.

```js
// Callee is the model definition. This allows you to easily map a query to a predefined model
const projects = await sequelize.query('SELECT * FROM projects', {
  model: Projects,
  mapToModel: true // pass true here if you have any mapped fields
});
// Each element of `projects` is now an instance of Project
```

See more options in the [query API reference](pathname:///api/v7/classes/_sequelize_core.index.Sequelize.html#query). Some examples:

```js
import { QueryTypes } from '@sequelize/core';
await sequelize.query('SELECT 1', {
  // A function (or false) for logging your queries
  // Will get called for every SQL query that gets sent
  // to the server.
  logging: console.log,

  // If plain is true, then sequelize will only return the first
  // record of the result set. In case of false it will return all records.
  plain: false,

  // Set this to true if you don't have a model definition for your query.
  raw: false,

  // The type of query you are executing. The query type affects how results are formatted before they are passed back.
  type: QueryTypes.SELECT
});

// Note the second argument being null!
// Even if we declared a callee here, the raw: true would
// supersede and return a raw object.
console.log(await sequelize.query('SELECT * FROM projects', { raw: true }));
```

### "Dotted" attributes and the `nest` option

If an attribute name of the table contains dots, the resulting objects can become nested objects by setting the `nest: true` option. This is achieved with [dottie.js](https://github.com/mickhansen/dottie.js/) under the hood. See below:

* Without `nest: true`:

  ```js
  import { QueryTypes } from '@sequelize/core';
  const records = await sequelize.query('select 1 as `foo.bar.baz`', {
    type: QueryTypes.SELECT
  });
  console.log(JSON.stringify(records[0], null, 2));
  ```

  ```json
  {
    "foo.bar.baz": 1
  }
  ```

* With `nest: true`:

  ```js
  import { QueryTypes } from '@sequelize/core';
  const records = await sequelize.query('select 1 as `foo.bar.baz`', {
    nest: true,
    type: QueryTypes.SELECT
  });
  console.log(JSON.stringify(records[0], null, 2));
  ```

  ```json
  {
    "foo": {
      "bar": {
        "baz": 1
      }
    }
  }
  ```

[^1]: If you need to use raw SQL in a place that sequelize does not support, do not hesitate to open a feature request or a pull request.
