---
title: Sequelize CLI
sidebar_position: 9
---

Just like you use [version control](https://en.wikipedia.org/wiki/Version_control) systems such as [Git](https://en.wikipedia.org/wiki/Git) to manage changes in your source code, you can use **migrations** to keep track of changes to the database. With migrations you can transfer your existing database into another state and vice versa: those state transitions are saved in migration files, which describe how to get to the new state and how to revert the changes in order to get back to the old state.

The Sequelize CLI (`@sequelize/cli`) ships support for running and managing migrations. It is built on top of [umzug](https://github.com/sequelize/umzug) for migration execution and [oclif](https://oclif.io) for the command-line interface.

## Installing the CLI

```bash npm2yarn
npm install --save-dev @sequelize/cli
```

The CLI binary is named `sequelize`:

```bash
# npm
npx sequelize --help

# yarn
yarn sequelize --help
```

## Configuration

The CLI is configured using [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig).
It searches for a `sequelize` configuration in the following places:

- A `sequelize` key in `package.json`.
- A `.sequelizerc.json` or `.config/sequelizerc.json` file (can also be yml, js, mjs, cjs).
- A `sequelize.config.js`, `sequelize.config.cjs`, or `sequelize.config.mjs` file (recommended).

The configuration file must export (or contain) an object with the following properties:

| Option            | Type     | Default         | Description                                                                                                                                                 |
| ----------------- | -------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `migrationFolder` | `string` | `"/migrations"` | Path to the migrations folder, relative to the config file's directory.                                                                                     |
| `seedFolder`      | `string` | `"/seeds"`      | Path to the seeds folder, relative to the config file's directory.                                                                                          |
| `database`        | `object` | —               | [Sequelize constructor options](./getting-started.mdx#connecting-to-a-database), including a `dialect`. Required for commands that connect to the database. |

The `dialect` field inside `database` can be either a dialect class (e.g. `PostgresDialect`) or an import-path string (e.g. `"@sequelize/postgres#PostgresDialect"`).

### Example configuration

When using a JavaScript or TypeScript config file, you can pass the dialect class directly:

```js title="sequelize.config.mjs"
import { loadEnvFile } from 'node:process';
import { PostgresDialect } from '@sequelize/postgres';

// load the ".env" file (if it exists) so we can use environment variables in the config
loadEnvFile();

export default {
  migrationFolder: '/db/migrations',
  seedFolder: '/db/seeds',

  // Commands that only generate files (e.g. `migration generate`, `seed generate`)
  // do not require a `database` entry in the config.
  database: {
    dialect: PostgresDialect,

    // These options depend on the dialect, see the "Getting started" docs for details
    database: 'my_database',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: 'localhost',
    port: 5432,
  },
};
```

:::tip

Keep secrets (passwords, API keys) out of source code. Use environment variables as shown above.

:::

When using a JSON config file (e.g. `.sequelizerc` or a `sequelize` key in `package.json`),
specify the dialect as an import-path string in the form `"<package>#<ExportName>"`.
The CLI will import the package and resolve the named export at startup:

```json title=".sequelizerc"
{
  "migrationFolder": "/db/migrations",
  "seedFolder": "/db/seeds",
  "database": {
    "dialect": "@sequelize/postgres#PostgresDialect",
    "database": "my_database",
    "host": "localhost",
    "port": 5432
  }
}
```

Examples of import-path strings (not exhaustive):

| Dialect    | Import-path string                        |
| ---------- | ----------------------------------------- |
| PostgreSQL | `"@sequelize/postgres#PostgresDialect"`   |
| MySQL      | `"@sequelize/mysql#MySqlDialect"`         |
| MariaDB    | `"@sequelize/mariadb#MariaDbDialect"`     |
| SQLite     | `"@sequelize/sqlite3#SqliteDialect"`      |
| MSSQL      | `"@sequelize/mssql#MsSqlDialect"`         |
| DB2        | `"@sequelize/db2#Db2Dialect"`             |
| Snowflake  | `"@sequelize/snowflake#SnowflakeDialect"` |

:::warning

Using JSON is discouraged, as it cannot access environment variables or other dynamic values.
Make sure to keep secrets out of source code.

:::

## Migration commands

### `migration generate`

Generates a new migration file in the configured `migrationFolder`.

```bash
npx sequelize migration generate --format=<sql|typescript|cjs|esm> [--name=<name>]
```

**Flags:**

| Flag       | Required | Default     | Description                                             |
| ---------- | -------- | ----------- | ------------------------------------------------------- |
| `--format` | Yes      | —           | File format: `sql`, `typescript`, `cjs`, or `esm`.      |
| `--name`   | No       | `"unnamed"` | A short descriptive name, used as part of the filename. |

The generated filename is prefixed with a UTC timestamp in `YYYY-MM-DDThh-mm-ss` format (e.g. `2026-04-12t14-30-00-create-users.ts`). Files are sorted alphabetically when run, so the timestamp ensures correct ordering.

**SQL format** creates a directory with two files:

```
migrations/
  2026-04-12t14-30-00-create-users/
    up.sql      ← forward migration
    down.sql    ← rollback migration
```

**All other formats** create a single file:

```
migrations/
  2026-04-12t14-30-00-create-users.ts   ← TypeScript
  2026-04-12t14-30-00-create-users.mjs  ← ESM
  2026-04-12t14-30-00-create-users.cjs  ← CommonJS
```

If you run the command in interactive mode without providing `--name`, you will be prompted for one.

#### JSON output

```bash
npx sequelize migration generate --format=typescript --name=create-users --json
# { "path": "/path/to/migrations/2026-04-12t14-30-00-create-users.ts" }
```

---

### `migration run`

Runs all pending migrations (or a subset).

```bash
npx sequelize migration run [--to=<name>] [--step=<n>]
```

**Flags:**

| Flag     | Default | Description                                                |
| -------- | ------- | ---------------------------------------------------------- |
| `--to`   | —       | Run migrations up to and including the one with this name. |
| `--step` | —       | Run only this many pending migrations.                     |

Migration history is tracked in a `SequelizeMeta` table that the CLI creates automatically in your database.

**Examples:**

```bash
# Run all pending migrations
npx sequelize migration run

# Run only the next 2 pending migrations
npx sequelize migration run --step=2

# Run all pending migrations up to (and including) a specific one
npx sequelize migration run --to=2026-01-02-create-posts
```

#### JSON output

```bash
npx sequelize migration run --json
# { "migrated": ["2026-01-01-create-users", "2026-01-02-create-posts"] }
```

---

### `migration undo`

Reverts executed migrations.

```bash
npx sequelize migration undo [--step=<n>] [--all] [--to=<name>]
```

**Flags:**

| Flag     | Default | Description                                                                               |
| -------- | ------- | ----------------------------------------------------------------------------------------- |
| `--step` | `1`     | Number of migrations to revert. Cannot be combined with `--all` or `--to`.                |
| `--all`  | `false` | Revert all executed migrations.                                                           |
| `--to`   | —       | Revert migrations down to and including this migration. Cannot be combined with `--step`. |

**Examples:**

```bash
# Revert the last executed migration
npx sequelize migration undo

# Revert the last 3 executed migrations
npx sequelize migration undo --step=3

# Revert all executed migrations
npx sequelize migration undo --all

# Revert down to (and including) a specific migration
npx sequelize migration undo --to=2026-01-02-create-posts
```

#### JSON output

```bash
npx sequelize migration undo --json
# { "reverted": ["2026-01-03-create-comments"] }
```

---

### `migration status`

Shows which migrations have been executed and which are pending.

```bash
npx sequelize migration status
```

**Example output:**

```
Executed migrations:
  ✔ 2026-01-01-create-users
  ✔ 2026-01-02-create-posts

Pending migrations:
  ○ 2026-01-03-create-comments
```

#### JSON output

```bash
npx sequelize migration status --json
# { "migrated": ["2026-01-01-create-users", "2026-01-02-create-posts"], "pending": ["2026-01-03-create-comments"] }
```

---

## Writing migrations

Each migration must export an `up` function (to apply the change) and an optional `down` function (to revert it). The `down` function is only required if you use `migration undo`.

JavaScript migration functions receive a context object containing a `sequelize` instance.

The main tools for writing JavaScript migrations are the methods available on [`sequelize.queryInterface`](./other-topics/query-interface.md),
which provides a dialect-agnostic API for modifying the database schema and data.
You can also execute raw SQL queries with [`sequelize.query`](./querying/raw-queries.mdx).

:::danger

Never use Models inside migrations, as they do not reflect the current state of the database.

:::

### TypeScript

```ts title="migrations/2026-01-01t00-00-00-create-users.ts"
import type { UmzugContext } from '@sequelize/cli';

export async function up({ sequelize }: UmzugContext): Promise<void> {
  await sequelize.queryInterface.createTable('users', {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    name: { type: 'VARCHAR(255)', allowNull: false },
    email: { type: 'VARCHAR(255)', allowNull: false, unique: true },
  });
}

export async function down({ sequelize }: UmzugContext): Promise<void> {
  await sequelize.queryInterface.dropTable('users');
}
```

### ESM (`.mjs`)

```js title="migrations/2026-01-01t00-00-00-create-users.mjs"
/** @type {import('@sequelize/cli').MigrationFunction} */
export async function up({ sequelize }) {
  await sequelize.queryInterface.createTable('users', {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    name: { type: 'VARCHAR(255)', allowNull: false },
    email: { type: 'VARCHAR(255)', allowNull: false, unique: true },
  });
}

/** @type {import('@sequelize/cli').MigrationFunction} */
export async function down({ sequelize }) {
  await sequelize.queryInterface.dropTable('users');
}
```

### CommonJS (`.cjs`)

```js title="migrations/2026-01-01t00-00-00-create-users.cjs"
'use strict';

module.exports = {
  /** @type {import('@sequelize/cli').MigrationFunction} */
  async up({ sequelize }) {
    await sequelize.queryInterface.createTable('users', {
      id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
      name: { type: 'VARCHAR(255)', allowNull: false },
      email: { type: 'VARCHAR(255)', allowNull: false, unique: true },
    });
  },

  /** @type {import('@sequelize/cli').MigrationFunction} */
  async down({ sequelize }) {
    await sequelize.queryInterface.dropTable('users');
  },
};
```

### SQL

SQL migrations are directories containing an `up.sql` file and optionally a `down.sql` file. Both files contain raw SQL that is executed directly against the database.

```sql title="migrations/2026-01-01t00-00-00-create-users/up.sql"
CREATE TABLE users (
   id    INTEGER PRIMARY KEY AUTOINCREMENT,
   name  VARCHAR(255) NOT NULL,
   email VARCHAR(255) NOT NULL UNIQUE
);
```

```sql title="migrations/2026-01-01t00-00-00-create-users/down.sql"
DROP TABLE users;
```

If there is no `down.sql` file, `migration undo` will throw an error for that migration.

:::tip

The CLI also supports flat `.sql` files (e.g. `migrations/2026-01-01t00-00-00-create-users.sql`) as up-only migrations. These cannot be reverted.

:::

---

## Seed commands

Seeds are files used to populate your database with sample or test data. The CLI can generate seed file scaffolds in the same formats as migrations.

:::note

The CLI currently only provides a `seed generate` command. Running and reverting seeds is not yet built into the CLI.

:::

### `seed generate`

Generates a new seed file in the configured `seedFolder`.

```bash
npx sequelize seed generate --format=<sql|typescript|cjs|esm> [--name=<name>]
```

**Flags:**

| Flag       | Required | Default     | Description                                             |
| ---------- | -------- | ----------- | ------------------------------------------------------- |
| `--format` | Yes      | —           | File format: `sql`, `typescript`, `cjs`, or `esm`.      |
| `--name`   | No       | `"unnamed"` | A short descriptive name, used as part of the filename. |

**Examples:**

```bash
npx sequelize seed generate --format=typescript --name=demo-users
npx sequelize seed generate --format=sql --name=demo-users
```

#### JSON output

```bash
npx sequelize seed generate --format=typescript --name=demo-users --json
# { "path": "/path/to/seeds/2026-04-12t14-30-00-demo-users.ts" }
```

---

## Writing seeds

Seed files follow the same structure as migration files: they export `up` and `down` functions.

### TypeScript

```ts title="seeds/2026-01-01t00-00-00-demo-users.ts"
import type { UmzugContext } from '@sequelize/cli';

export async function up({ sequelize }: UmzugContext): Promise<void> {
  await sequelize.queryInterface.bulkInsert('users', [
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' },
  ]);
}

export async function down({ sequelize }: UmzugContext): Promise<void> {
  await sequelize.queryInterface.bulkDelete('users', {});
}
```

### SQL

```sql title="seeds/2026-01-01t00-00-00-demo-users/up.sql"
INSERT INTO users (name, email) VALUES
  ('Alice', 'alice@example.com'),
  ('Bob',   'bob@example.com');
```

```sql title="seeds/2026-01-01t00-00-00-demo-users/down.sql"
DELETE FROM users WHERE email IN ('alice@example.com', 'bob@example.com');
```

---

## Interactive mode

By default, the CLI runs in interactive mode. When a required flag is not provided on the command line, you will be prompted to enter it.

To disable interactive prompts (e.g. in CI), pass `--no-interactive`:

```bash
npx sequelize migration generate --format=typescript --name=create-users --no-interactive
```

---

## JSON output

All commands support a `--json` flag that outputs the result as machine-readable JSON instead of human-readable text. This is useful for scripting or programmatic integration.

```bash
npx sequelize migration run --json
npx sequelize migration undo --json
npx sequelize migration status --json
npx sequelize migration generate --format=sql --name=create-users --json
npx sequelize seed generate --format=typescript --name=demo-users --json
```

When a command fails, the JSON output will contain an `error` object:

```json
{ "error": { "message": "Migration folder not found at path \"/app/migrations\"" } }
```

---

## Programmatic API

All CLI functionality is also available as a Node.js API exported from `@sequelize/cli`. This allows you to integrate Sequelize migrations directly into your application code or custom scripts.

```ts
import {
  runMigrations,
  undoMigrations,
  getMigrationStatus,
  generateMigration,
  generateSeed,
} from '@sequelize/cli';

// Run all pending migrations
const applied = await runMigrations();

// Run up to a specific migration
await runMigrations({ to: '2026-01-02-create-posts' });

// Run only 1 pending migration
await runMigrations({ step: 1 });

// Undo the last migration (default)
await undoMigrations();

// Undo the last 3 migrations
await undoMigrations({ step: 3 });

// Undo all migrations
await undoMigrations({ to: 0 });

// Undo down to (and including) a specific migration
await undoMigrations({ to: '2026-01-02-create-posts' });

// Check migration status
const { executed, pending } = await getMigrationStatus();

// Generate a new migration file
const migrationPath = await generateMigration({
  format: 'typescript',
  migrationName: 'create-users',
  migrationFolder: '/app/migrations',
});

// Generate a new seed file
const seedPath = await generateSeed({
  format: 'typescript',
  seedName: 'demo-users',
  seedFolder: '/app/seeds',
});
```
