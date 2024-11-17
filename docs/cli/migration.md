---
title: Migrations
sidebar_position: 2
---

## Writing a migration

The following skeleton shows a typical migration file.

```js
module.exports = {
  up: (queryInterface, Sequelize) => {
    // logic for transforming into the new state
  },
  down: (queryInterface, Sequelize) => {
    // logic for reverting the changes
  },
};
```

We can generate this file using `migration:generate`. This will create `xxx-migration-example.js` in your migration folder.

```bash
# using npm
npx sequelize-cli migration:generate --name migration-example
# using yarn
yarn sequelize-cli migration:generate --name migration-example
```

The passed `queryInterface` object can be used to modify the database. The `Sequelize` object stores the available data types such as `STRING` or `INTEGER`. The function `up` or `down` should return a `Promise`. Let's look at an example:

```js
const { DataTypes } = require('@sequelize/core');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Person', {
      name: DataTypes.STRING,
      isBetaMember: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Person');
  },
};
```

The following is an example of a migration that performs two changes in the database,
using an automatically managed transaction to ensure that all instructions are successfully executed or rolled back in case of failure:

```js
const { DataTypes } = require('@sequelize/core');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return Promise.all([
        queryInterface.addColumn(
          'Person',
          'petName',
          {
            type: DataTypes.STRING,
          },
          { transaction },
        ),
        queryInterface.addColumn(
          'Person',
          'favoriteColor',
          {
            type: DataTypes.STRING,
          },
          { transaction },
        ),
      ]);
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(transaction => {
      return Promise.all([
        queryInterface.removeColumn('Person', 'petName', { transaction }),
        queryInterface.removeColumn('Person', 'favoriteColor', { transaction }),
      ]);
    });
  },
};
```

The next example is of a migration that has a foreign key. You can use references to specify a foreign key:

```js
const { DataTypes } = require('@sequelize/core');

module.exports = {
  up: queryInterface => {
    return queryInterface.createTable('Person', {
      name: DataTypes.STRING,
      isBetaMember: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: 'users',
            schema: 'schema',
          },
          key: 'id',
        },
        allowNull: false,
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Person');
  },
};
```

The next example is of a migration that uses async/await where you create a unique index on a new column, with a manually-managed transaction:

```js
const { DataTypes } = require('@sequelize/core');

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.startUnmanagedTransaction();
    try {
      await queryInterface.addColumn(
        'Person',
        'petName',
        {
          type: DataTypes.STRING,
        },
        { transaction },
      );
      await queryInterface.addIndex('Person', 'petName', {
        fields: 'petName',
        unique: true,
        transaction,
      });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.startUnmanagedTransaction();
    try {
      await queryInterface.removeColumn('Person', 'petName', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
```

The next example is of a migration that creates a unique index composed of multiple fields with a condition, which allows a relation to exist multiple times but only one can satisfy the condition:

```js
const { DataTypes } = require('@sequelize/core');

module.exports = {
  up: queryInterface => {
    queryInterface
      .createTable('Person', {
        name: DataTypes.STRING,
        bool: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
      })
      .then((queryInterface, Sequelize) => {
        queryInterface.addIndex('Person', ['name', 'bool'], {
          type: 'UNIQUE',
          where: { bool: 'true' },
        });
      });
  },
  down: queryInterface => {
    return queryInterface.dropTable('Person');
  },
};
```

## Running Migrations

Until this step, we haven't inserted anything into the database. We have just created the required model and migration files for our first model, `User`. Now to actually create that table in the database you need to run `db:migrate` command.

```bash
# using npm
npx sequelize-cli db:migrate
# using yarn
yarn sequelize-cli db:migrate
```

This command will execute these steps:

- Will ensure a table called `SequelizeMeta` in the database. This table is used to record which migrations have run on the current database
- Start looking for any migration files that haven't run yet. This is possible by checking `SequelizeMeta` table. In this case, it will run `XXXXXXXXXXXXXX-create-user.js` migration, which we created in the last step.
- Creates a table called `Users` with all columns as specified in its migration file.

## Undoing Migrations

Now our table has been created and saved in the database. With migration, you can revert to the old state by just running a command.

You can use `db:migrate:undo`, this command will revert the most recent migration.

```bash
# using npm
npx sequelize-cli db:migrate:undo
# using yarn
yarn sequelize-cli db:migrate:undo
```

You can revert to the initial state by undoing all migrations with the `db:migrate:undo:all` command. You can also revert to a specific migration by passing its name with the `--to` option.

```bash
# using npm
npx sequelize-cli db:migrate:undo:all --to XXXXXXXXXXXXXX-create-posts.js
# using yarn
yarn sequelize-cli db:migrate:undo:all --to XXXXXXXXXXXXXX-create-posts.js
```
