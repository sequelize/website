---
title: Query Interface
---

The **Query Interface** is a low-level API that Sequelize uses internally to communicate with the database in a dialect-agnostic way.
It is primarily useful in contexts where models are not available, such as database migrations.

The Query Interface can be considered as the step between model methods and raw SQL queries.

:::note

Only APIs that are considered stable and well-designed for end users are documented here.
Other APIs are being progressively redesigned and will be documented as they become ready.

:::

## Obtaining the query interface

The query interface is available on your Sequelize instance:

```js
import { Sequelize } from '@sequelize/core';

const sequelize = new Sequelize(/* ... */);
const queryInterface = sequelize.queryInterface;
```

For the full API reference, see the [QueryInterface API](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html).

## Database management

These methods let you create and manage databases.
They are dialect-specific and not all methods are supported by every dialect.

Relevant API:
[`createDatabase`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#createdatabase),
[`dropDatabase`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#dropdatabase),
[`listDatabases`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#listdatabases),

```js
// Create a database
await queryInterface.createDatabase('mydb', { charset: 'utf8mb4' });

// Drop a database
await queryInterface.dropDatabase('mydb');

// List all databases
const databases = await queryInterface.listDatabases();
// => [{ name: 'mydb' }, ...]
```

## Schema management

Schemas are namespaces that can contain tables (what MySQL/MariaDB call "databases").

Relevant API:
[`createSchema`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#createschema),
[`dropSchema`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#dropschema),
[`listSchemas`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#listschemas),
[`dropAllSchemas`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#dropallschemas)

```js
// Create a schema
await queryInterface.createSchema('myschema');

// Drop a schema
await queryInterface.dropSchema('myschema');

// List all schemas
const schemas = await queryInterface.listSchemas();
// => ['public', 'myschema']

// Drop all schemas (use with care!)
await queryInterface.dropAllSchemas({
  // optionally skip certain schemas
  skip: ['public'],
});
```

## Table management

### Creating a table

Relevant API: [`createTable`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#createtable)

```js
import { DataTypes } from '@sequelize/core';

await queryInterface.createTable('people', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: DataTypes.STRING,
  isBetaMember: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
});
```

Generated SQL (using SQLite):

```sql
CREATE TABLE IF NOT EXISTS `people` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `name` VARCHAR(255),
  `isBetaMember` TINYINT(1) NOT NULL DEFAULT 0
);
```

### Listing and checking tables

Relevant API:
[`listTables`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#listtables),
[`tableExists`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#tableexists)

```js
// List all tables in the current schema
const tables = await queryInterface.listTables();
// => [{ tableName: 'people', schema: 'public' }, ...]

// Check whether a table exists
const exists = await queryInterface.tableExists('people');
// => true
```

### Describing a table

Relevant API: [`describeTable`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#describetable)

Returns the full column definitions for a table:

```js
const columns = await queryInterface.describeTable('people');
```

Example output:

```js
{
  id: {
    type: 'INTEGER',
    allowNull: false,
    defaultValue: null,
    primaryKey: true,
    autoIncrement: true,
    comment: null,
  },
  name: {
    type: 'VARCHAR(255)',
    allowNull: true,
    defaultValue: null,
    primaryKey: false,
    autoIncrement: false,
    comment: null,
  },
}
```

### Renaming a table

Relevant API: [`renameTable`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#renametable)

```js
await queryInterface.renameTable('people', 'User');
```

### Dropping tables

Relevant API:
[`dropTable`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#droptable),
[`dropAllTables`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#dropalltables)

```js
// Drop a single table
await queryInterface.dropTable('people');

// Drop all tables in the current schema (use with care!)
await queryInterface.dropAllTables({
  // optionally skip certain tables
  skip: ['migrations'],
});
```

### Truncating a table

Relevant API: [`truncate`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#truncate)

Deletes all rows but keeps the table structure:

```js
await queryInterface.truncate('people');
```

## Column management

### Adding a column

Relevant API: [`addColumn`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#addcolumn)

```js
await queryInterface.addColumn('people', 'petName', {
  type: DataTypes.STRING,
  allowNull: true,
});
```

Generated SQL (using SQLite):

```sql
ALTER TABLE `people` ADD `petName` VARCHAR(255);
```

### Removing a column

Relevant API: [`removeColumn`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#removecolumn)

```js
await queryInterface.removeColumn('people', 'petName');
```

Generated SQL (using PostgreSQL):

```sql
ALTER TABLE "public"."people" DROP COLUMN "petName";
```

### Changing a column

Relevant API: [`changeColumn`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#changecolumn)

```js
await queryInterface.changeColumn('people', 'age', {
  type: DataTypes.FLOAT,
  defaultValue: 0,
  allowNull: false,
});
```

Generated SQL (using MySQL):

```sql
ALTER TABLE `people` CHANGE `age` `age` FLOAT NOT NULL DEFAULT 0;
```

### Renaming a column

Relevant API: [`renameColumn`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#renamecolumn)

```js
await queryInterface.renameColumn('people', 'petName', 'animalName');
```

:::note SQLite limitations

SQLite does not natively support altering or removing columns. Sequelize works around this by recreating the whole table using a temporary backup table, inspired by [the SQLite documentation](https://www.sqlite.org/lang_altertable.html#otheralter).

:::

## Index management

### Adding an index

Relevant API: [`addIndex`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#addindex)

```js
// Simple index
await queryInterface.addIndex('people', ['name']);

// Unique index with a custom name
await queryInterface.addIndex('people', {
  fields: ['email'],
  unique: true,
  name: 'people_email_unique',
});

// Partial index (PostgreSQL)
await queryInterface.addIndex('people', {
  fields: ['email'],
  unique: true,
  where: { active: true },
});
```

### Removing an index

Relevant API: [`removeIndex`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#removeindex)

```js
// By index name
await queryInterface.removeIndex('people', 'people_email_unique');

// By column list (Sequelize will infer the index name)
await queryInterface.removeIndex('people', ['email']);
```

### Listing indexes

Relevant API: [`showIndex`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#showindex)

```js
const indexes = await queryInterface.showIndex('people');
```

Example output:

```js
[
  {
    name: 'people_email_unique',
    unique: true,
    primary: false,
    fields: [{ attribute: 'email', order: 'ASC', length: undefined, collate: undefined }],
    includes: undefined,
    tableName: 'people',
    type: undefined,
  },
];
```

## Constraint management

### Adding a constraint

Relevant API: [`addConstraint`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#addconstraint)

```js
// UNIQUE constraint
await queryInterface.addConstraint('people', {
  fields: ['email'],
  type: 'UNIQUE',
  name: 'people_email_unique',
});

// CHECK constraint (not supported by MySQL)
await queryInterface.addConstraint('people', {
  fields: ['age'],
  type: 'CHECK',
  where: { age: { [Op.gte]: 0 } },
  name: 'people_age_positive',
});

// PRIMARY KEY constraint
await queryInterface.addConstraint('people', {
  fields: ['id'],
  type: 'PRIMARY KEY',
  name: 'people_pk',
});

// FOREIGN KEY constraint
await queryInterface.addConstraint('posts', {
  fields: ['userId'],
  type: 'FOREIGN KEY',
  name: 'post_user_fkey',
  references: {
    table: 'people',
    field: 'id',
  },
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
```

### Listing constraints

Relevant API: [`showConstraints`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#showconstraints)

```js
const constraints = await queryInterface.showConstraints('people');
```

Example output:

```js
[
  {
    constraintName: 'people_email_unique',
    constraintType: 'UNIQUE',
    tableName: 'people',
    tableSchema: 'public',
    constraintSchema: 'public',
    columnNames: ['email'],
  },
];
```

You can filter by constraint type or column:

```js
// Only foreign key constraints
const fks = await queryInterface.showConstraints('posts', {
  constraintType: 'FOREIGN KEY',
});

// Constraints on a specific column
const colConstraints = await queryInterface.showConstraints('people', {
  columnName: 'email',
});
```

### Removing a constraint

Relevant API: [`removeConstraint`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#removeconstraint)

```js
await queryInterface.removeConstraint('people', 'people_email_unique');
```

### Deferring constraints

Relevant API: [`deferConstraints`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#deferconstraints)

For dialects that support deferrable constraints, you can defer constraint checking within a transaction:

```js
import { ConstraintChecking } from '@sequelize/core';

// Defer all constraints until the end of the transaction
await sequelize.transaction(async () => {
  await queryInterface.deferConstraints(ConstraintChecking.DEFERRED());

  // ... perform operations that would temporarily violate constraints
});

// Or defer only specific named constraints:
await sequelize.transaction(async () => {
  await queryInterface.deferConstraints(ConstraintChecking.DEFERRED(['post_user_fkey']));
});
```

## Miscellaneous

### Disabling foreign key checks

Relevant API: [`withoutForeignKeyChecks`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#withoutforeignkeychecks)

Use `withoutForeignKeyChecks` to safely perform bulk operations (such as truncating tables) that would otherwise violate foreign key constraints. Sequelize will automatically re-enable foreign key checks after the callback completes, even if it throws.

```js
await queryInterface.withoutForeignKeyChecks(async connection => {
  await queryInterface.truncate('posts', { connection });
  await queryInterface.truncate('people', { connection });
});
```

You must use the provided `connection` for all queries inside the callback to ensure they run on the same database connection (foreign key checks are connection-scoped in most databases).

### Getting the server version

Relevant API: [`fetchDatabaseVersion`](pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#fetchdatabaseversion)

```ts
// Get the database server version
const version = await queryInterface.fetchDatabaseVersion();
// => '8.0.32'
```
