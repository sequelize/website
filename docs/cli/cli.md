---
title: Using the CLI
sidebar_position: 1
---

The Sequelize CLI offers a variety of commands to help you manage your database.
This guide will walk you through the process of setting up a new project and creating your first model, migration, and seed.

Note that using the Sequelize CLI is completely optional and you can use Sequelize without it.

## Installing the CLI

The Sequelize CLI is available as an npm package. You can install it using the following command:

```bash npm2yarn
npm install -D @sequelize/cli
```

## Configuration

Before continuing further we will need to tell the CLI how to connect to the database.
To do that, we need to create the Sequelize configuration file.

This file can be located in a multitude of places. The CLI uses [`cosmiconfig`](https://github.com/cosmiconfig/cosmiconfig) and will search for the configuration file in the following places:

- A `.sequelizerc.js`, `.sequelizerc.ts`, `.sequelizerc.mjs`, or `.sequelizerc.cjs` file.
- Any of the above two in a `.config` directory.
- A `.sequelize.config.js`, `.sequelize.config.ts`, `.sequelize.config.mjs`, or `.sequelize.config.cjs` file.

### Connection Configuration

In order to connect to your database, start by specifying the "database" property in your configuration file:

That property takes an object with the "dialect" property, which specifies the database dialect you are using,
and any other property accepted by the Sequelize constructof for your dialect.

See ["Connecting to a database"](../getting-started.mdx#connecting-to-a-database) for the list of options.

```ts
// .sequelizerc.ts

import type { Config } from '@sequelize/cli';
import { PostgresDialect } from '@sequelize/postgres';

const config: Config<PostgresDialect> = {
  database: {
    dialect: PostgresDialect,
    database: 'mydb',
    user: 'myuser',
    password: 'mypass',
    host: 'localhost',
    port: 5432,
    ssl: true,
  },
};
```

:::info

You can use environment variables in your configuration file to avoid hardcoding sensitive information.

Environment variables can be accessed using [`process.env`](https://nodejs.org/api/process.html#processenv) in your configuration file.
Configuring environment variables is outside the scope of this guide, but you can use tools like [`dotenv`](https://www.npmjs.com/package/dotenv) or [`process.loadEnvFile`](https://nodejs.org/api/process.html#processloadenvfilepath) to manage them.

:::
