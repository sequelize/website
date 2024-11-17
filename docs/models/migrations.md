---
title: Migrations
sidebar_position: 12
---

# Database Schema Upgrades

Once your database has production data that should not be lost,
you cannot follow the `sequelize.sync` approach of dropping the databases
and recreating them with a new schema when you need to make changes.

There are multiple possible approaches to upgrading your database schema.
Which one works best for you will depend on your specific requirements.

## Using Migrations

Migrations are a way to version control your database schema,
allowing you to easily upgrade and downgrade your database as your application evolves.

Sequelize provides [`@sequelize/cli`](../cli), a Command Line Interface that can be used to create and run migrations.
Head to [the `@sequelize/cli` page](../cli.md) for more information on how to write migrations.

Of course, you are free to use any other migration tool:

- [Umzug](https://github.com/sequelize/umzug) is a great alternative that the Sequelize CLI uses under the hood.
- Third-party tools that can be used to help with migrations are also listed on the [Third-Party Resources](../other-topics/resources.md#migrations) page.

## Using a Database Diff Tool

You can use a database diff tool to compare the current database schema with the new schema you want to apply.
One such tool is [pg-diff](https://michaelsogos.github.io/pg-diff/).

In this approach, you would generate a diff as part of your release process and apply it to the database.
