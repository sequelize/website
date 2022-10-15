---
title: Upgrade to v7
---

Sequelize v7 is the next major release after v6. Below is a list of breaking changes to help you upgrade.

:::info

Upgrading from Sequelize v5? [Check out our 'Upgrade to v6' guide](/docs/v6/other-topics/upgrade) first!

:::

## Breaking Changes

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

This means Sequelize v7 supports **Node ^14.17.0 || >=16.0.0**, and **TypeScript >= 4.4**.

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

### TypeScript conversion

One of the major foundational code changes of v7 is the migration to TypeScript.\
As a result, the manual typings that were formerly best-effort guesses on top of the JavaScript code base,
have been removed and all typings are now directly retrieved from the actual TypeScript code.

You'll likely find many tiny differences which however should be easy to fix.

### Attribute names cannot use syntax reserved by Sequelize

*Attributes cannot start or end with `$`, include `.`, include `::`, or include `->`. Column names are not impacted.*

`$attribute$` & `$nested.attribute$` is a special syntax used to reference nested attributes in Queries.\
The `.` character also has special meaning, being used to reference nested JSON object keys,
the `$nested.attribute$` syntax, and in output names of eager-loaded associations in SQL queries.

The `->` character sequence is [used internally to reference nested associations](https://github.com/sequelize/sequelize/pull/14181#issuecomment-1053591214).

Finally, the `::` character sequence has special meaning in queries as it allows you to tell sequelize to cast an attribute.

In Sequelize 6, it was possible to create an attribute that matched these special syntaxes, leading to subtle bugs.\
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

### afterCommit hooks

Sequelize 6 had a bug where `transaction.afterCommit`-hooks would be executed when application code wants to commit - even when the database transaction rolls back on its commit. This behaviour has been changed to better meet expectations of how this callback hook can be used. See [issue 14902](https://github.com/sequelize/sequelize/issues/14902) and [PR 14903](https://github.com/sequelize/sequelize/pull/14903) for more details.

### Removal of previously deprecated APIs

- `WhereValue`, `AnyOperator`, `AllOperator`, `AndOperator` and `OrOperator` types: They did not reflect the reality of how the `where` option is typed (see [this PR](https://github.com/sequelize/sequelize/pull/14022))

## Deprecations

Sequelize 7 also includes a series of new deprecation. These APIs will continue to work in v7 but expect them to
stop working in a future major release.

- All hook methods are deprecated in favor of using the `hooks` property available on models and Sequelize classes. See the documentation on [hooks](./hooks.md) to learn more.
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


[#14352]: https://github.com/sequelize/sequelize/pull/14352
[#14447]: https://github.com/sequelize/sequelize/pull/14447
