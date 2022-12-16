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
const { Sequelize } = require('@sequelize/core');
const sequelize = new Sequelize({ dialect: 'sqlite' });

await sequelize.authenticate();
```

### Minimum supported engine versions

Sequelize v7 only supports the versions of Node.js, and databases that were not EOL at the time of release.[^issue-1]  
Sequelize v7 also supports versions of TypeScript that were released in the past year prior to the time of release.

This means Sequelize v7 supports **Node ^14.17.0 || >=16.0.0**, and **TypeScript >= 4.5**.

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

- Which SQL Data Type corresponds to each Sequelize Data Type has also been changed. Refer to [our list of Data Types](../other-topics/other-data-types.mdx) for an up-to-date description.
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
belonged to the first association, while [`Project.associations.owner`](pathname:///api/v7/classes/model#associations) was equal to the second association.

### Association resolution in `include`

*Pull Request [#14280]*

In Sequelize v6, these two were considered to be different associations:

```typescript
User.hasMany(Project, { as: 'projects' });
User.hasMany(Project);
```

And you could distinguish them when eager-loading them by specifying the [`as`](pathname:///api/v7/interfaces/includeoptions#as) option in your [`include`](pathname:///api/v7/interfaces/findoptions#include) too:

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
Resulting in inconsistent values for [`User.associations.projects`](pathname:///api/v7/classes/model#associations), and association mixin methods (e.g. `user.getProjects()`).
Both would also try to eager-load under the same key.

In Sequelize v7, the [`as`](pathname:///api/v7/interfaces/includeoptions#as) parameter now defaults to the plural name of the target model (in this scenario, `projects`) for multi associations (`hasMany`, `belongsToMany`), 
and the singular name of the model otherwise.

As a consequence, how `include` is resolved has changed too: 
You can only omit the [`as`](pathname:///api/v7/interfaces/includeoptions#as) parameter if no more than one association has been defined between the two models.

This change also means that the [`include.association`](pathname:///api/v7/interfaces/includeoptions#association) option is the best way to specify
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
User.belongsToMany(Countries, { foreignKey: 'user_id' });
Countries.belongsToMany(User);
```

But this is:

```typescript
User.belongsToMany(User, { foreignKey: 'user_id' });
Country.belongsToMany(User, { otherKey: 'user_id' });
```

This requirement increases the verbosity of your associations, 
se we introduced a new option to solve that problem: [`inverse`](pathname:///api/v7/classes/belongsto#inverse). 
This option lets you define both sides of the association at the same time.
This removes the need to repeat options that are common to both associations.

Instead of writing this:

```typescript
User.belongsToMany(Country, { as: 'countries' });
User.belongsToMany(User, { as: 'citizen' });
```

You can now write this:

```typescript
User.belongsToMany(Country, { 
  as: 'countries',
  inverse: { as: 'citizen' },
});
```

### Changes to `sequelize.sync`

*Pull Request [#14619]*

- DB2 does not force all indexes to be unique anymore (this was a bug)
- When using DB2, we do not force columns that are part of an index to be non-null.
  The database still requires this to be the case, but we don't do it silently for you anymore.
- A few bugs in how indexes were named have been fixed. This means your index names could change.

## Minor Breaking changes

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
    // 'field' sets the column name
    field: '$myAttribute$',
  },
  // The JavaScript name is not allowed to include a dot anymore.
  'another.attribute': {
    type: DataTypes.STRING,
    field: 'another.attribute',
  },
  // The JavaScript name is not allowed to include '::' anymore.
  'other::attribute': {
    type: DataTypes.STRING,
    field: 'other::attribute',
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
    field: '$myAttribute$', // this sets the column name
  },
  anotherAttribute: {
    type: DataTypes.STRING,
    // Column names are still allowed to include dots
    field: 'another.attribute',
  },
  otherAttribute: {
    type: DataTypes.STRING,
    // Column names are still allowed to include ::
    field: 'other::attribute',
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

## Deprecations & Removals

### Removal of previously deprecated APIs

- `WhereValue`, `AnyOperator`, `AllOperator`, `AndOperator` and `OrOperator` types: They did not reflect the reality of how the `where` option is typed (see [this PR](https://github.com/sequelize/sequelize/pull/14022))

## New Deprecations

Sequelize 7 also includes a series of new deprecation. These APIs will continue to work in v7 but expect them to
stop working in a future major release.

- All hook methods are deprecated in favor of using the `hooks` property available on models and Sequelize classes. See the documentation on [hooks](./hooks.md) to learn more.
- `DataTypes.REAL` is redundant with `DataTypes.FLOAT`, and is deprecated.
- `Model.scope()` has been renamed to `Model.withScope()`
- `Model.unscoped()` has been renamed to `Model.withoutScope()` (due to the addition of `Model.withOriginalScope()`)
- `Model.schema()` has been renamed to `Model.withSchema()`
- `Model.setAttributes()` is deprecated in favor of `Model.set()`, as it was just an alias
- `Model.dropSchema()` is deprecated as it is unrelated to Model, use [`Sequelize#dropSchema`](pathname:///api/v7/classes/sequelize#dropSchema) or [`QueryInterface#dropSchema`](pathname:///api/v7/classes/queryinterface#dropSchema) instead.
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

[#14352]: https://github.com/sequelize/sequelize/pull/14352
[#14447]: https://github.com/sequelize/sequelize/pull/14447
[#14505]: https://github.com/sequelize/sequelize/pull/14505
[#14280]: https://github.com/sequelize/sequelize/pull/14280
[#14619]: https://github.com/sequelize/sequelize/pull/14619
