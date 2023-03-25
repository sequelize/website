---
sidebar_position: 2
title: Getting Started
---

In this tutorial you will learn to set up Sequelize.

## Installing

Sequelize is available via [npm](https://www.npmjs.com/package/sequelize) (or [yarn](https://yarnpkg.com/package/sequelize)).

```sh
npm install --save sequelize
```

You'll also have to manually install the driver for your database of choice:

```sh
# One of the following:
$ npm install --save pg pg-hstore # Postgres
$ npm install --save mysql2
$ npm install --save mariadb
$ npm install --save sqlite3
$ npm install --save tedious # Microsoft SQL Server
$ npm install --save oracledb # Oracle Database
```

## Connecting to a database

To connect to the database, you must create a Sequelize instance. You can either pass the connection parameters separately to the Sequelize constructor or pass a single connection URI:

```js
const { Sequelize } = require('sequelize');

// Option 1: Passing a connection URI
const sequelize = new Sequelize('sqlite::memory:') // Example for sqlite
const sequelize = new Sequelize('postgres://user:pass@example.com:5432/dbname') // Example for postgres

// Option 2: Passing parameters separately (sqlite)
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'path/to/database.sqlite'
});

// Option 3: Passing parameters separately (other dialects)
const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
});
```

The Sequelize constructor accepts many options which are documented in the [API Reference](pathname:///api/v6/class/src/sequelize.js~Sequelize.html#instance-constructor-constructor).

:::note

In the example above, `Sequelize` refers to the library itself while `sequelize` refers to an instance of Sequelize, which represents a connection to one database. This convention will be followed throughout the documentation.

:::

### Testing the connection

To test if the connection is OK, you can use the `.authenticate()` function:

```js
try {
  await sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}
```

### Closing the connection

Sequelize will keep the connection open by default, and use the same connection for all queries. If you need to close the connection, call `sequelize.close()` (which is asynchronous and returns a Promise).

:::note

Once `sequelize.close()` has been called, you cannot open a new connection. To access your database again, create a new Sequelize instance.

:::

## Tips for running code examples locally

To help you learn faster, you are encouraged to run code examples locally while reading the Sequelize docs. The easiest way to do this is using the SQLite dialect:

```js
const { Sequelize, Op, Model, DataTypes } = require("sequelize");
const sequelize = new Sequelize("sqlite::memory:");

// Code here! It works!
```

To experiment with the other dialects, which are harder to setup locally, you can use the [Sequelize SSCCE](https://github.com/papb/sequelize-sscce) GitHub repository, which allows you to run code on all supported dialects directly from GitHub, for free, without any setup!

## New versus existing databases

If the database of your new project is still empty, use Sequelize from the beginning to automate the creation of every table in your database. Sequelize can also connect to a database that is already filled with tables and data. You will learn more in the concepts section and other parts of the documentation.

## Logging

By default, Sequelize will log every SQL query to console. To customize this behavior, use the `logging` option (defaults to `console.log`) and define the function that gets executed every time Sequelize would log something. By default, only the first log parameter of log function call is displayed. For example, for query logging the first parameter is the raw query and the second is the Sequelize object.

Common useful values for `logging`:

```js
const sequelize = new Sequelize('sqlite::memory:', {
  // Choose one of the logging options
  logging: console.log,                  // Default, displays the first parameter of the log function call
  logging: (...msg) => console.log(msg), // Displays all log function call parameters
  logging: false,                        // Disables logging
  logging: msg => logger.debug(msg),     // Use custom logger (e.g. Winston or Bunyan), displays the first parameter
  logging: logger.debug.bind(logger)     // Alternative way to use custom logger, displays all messages
});
```

## Promises and async/await

Most of the methods provided by Sequelize are asynchronous and therefore return [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). You can use the Promise API (for example, using `then`, `catch`, `finally`) out of the box. Of course, using `async` and `await` also works.
