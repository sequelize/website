---
title: Upgrade to v7
---

Sequelize v7 is the next major release after v6. Below is a list of breaking changes to help you upgrade.

:::info

Upgrading from Sequelize v5? [Check out our 'Upgrade to v6' guide](/docs/v6/other-topics/upgrade) first!

:::

## Main Breaking Changes

### Main project renamed to @sequelize/core

Starting with Sequelize v7, we are introducing scoped modules and renamed the following projects:

- The former `sequelize` module is now available under `@sequelize/core`.

As a result, you now use Sequelize as follows:

```javascript
import { Sequelize } from '@sequelize/core';
const sequelize = new Sequelize({ dialect: 'sqlite' });

await sequelize.authenticate();
```

### Minimum supported engine versions

Sequelize v7 only supports the versions of Node.js, and databases that were not EOL at the time of release.[^issue-1]  
Sequelize v7 also supports versions of TypeScript that were released in the past year prior to the time of release.

This means Sequelize v7 supports **>=16.0.0**, and **TypeScript >= 4.7**.

Head to our [Versioning Policy page](/releases) to see exactly which databases are supported by Sequelize v7.

[^issue-1]: https://github.com/sequelize/meetings/issues/5

### Blocking access to `/lib`

*Pull Request [#14352]*

Sequelize v7 restricts which files can be imported. Going forward, the only modules which can be imported are:

- `@sequelize/core`
- `@sequelize/core/package.json`

Trying to import any other file, generally from `/lib`, will cause an error.  
This change was made because these files were considered to be internal APIs and their behavior can drastically change from
one non-major release to the other, as long as the APIs exposed by `@sequelize/core` stay stable.

If you need access to Sequelize's internal code, [open a feature request](https://github.com/sequelize/sequelize/issues) describing your use case.

As a **last** resort, you can still voluntarily choose to import our internal code by importing the `_non-semver-use-at-your-own-risk_` folder:

```typescript
// do *not* do this unless you know what you're doing
import { Model } from '@sequelize/core/_non-semver-use-at-your-own-risk_/model.js';
```

If you do that, we recommend pinning the Sequelize version your project uses as **breaking changes can be introduced in these files** in any new release of Sequelize, including patch.

### CLS Transactions

*Pull Request [#15292]*

:::info

[CLS Transactions](../querying/transactions.md#disabling-cls) are now enabled by default.
You can use the [`disableClsTransactions`](pathname:///api/v7/interfaces/_sequelize_core.index.Options.html#disableClsTransactions) global option to disable them.

:::

Sequelize's CLS implementation has been migrated to use Node's built-in AsyncLocalStorage. This means you do not need to install the `continuation-local-storage` or `cls-hooked` packages anymore,
and that the `Sequelize.useCLS` method has been removed.

### Unmanaged transactions

*Pull Request [#15292](https://github.com/sequelize/sequelize/pull/15292)*

In order to discourage [unmanaged transactions](../querying/transactions.md#unmanaged-transactions), which we consider to be error-prone, `sequelize.transaction()` cannot be used to create unmanaged transactions anymore.
You must use `sequelize.startUnmanagedTransaction()` for that.
[Managed transactions](../querying/transactions.md#managed-transactions-recommended) continue to use `sequelize.transaction()`.

### `$bind` parameters in strings must not be escaped anymore

*Pull Request [#14447]*

Sequelize 6 would treat any piece of text looking like a `$bind` parameter as a bind parameter, 
even if it were located in places bind parameters cannot be used like inside a string or a comment. Causing it to mangle strings.

As a way to bypass this issue, Sequelize 6 required [escaping bind parameters](/docs/v6/core-concepts/raw-queries/#bind-parameter) 
that should not be transformed by adding a second $ character (`$$bind`). Sequelize would then unescape it for you back to `$bind`.

Sequelize 7 uses a smarter way of parsing bind parameters that knows whether the piece of text is a valid bind parameter.
As a result it is not necessary to escape these bind parameters anymore, or you will end up with an extra $ character in your string.

Example 1 (mysql):

```typescript
const result = await this.sequelize.query(`select * from users WHERE id = '$$one'`);
```

```sql
-- in v6, the above SQL was transformed into:
SELECT * FROM users WHERE id = '$one';

-- in v7, the above SQL is left untouched:
SELECT * FROM users WHERE id = '$$one';
```

Example 2 (mysql):

```typescript
const result = await this.sequelize.query(`select * from users WHERE id = '$one'`);
```

```sql
-- in v6, the above SQL was transformed into:
SELECT * FROM users WHERE id = '?';

-- in v7, the above SQL is left untouched:
SELECT * FROM users WHERE id = '$one';
```

Bind parameters are still transformed in the corresponding dialect-specific syntax where it would make sense, so the following:

```typescript
const result = await this.sequelize.query(`select * from users WHERE id = $id`);
```

Will still be transformed into the following in both v6 and v7:

```sql
SELECT * FROM users WHERE id = ?;
```

### DataTypes rewrite

*Pull Request [#14505]*

As part of our migration to TypeScript, Data Types have been completely rewritten to be more TypeScript-friendly, 
and make them more powerful.

If you have written custom data types, you will need to rewrite them to use the new API. All methods have been renamed,
and new ones have been added. You can find the new API in the [Custom Data Types documentation](./extending-data-types.md).

Other changes:

- Which SQL Data Type corresponds to each Sequelize Data Type has also been changed. Refer to [our list of Data Types](../models/data-types.mdx) for an up-to-date description.
- Type validation is now enabled by default. The `typeValidation` sequelize option has been renamed to `noTypeValidation`.
- Integer Data Types will throw an error if they receive a JavaScript number bigger than `MAX_SAFE_INTEGER` or smaller than `MIN_SAFE_INTEGER`.
- `DataTypes.NUMERIC` has been removed, use `DataTypes.DECIMAL` instead.
- `DataTypes.NUMBER` has been removed (it had no real use).
- `DataTypes['DOUBLE PRECISION']` has been removed, use `DataTypes.DOUBLE` instead.
- `DataTypes.JSONTYPE` has been removed, use `DataTypes.JSON` instead.
- Dates are now returned as strings instead of JavaScript dates if no Sequelize Data Type is associated to that column.
  This is usually the case when executing raw queries without specifying a model, or when the attribute does not have a corresponding attribute in the model definition.
- `DataTypes.BOOLEAN` only accepts `true` & `false` (and `null` for nullable columns).
- String DataTypes (`STRING`, `CITEXT`, `TEXT`, `CHAR`) only accept strings. Other values will not be stringified anymore.
- `DataTypes.DECIMAL` is now intended to be an "unconstrained decimal", and throws in dialects that do not support such a Data Type.
- `DataTypes.FLOAT(precision)` has been removed. It used to be a way to select between single-precision floats & double-precision floats. You must now use `DataTypes.FLOAT` and `DataTypes.DOUBLE`
- `DataTypes.DECIMAL`, `DataTypes.DOUBLE` and `DataTypes.FLOAT` now throw if the `precision` parameter is set, but not the `scale` parameter.
- `DataTypes.BIGINT` and `DataTypes.DECIMAL` values are always returned as strings instead of JS numbers.
- `DataTypes.CHAR.BINARY` and `DataTypes.STRING.BINARY` now mean "chars with a binary collation" and throw in dialects that do not support collations.
- **SQLite**: All Data Types are now named after one of the [6 strict data types](https://www.sqlite.org/stricttables.html).
- **SQLite**: `DataTypes.CHAR` has been removed, as SQLite doesn't provide a fixed-length `CHAR` type. 
- **SQL Server**: `DataTypes.UUID` now maps to `UNIQUEIDENTIFIER` instead of `CHAR(36)`.

### Cannot define values of `DataTypes.ENUM` separately

The "values" property has been removed from column definitions. The following is no longer supported:

```typescript
sequelize.define('MyModel', {
  roles: { 
    type: DataTypes.ENUM,
    values: ['admin', 'user'],
  },
});
```

Instead, specify enum values like this:

```typescript
sequelize.define('MyModel', {
  roles: {
    type: DataTypes.ENUM(['admin', 'user']),
  },
});
```

### `DataTypes.DATE` date parsing

When using strings instead of `Date` instances with `DataTypes.DATE`, Sequelize parses that string into a `Date` for you. This means the following query is valid:

```ts
const MyModel = sequelize.define('MyModel', {
  date: DataTypes.DATE,
});

await MyModel.findOne({ where: { date: '2022-11-06T00:00:00Z' } });
```

In Sequelize 6, an input such as `2022-11-06` was parsed as local time. If your server's timezone were GMT+1, that input would have resulted in `2022-11-05T23:00:00.000Z`.

Starting with Sequelize 7, that input is parsed as UTC and results in `2022-11-06T00:00:00.000Z` no matter the timezone of your server.

### Associations names are now unique

*Pull Request [#14280]*

This is a minor change, but trying to define two associations with the same name will now throw:

```typescript
Project.belongsTo(User, { as: 'owner' });
Project.belongsTo(User, { as: 'owner' });
```

Doing this was already very broken in v6 because the association methods added to `Project`, such as `project.getOwner`,
belonged to the first association, while [`Project.associations.owner`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#associations) was equal to the second association.

### Association resolution in `include`

*Pull Request [#14280]*

In Sequelize v6, these two were considered to be different associations:

```typescript
User.hasMany(Project, { as: 'projects' });
User.hasMany(Project);
```

And you could distinguish them when eager-loading them by specifying the [`as`](pathname:///api/v7/interfaces/_sequelize_core.index.IncludeOptions.html#as) option in your [`include`](pathname:///api/v7/interfaces/_sequelize_core.index.FindOptions.html#include) too:

```typescript
await User.findAll({
  include: [{
    model: Project,
    as: 'projects',
  }, {
    model: Project,
  }],
})
```

This caused issues, because they still shared the same association name.
Resulting in inconsistent values for [`User.associations.projects`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#associations), and association mixin methods (e.g. `user.getProjects()`).
Both would also try to eager-load under the same key.

In Sequelize v7, the [`as`](pathname:///api/v7/interfaces/_sequelize_core.index.IncludeOptions.html#as) parameter now defaults to the plural name of the target model (in this scenario, `projects`) for multi associations (`hasMany`, `belongsToMany`), 
and the singular name of the model otherwise.

As a consequence, how `include` is resolved has changed too: 
You can only omit the [`as`](pathname:///api/v7/interfaces/_sequelize_core.index.IncludeOptions.html#as) parameter if no more than one association has been defined between the two models.

This change also means that the [`include.association`](pathname:///api/v7/interfaces/_sequelize_core.index.IncludeOptions.html#association) option is the best way to specify
your association, and we recommend always using it over a combination of `as` + `model`. `as` has also been deprecated in favor of `association`.

```typescript
// Don't use `as` or `model`, use this instead:
await User.findAll({
  include: [User.associations.projects],
});

// Or provide the name of the association as a string:
await User.findAll({
  include: ['projects'],
});

// If you need to specify more options:
await User.findAll({
  include: [{
    association: 'projects',
  }],
});
```

### Bidirectional Association Options

*Pull Request [#14280]*

In Sequelize 6, associations are a bit fuzzy: 
Defining an association on both sides of the association would attempt to merge and reconcile their options.

The problem is that if the options did not perfectly match,
you could end up with different behaviors based on which association was declared first.
Something that can happen easily if both associations are declared in different files, 
as the declaration order would be different based on which file was loaded first.

This lead to subtle bugs, so starting with v7, associations options must perfectly match both sides or Sequelize will emit an error.

For instance, the following declaration is no longer valid:

```typescript
User.belongsToMany(Country, { foreignKey: 'user_id' });
Country.belongsToMany(User);
```

But this is:

```typescript
User.belongsToMany(Country, { foreignKey: 'user_id' });
Country.belongsToMany(User, { otherKey: 'user_id' });
```

This requirement increases the verbosity of your associations, 
se we introduced a new option to solve that problem: [`inverse`](pathname:///api/v7/interfaces/_sequelize_core.index.BelongsToOptions.html#inverse#inverse). 
This option lets you define both sides of the association at the same time.
This removes the need to repeat options that are common to both associations.

Instead of writing this:

```typescript
User.belongsToMany(Country, { as: 'countries' });
Country.belongsToMany(User, { as: 'citizens' });
```

You can now write this:

```typescript
User.belongsToMany(Country, { 
  as: 'countries',
  inverse: { as: 'citizens' },
});
```

### Changes to `sequelize.sync`

*Pull Request [#14619]*

- DB2 does not force all indexes to be unique anymore (this was a bug)
- When using DB2, we do not force columns that are part of an index to be non-null.
  The database still requires this to be the case, but we don't do it silently for you anymore.
- A few bugs in how indexes were named have been fixed. This means your index names could change.

### Attributes are always escaped

*Pull Request [#15374]*

In Sequelize 6, some attributes specified in the finder (`findAll`, `findOne`, etc…) "attributes" option had special meaning and were not escaped.

For instance, the following query:

```ts
await User.findAll({
  attributes: [
    '*',
    'a.*',
    ['count(id)', 'count'],
  ]
});
```

Would produce the following SQL:

```sql
SELECT *, "a".*, count(id) AS "count" FROM "users"
```

Starting with v7, it will produce the following SQL:

```sql
SELECT "*", "a.*", "count(id)" AS "count" FROM "users"
```

This was done to improve the security of Sequelize, by reducing the attack surface of the ORM. 
The previous behavior is still available, but you need to explicitly opt-in to it by using the [`literal`](pathname:///api/v7/variables/_sequelize_core.index.sql.literal.html), 
[`col`](pathname:///api/v7/variables/_sequelize_core.index.sql.col.html) or [`fn`](pathname:///api/v7/variables/_sequelize_core.index.sql.fn.html) functions:

```ts
User.findAll({
  attributes: [
    sql.col('*'),
    sql.col('a.*'),
    [sql`count(id)`, 'count'],
  ],
});
```

### Instance methods cannot be used without primary key.

*Pull Request [#15108]*

Model instance methods `save`, `update`, `reload`, `destroy`, `restore`, `decrement`, and `increment` cannot be used anymore 
if the model definition does not have a primary key, or if the primary key was not loaded.

Sequelize used to include a hack to allow you to call these methods even if your model did not have a primary key. 
This hack was not reliable and using it could lead to your data being corrupted. We have removed it.

If you wish to use these methods but your model definition does not have a primary key, you can use their static version instead.

### `Op.not` always produces `NOT (x)` instead of `<> x` or `IS NOT x`

*Pull Request [#15598]*

In Sequelize 6, the `Op.not` operator would produce `<> x`, `IS NOT x` or `NOT (x)` depending on the type of the value.

Starting with Sequelize 7, it will always produce `NOT (x)`. You need to use `Op.isNot` and `Op.ne` if you want to produce `IS NOT x` and `<> x` respectively:

While this is a breaking change, your queries should remain valid as writing `{ [Op.not]: 1 }` 
will be interpreted as `{ [Op.not]: { [Op.eq]: 1 } }` and will result in `NOT (x = 1)` instead of `x != 1`,
and writing `{ [Op.not]: null }` will be interpreted as `{ [Op.not]: { [Op.is]: null } }` 
and will result in `NOT (x IS NULL)` instead of `x IS NOT NULL`.

### Removed string-based operators

*Pull Request [#15598]*

The `where()` function used to accept string-based operators, such as `where(col('name'), 'LIKE', 'foo')`.

This syntax has been removed in Sequelize 7. You need to use the `Op` object instead:

```ts
sql.where(sql.attribute('name'), Op.like, 'foo');
```

This change was made because how values are escaped depends on the operator, and the string-based syntax did not allow us to do that.

You can still use the string-based syntax if you wish, but you need to use the `sql` template tag instead:

```ts
import { Expression, Literal, sql } from '@sequelize/core';

function myCustomLikeOperator(left: Expression, right: Expression): Literal {
  return sql`${left} LIKE ${right}`;
}

User.findAll({
  where: myCustomLikeOperator(sql.attribute('firstName'), '%zoe%'),
});
```

### JSON extraction does not unquote by default

*Pull Request [#15598]*

In Sequelize 6, doing [JSON extraction](../../versioned_docs/version-6.x.x/other-topics/other-data-types.mdx#json-sqlite-mysql-mariadb-oracle-and-postgresql-only) would unquote the value by default.
This was convenient as it was easy to use text-based operators such as `LIKE` or `IN` with the extracted value, but made it difficult to use JSONB operators such as `?` or `?|`.

Starting with Sequelize 7, JSON extraction does not unquote the value by default. You need to use the `unquote` modifier to unquote the value:

```ts
// Sequelize 6
User.findAll({
  where: {
    jsonAttribute: {
      firstName: {
        [Op.like]: '%zoe%',
      },
    },
  },
});

// Sequelize 7
User.findAll({
  where: {
    jsonAttribute: {
      'firstName:unquote': {
        [Op.like]: '%zoe%',
      },
    },
  },
});
```

This `:unquote` modifier is also available on the top-level value itself, not just values extracted from it.

This change makes it possible to use JSON operators with JSON extraction, which was simply not possible in Sequelize 6:

```ts
User.findAll({
  where: {
    jsonAttribute: {
      address: {
        // This is the postgres JSONB ?& operator.
        [Op.hasAllKeys]: ['street', 'city'],
      },
    },
  },
});
```

### Array replacements are treated as SQL arrays instead of SQL lists

*Pull Request [#15598]*

In Sequelize 6, using a JS array in a replacement was treated as an SQL list, but as SQL arrays in bind parameters.
Using an SQL array in a replacement required ugly workarounds.

In Sequelize 7, we have unified the behavior of bind parameters & replacements, and now both use SQL arrays by default.

You can still use SQL lists by using the `sql.list` function:

```ts
sequelize.query('SELECT * FROM users WHERE id = ANY(:ids)', {
  replacements: {
    ids: [1, 2, 3],
  },
});
```

Will produce

```sql
SELECT * FROM users WHERE id = ANY(ARRAY[1, 2, 3])
```

Whereas this:

```ts
import { sql } from '@sequelize/core';

sequelize.query('SELECT * FROM users WHERE id IN :ids', {
  replacements: {
    ids: sql.list([1, 2, 3]),
  },
});
```

Will produce

```sql
SELECT * FROM users WHERE id IN (1, 2, 3)
```

:::caution

`sql.list` can be used with bind parameters, but it is not recommended as it will produce a new query every time the length of your list changes:

```ts
sequelize.query('SELECT * FROM users WHERE id IN $ids', {
  bind: {
    ids: sql.list([1, 2, 3]),
  },
});
```

Will produce

```sql
-- The bind parameter syntax changes depending on the dialect, they are represented here as "?"
-- As you can see, this produced 3 bind parameters, one for each value in the list
SELECT * FROM users WHERE id IN (?, ?, ?)
```

:::

### `where` doesn't accept primitives anymore

*Pull Request [#15598]*

In Sequelize 6, you could set the value of a `where` condition to a primitive, and Sequelize would assume you
meant to compare it to the primary key of the model:

```ts
User.findAll({
  where: 1,
});
```

Would produce

```sql
SELECT * FROM users WHERE id = 1
```

This behavior has been removed in Sequelize 7 as it was undocumented and redundant with `findByPk`. You should
either use `findByPk` or use specify the attribute you want to compare to:

```ts
User.findAll({
  where: {
    id: 1,
  },
});

// or

User.findByPk(1);
```

## Minor Breaking changes

These are less likely to impact you, but you should still be aware of them.

### Renamed APIs

- `QueryInterface` has been renamed to `AbstractQueryInterface`.
- `ModelColumnAttributeOptions` has been renamed to `AttributeOptions`.
- `SequelizeMethod` has been renamed to `BaseSqlExpression`

### Attribute `references` option

*Pull Request [#15431]*

The `references` option, used to define foreign keys, has been reworked. Prior to Sequelize 7, this option accepted a sub-option called "model", but
this sub-option also accepted table names.

Starting with Sequelize 7, this sub-option has been split into two options: `model` and `table`. You only need to specify one of them:

```typescript
// Before
const User = sequelize.define('User', {
  countryId: {
    type: DataTypes.INTEGER,
    references: {
      // This referenced the TABLE named "countries", not the MODEL called "countries".
      model: 'countries',
      key: 'id',
    },
  },
});

// After (table version)
const User = sequelize.define('User', {
  countryId: {
    type: DataTypes.INTEGER,
    references: {
      // It is now clear that this references the table called "countries"
      table: 'countries',
      key: 'id',
    },
  },
});

// After (model version)
const User = sequelize.define('User', {
  countryId: {
    type: DataTypes.INTEGER,
    references: {
      // It is now clear that this references the Country model, from which the table name will be inferred.
      model: Country,
      key: 'id',
    },
  },
});
```

### Strict Auto-Timestamp & Auto-version attributes

*Pull Request [#15431]*

Sequelize can add 4 special attributes to your models: `createdAt`, `updatedAt`, `deletedAt` and `version`. 
These attributes are handled automatically by Sequelize, and therefore must follow a specific format.

If you defined these attributes manually, but with options that are incompatible with Sequelize's behavior,
Sequelize would silently ignore your options and replace them with its own.

Starting with Sequelize 7, Sequelize will throw an error if you try to define these attributes with incompatible options.

For instance, if you try to define a `createdAt` attribute with an incompatible type, Sequelize will throw an error:

```typescript
const User = sequelize.define('User', {
  createdAt: {
    // This will cause an error because sequelize expects a DATE type, not DATEONLY.
    // error-next-line
    type: DataTypes.DATEONLY,
  },
});
```

### TypeScript conversion

One of the major foundational code changes of v7 is the migration to TypeScript.  
As a result, the manual typings that were formerly best-effort guesses on top of the JavaScript code base,
have been removed and all typings are now directly retrieved from the actual TypeScript code.

You'll likely find many tiny differences which however should be easy to fix.

### Attribute names cannot use syntax reserved by Sequelize

*Attributes cannot start or end with `$`, include `.`, include `::`, or include `->`. Column names are not impacted.*

`$attribute$` & `$nested.attribute$` is a special syntax used to reference nested attributes in Queries.  
The `.` character also has special meaning, being used to reference nested JSON object keys,
the `$nested.attribute$` syntax, and in output names of eager-loaded associations in SQL queries.

The `->` character sequence is [used internally to reference nested associations](https://github.com/sequelize/sequelize/pull/14181#issuecomment-1053591214).

Finally, the `::` character sequence has special meaning in queries as it allows you to tell sequelize to cast an attribute.

In Sequelize 6, it was possible to create an attribute that matched these special syntaxes, leading to subtle bugs.  
Starting with Sequelize 7, this is now considered reserved syntax, and it is no longer possible to
use a string that both starts or ends with a `$` as the attribute name, includes the `.` character, or includes `::`.

This only affects the attribute name, it is still possible to do this for the column name.

Instead of doing this:

```typescript
import { DataTypes, Model } from '@sequelize/core';

class User extends Model {
  $myAttribute$: string;
  'another.attribute': string;
  'other::attribute': string;
}

User.init({
  // this key sets the JavaScript name.
  // It's not allowed to start or end with $ anymore.
  '$myAttribute$': {
    type: DataTypes.STRING,
    columnName: '$myAttribute$',
  },
  // The JavaScript name is not allowed to include a dot anymore.
  'another.attribute': {
    type: DataTypes.STRING,
    columnName: 'another.attribute',
  },
  // The JavaScript name is not allowed to include '::' anymore.
  'other::attribute': {
    type: DataTypes.STRING,
    columnName: 'other::attribute',
  },
}, { sequelize });
```

Do this:

```typescript
import { DataTypes, Model } from '@sequelize/core';

class User extends Model {
  myAttribute: string;
  anotherAttribute: string;
  otherAttribute: string;
}

User.init({
  myAttribute: {
    type: DataTypes.STRING,
    // Column names are still allowed to start & end with $
    columnName: '$myAttribute$', // this sets the column name
  },
  anotherAttribute: {
    type: DataTypes.STRING,
    // Column names are still allowed to include dots
    columnName: 'another.attribute',
  },
  otherAttribute: {
    type: DataTypes.STRING,
    // Column names are still allowed to include ::
    columnName: 'other::attribute',
  },
}, { sequelize });
```

### Changes to `ConnectionManager`

*This only impacts you if you used `ConnectionManager` directly.*

`ConnectionManager#getConnection`: The `type` option now accepts `'read' | 'write'` instead of `'SELECT' | any`.
It was already documented as such in v6, but the implementation did not match the documentation.

```typescript
// Instead of doing this:
sequelize.connectionManager.getConnection({ type: 'SELECT' });

// Do this:
sequelize.connectionManager.getConnection({ type: 'read' });
```

### Overridden Model methods won't be called internally

`Model.findOne` and `Model.findAll` are used respectively by `Model.findByPk` and `Model.findOne`.

This is considered an implementation detail and as such, starting with Sequelize v7,
overrides of either of these methods will not be called internally by `Model.findByPk` or `Model.findOne`.

In other words, doing this won't break:

```typescript
class User extends Model {
  static findOne() {
    throw new Error('Do not call findOne');
  }
}

// this would have thrown "Do not call findOne" in v6
// but it works in v7
User.findByPk(1);
```

### `where` clauses of scopes are merged using the `and` operator

In Sequelize v6, using multiple scopes sharing where conditions on the same attributes were merged by overwriting those very conditions.

For instance:

```js
YourModel.addScope('scope1', {
  where: {
    firstName: 'bob',
    age: {
      [Op.gt]: 20,
    },
  },
  limit: 2,
});
YourModel.addScope('scope2', {
  where: {
    age: {
      [Op.lt]: 30,
    },
  },
  limit: 10,
});
```

Using `.scope('scope1', 'scope2')` would have yielded the following WHERE clause:

```sql
WHERE firstName = 'bob' AND age < 30 LIMIT 10
```

The condition `age > 20` would have been overwritten. Starting with Sequelize v7, where conditions in scopes are merged using the `and` operator.

Using `.scope('scope1', 'scope2')` will now yield:

```sql
WHERE firstName = 'bob' AND age > 20 AND age < 30 LIMIT 10
```

**Note**: The flag `whereMergeStrategy` was introduced in the v6.18.0 to switch between these two behaviors. This flag has been dropped because only the `and` merging option is supported in Sequelize v7.

### Transaction afterCommit hook

Sequelize 6 had a bug where `transaction.afterCommit`-hooks would be executed when application code wants to commit - even when the database transaction rolls back on its commit.
This behaviour has been changed to better meet expectations of how this callback hook can be used.

See [issue 14902](https://github.com/sequelize/sequelize/issues/14902) and [PR 14903](https://github.com/sequelize/sequelize/pull/14903) for more details.

### The `where` options throws if the value is not a valid option

*Pull Request [#15375]*

In Sequelize v6, the `where` option was ignored if the value it received was not a valid option.

For instance, the following query:

```ts
User.findAll({
  where: new Date(),
});
```

Would have returned all users in the database. In Sequelize 7, this will throw an error.

### Where does not accept attribute objects anymore

*Pull Request [#15598]*

The `where()` function used to accept values coming from `Model.rawAttributes` as one of its values.
This was poorly documented, and almost completely unused. We replaced this feature with the new `sql.attribute()`.

Instead of writing:

```ts
where(User.rawAttributes.firstName, Op.like, 'foo');
```

You can now write the following:

```ts
sql.where(sql.attribute('firstName'), Op.like, 'foo');
```

### Changes to empty `OR` & `NOT` operators

*Pull Request [#15598]*

Both `Op.or` and `Op.not` used to produce `'0=1'` if their object or array was empty. Both of them are not completely ignored instead:

```ts
User.findAll({
  where: or([]),
});

User.findAll({
  where: not({}),
});
```

Both produce the following query:

```sql
SELECT * FROM "users"
```

### Removed support for raw SQL in `json()`

*Pull Request [#15598]*

In Sequelize 6, you could use raw SQL in `json()` functions:

```ts
import { json } from 'sequelize';

// This was valid in Sequelize 6
User.findAll({
  where: where(json(`("data"->id)`), Op.eq, id),
});
```

To prevent any risk of SQL injection, the only way to use raw SQL in Sequelize is meant to be done via either the `sql` template tag,
the `literal` function, or `sequelize.query`.

As such, we have removed this poorly documented feature in Sequelize 7. Its replacement is to use the `sql` template tag:

```ts
import { sql } from '@sequelize/core';

// This is valid in Sequelize 7
User.findAll({
  where: sql`"data"->'id' = ${id}`,
});
```

:::info

The `sql` tag automatically escapes values, so you don't need to worry about SQL injection.

:::

## Deprecations & Removals

### Removal of previously deprecated APIs

- `WhereValue`, `AnyOperator`, `AllOperator`, `AndOperator` and `OrOperator` types: They did not reflect the reality of how the `where` option is typed (see [this PR](https://github.com/sequelize/sequelize/pull/14022))
- `setterMethods` and `getterMethods` model options: They were deprecated in v6 and are now removed. Use [VIRTUAL](../models/getters-setters-virtuals.md#virtual-attributes) attributes, or class getter & setters instead.
- Models had an instance property called `validators`. This property has been removed because almost all attributes have at least one validator (based on their nullability and data type). 
  The information you need to replace this property is available in the [`modelDefinition`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#modelDefinition) static property.
- The `Utils` export has been removed. It exposed internal utilities that were not meant to be used by end users. If you used any of these utilities, please open an issue to discuss how to expose them in a future-proof way.  
  This export included classes `Fn`, `Col`, `Cast`, `Literal`, `Json`, and `Where`, which are useful for typing purposes. They now have their own exports instead of being part of `Utils`.
- Operator Aliases have been removed.

## New Deprecations

Sequelize 7 also includes a series of new deprecation. These APIs will continue to work in v7 but expect them to
stop working in a future major release.

- All hook methods are deprecated in favor of using the `hooks` property available on models and Sequelize classes. See the documentation on [hooks](./hooks.mdx) to learn more.
- `DataTypes.REAL` is redundant with `DataTypes.FLOAT`, and is deprecated.
- `Model.scope()` has been renamed to `Model.withScope()`
- `Model.unscoped()` has been renamed to `Model.withoutScope()` (due to the addition of `Model.withOriginalScope()`)
- `Model.schema()` has been renamed to `Model.withSchema()`
- `Model.setAttributes()` is deprecated in favor of `Model.set()`, as it was just an alias
- `Model.dropSchema()` is deprecated as it is unrelated to Model, use [`Sequelize#dropSchema`](pathname:///api/v7/classes/_sequelize_core.index.Sequelize.html#dropSchema) or [`QueryInterface#dropSchema`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#dropSchema) instead.
- The `parent` and `original` properties on Error classes are deprecated in favor of the native `cause` property, which should improve error messages.
- Accessing DataTypes on the Sequelize constructor is deprecated. Instead of doing this:
  ```typescript
  import { Sequelize } from '@sequelize/core';
  
  Sequelize.STRING
  Sequelize.INTEGER
  ```
  do this:
  ```typescript
  import { DataTypes } from '@sequelize/core';

  DataTypes.STRING
  DataTypes.INTEGER
  ```
- The `as` & `model` options in `include` are deprecated, we recommend using the `association` option instead.
- `Op.col` is deprecated, use `sql.col()`, `sql.attribute()`, or `sql.identifier()` instead.
- `Sequelize.json()` is deprecated, use `sql.attribute()`, `sql.where()` or `sql.jsonPath()` instead.
  - The `Json` class, that is produced by `json()` has been removed, as `json()` now simply calls `sql.attribute()` or `sql.where()` depending on its parameters.
- The following methods are available on both the `Sequelize` class, `sequelize` instances, and as named imports. They are deprecated and
  should be accessed on the `sql` export instead:
  - `fn`
  - `col`
  - `cast`
  - `literal`
  - `where`
- The `quoteIdentifiers` option in the sequelize constructor could be set to false to skip quoting of table names and attributes in postgres. This is potentially unsafe and therefore deprecated.

[#14352]: https://github.com/sequelize/sequelize/pull/14352
[#14447]: https://github.com/sequelize/sequelize/pull/14447
[#14505]: https://github.com/sequelize/sequelize/pull/14505
[#14280]: https://github.com/sequelize/sequelize/pull/14280
[#14619]: https://github.com/sequelize/sequelize/pull/14619
[#15431]: https://github.com/sequelize/sequelize/pull/15431
[#15374]: https://github.com/sequelize/sequelize/pull/15374
[#15375]: https://github.com/sequelize/sequelize/pull/15375
[#15108]: https://github.com/sequelize/sequelize/pull/15108
[#15292]: https://github.com/sequelize/sequelize/pull/15292
[#15598]: https://github.com/sequelize/sequelize/pull/15598
