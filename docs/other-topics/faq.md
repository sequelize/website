---
title: FAQ & Troubleshooting
---

## Working with an existing database

Sequelize works best when it handles the creation of your database tables for you. 
Many options are automatically configured for you to ease the development process.

Sometimes, however, you may need to work with an existing database, 
and Sequelize must adapt to you, not the other way around.
To do this, you will need to let Sequelize know about your existing tables and how they are structured.

The following pages will teach you how to do this:

- [Naming your tables](../models/naming-strategies.mdx#manually-setting-the-table-name)
- [Naming your columns](../models/naming-strategies.mdx#manually-setting-the-column-name)
- [Removing the primary key](../models/advanced.mdx#prevent-creating-a-default-pk-attribute)

## Error: Can't create more than `max_prepared_stmt_count statements` (MySQL)

If you're using MySQL and encounter this error,
it means that Sequelize is creating more prepared statements than your MySQL server allows.

To fix this, you need to configure the `maxPreparedStatements` option in your Sequelize constructor
to a value that will not cause Sequelize to create more statements than the `max_prepared_stmt_count` value of your MySQL server.

```ts
const sequelize = new Sequelize({
  // ...
  dialectOptions: {
    maxPreparedStatements: 100,
  },
});
```

The `max_prepared_stmt_count` limit is a database-wide limit,
and prepared statements are created per-connection. 
This means that the `maxPreparedStatements` option should be set to a value 
that is less than the `max_prepared_stmt_count` value divided by the number of concurrent connections to your database.

To figure out a good value for this option, you can do the following:

1. Determine the value of `max_prepared_stmt_count` on your MySQL server:
   ```sql
   SHOW VARIABLES LIKE 'max_prepared_stmt_count';
   ```
2. Determine how many concurrent connections can be connected to your database at the same time.
   ```sql
   SHOW VARIABLES LIKE 'max_connections';
   ```
3. Set `maxPreparedStatements` to the result of `FLOOR(max_prepared_stmt_count / max_connections)`.
