---
title: Dialect-Specific Features
---

## Arrays of ENUMS

:::info

This feature is only available in PostgreSQL

:::

Array(Enum) type requires special treatment. Whenever Sequelize will talk to the database, it has to typecast array values with ENUM name.

So this enum name must follow this pattern `enum_<table_name>_<col_name>`. If you are using `sync` then correct name will automatically be generated.

## Table Hints

:::info

This feature is only available in MS SQL Server

:::

The `tableHint` option can be used to define a table hint. The hint must be a value from `TableHints` and should only be used when absolutely necessary. Only a single table hint is currently supported per query.

Table hints override the default behavior of MSSQL query optimizer by specifying certain options. They only affect the table or view referenced in that clause.

```js
import { TableHints } from '@sequelize/core';

Project.findAll({
  // adding the table hint NOLOCK
  tableHint: TableHints.NOLOCK,
  // this will generate the SQL 'WITH (NOLOCK)'
});
```

## Index Hints

:::info

This feature is only available in MySQL & MariaDB

:::

The `indexHints` option can be used to define index hints. The hint type must be a value from `IndexHints` and the values should reference existing indexes.

Index hints [override the default behavior of the MySQL query optimizer](https://dev.mysql.com/doc/refman/8.0/en/index-hints.html).

```js
import { IndexHints } from '@sequelize/core';
Project.findAll({
  indexHints: [{ type: IndexHints.USE, values: ['index_project_on_name'] }],
  where: {
    id: {
      [Op.gt]: 623,
    },
    name: {
      [Op.like]: 'Foo %',
    },
  },
});
```

The above will generate a MySQL query that looks like this:

```sql
SELECT * FROM Project USE INDEX (index_project_on_name) WHERE name LIKE 'FOO %' AND id > 623;
```

`IndexHints` includes `USE`, `FORCE`, and `IGNORE`.

See [Issue #9421](https://github.com/sequelize/sequelize/issues/9421) for the original API proposal.
