# Sequelize Versioning Policy

Sequelize follows semantic versioning (semver) principles. [Learn more about semver here](https://semver.org/).

This page regroups information related to which engines versions are supported by Sequelize

## Releases

| Sequelize                       | [Node.js][node-releases] | [Typescript][ts-releases] | Release Date | EOL        |
|---------------------------------|--------------------------|---------------------------|--------------|------------|
| [7 (alpha)][sequelize-core]     | >= 14                    | >= 4.4                    | ❓            | ❓          |
| [6 (current)][sequelize-legacy] | >= 10                    | >= 3.9                    | 2020-06-24   | ❓          |
| 5 (eol)                         | >=6                      | >= 3.1                    | 2019-03-13   | 2022-01-01 |

\* ❓ means the date has not been determined yet.

[node-releases]: https://nodejs.org/en/about/releases/
[ts-releases]: https://github.com/microsoft/TypeScript/releases
[sequelize-core]: https://www.npmjs.com/package/@sequelize/core
[sequelize-legacy]: https://www.npmjs.com/package/sequelize

## PostgreSQL Support Table

PostgreSQL requires the use of the [pg][pg] (or [pg-native]) npm package.  
[Read more about this here](/docs/v7/other-topics/dialect-specific-things/#postgresql).

:::note

According to [pg's documentation](https://node-postgres.com/#version-compatibility),
only pg >= 8.2 is compatible with Node 14.  
If you're trying to use Sequelize 6 in Node 14 or newer, use that version of pg.

:::

| Sequelize   | [PostgreSQL][postgres] | [pg]                                         | [pg-native]    |
|-------------|------------------------|----------------------------------------------|----------------|
| 7 (alpha)   | >= 10                  | >= 8.2                                       | >=3.0.0 ⚠️[^1] |
| 6 (current) | >= 9.5                 | >= 7.8 (node < 14) <br/> >= 8.2 (node >= 14) | >=3.0.0        |

[postgres]: https://www.postgresql.org/support/versioning/
[pg]: https://www.npmjs.com/package/pg
[pg-native]: https://www.npmjs.com/package/

## MariaDB Support Table

MariaDB requires the use of the [mariadb][mariadb-npm] npm package.  
[Read more about this here](/docs/v7/other-topics/dialect-specific-things/#mariadb).

| Sequelize   | [MariaDB][mariadb] | [mariadb (npm)][mariadb-npm] |
|-------------|--------------------|------------------------------|
| 7 (alpha)   | >=10.3             | >= 3.0.0 ⚠️[^2]              |
| 6 (current) | >=10.3             | ^2.3.3                       |

[mariadb]: https://mariadb.org/about/#maintenance-policy
[mariadb-npm]: https://www.npmjs.com/package/mariadb

## MySQL Support Table

MySQL requires the use of the [mysql2] npm package.  
[Read more about this here](/docs/v7/other-topics/dialect-specific-things/#mysql).

| Sequelize   | [MySQL][mysql] | [mysql2] |
|-------------|----------------|----------|
| 7 (alpha)   | ^5.7, ^8.0     | >= 2.3.3 |
| 6 (current) | ^5.7, ^8.0     | >= 2.3.3 |

[mysql]: https://endoflife.date/mysql
[mysql2]: https://www.npmjs.com/package/mysql2

## Microsoft SQL Server (mssql) Support Table

MSSQL requires the use of the [tedious] npm package.  
[Read more about this here](/docs/v7/other-topics/dialect-specific-things/#microsoft-sql-server-mssql).

| Sequelize   | [SQL Server][mssql] | [tedious] |
|-------------|---------------------|-----------|
| 7 (alpha)   | 2017, 2019          | ^14.4.0   |
| 6 (current) | 2017, 2019          | ^8.3.0    |

[mssql]: https://endoflife.date/mssqlserver
[tedious]: https://www.npmjs.com/package/tedious

## SQLite Support Table

Sequelize uses the `sqlite3` npm library.  
[Read more about this here](/docs/v7/other-topics/dialect-specific-things/#sqlite).

:::caution

sqlite3 has not been released since february 2021, and has security vulnerabilities and installation issues on newer platforms.

We recommended using the [@vscode/sqlite3](https://github.com/microsoft/vscode-node-sqlite3) fork 
by replacing the version with `npm:@vscode/sqlite3@5.0.7` like in the example below.

It is supported in both v6 & v7.

```json
{
  "dependencies": {
    "sqlite3": "npm:@vscode/sqlite3@5.0.7"
  }
}
```

:::

| Sequelize   | [sqlite3]                                                      |
|-------------|----------------------------------------------------------------|
| 7 (alpha)   | `npm:@vscode/sqlite3@^5.0.7`                                   |
| 6 (current) | `npm:@vscode/sqlite3@^4.0.12`, or `npm:@vscode/sqlite3@^5.0.7` |

[sqlite3]: https://www.npmjs.com/package/@vscode/sqlite3

## Snowflake Support Table

Snowflake requires the use of the [snowflake-sdk] npm package.  
[Read more about this here](/docs/v7/other-topics/dialect-specific-things/#snowflake).

:::note

While this dialect is included in Sequelize,
support for Snowflake is limited as it is not handled by the core team.

:::

| Sequelize   | [Snowflake](https://www.snowflake.com/pricing/) | [snowflake-sdk] |
|-------------|-------------------------------------------------|-----------------|
| 7 (alpha)   | all                                             | ^1.6.0          |
| 6 (current) | all                                             | ^1.6.0          |

[snowflake-sdk]: https://www.npmjs.com/package/snowflake-sdk

## Db2 Support Table

Db2 requires the use of the [ibm_db] npm package.  
[Read more about this here](/docs/v7/other-topics/dialect-specific-things/#db2).

:::note

While this dialect is included in Sequelize,
support for Db2 is limited as it is not handled by the core team.

:::

| Sequelize   | [Db2][db2] | [ibm_db] |
|-------------|------------|----------|
| 7 (alpha)   | >= 11.5    | ^2.8.0   |
| 6 (current) | >= 11.5    | ^2.8.0   |

[db2]: https://www.ibm.com/support/pages/db2-distributed-end-support-eos-dates
[ibm_db]: https://www.npmjs.com/package/ibm_db

## Db2 for IBM i Support Table

*Db2 for IBM i* requires the use of the [odbc] npm package.  
[Read more about this here](/docs/v7/other-topics/dialect-specific-things/#db2-for-ibm-i).

:::note

While this dialect is included in Sequelize,
support for *Db2 for IBM i* is limited as it is not handled by the core team.

:::

| Sequelize   | [Db2 for IBM i][ibmi] | [odbc]        |
|-------------|-----------------------|---------------|
| 7 (alpha)   | unknown               | ^2.4.0        |
| 6 (current) | not available         | not available |

[ibmi]: https://www.ibm.com/support/pages/db2-ibm-i
[odbc]: https://www.npmjs.com/package/odbc

[^1]: `pg-native` [hasn't had a release since 2018](https://www.npmjs.com/package/pg-native).
Sequelize will still test against it, but its reliability is degraded in Node >=17.
[^2]: Support for mariadb 3 has not been completed yet https://github.com/sequelize/sequelize/pull/14187
