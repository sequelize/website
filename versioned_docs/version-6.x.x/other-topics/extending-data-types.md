---
title: Extending Data Types
---

Most likely the type you are trying to implement is already included in [DataTypes](./other-data-types.mdx). If a new datatype is not included, this manual will show how to write it yourself.

Sequelize doesn't create new datatypes in the database. This tutorial explains how to make Sequelize recognize new datatypes and assumes that those new datatypes are already created in the database.

To extend Sequelize datatypes, do it before any Sequelize model is created.

## Example

In this example, we will create a type called `SOMETYPE` that replicates the built-in datatype `DataTypes.INTEGER(11).ZEROFILL.UNSIGNED`.

```js
const { Sequelize, DataTypes, Utils } = require('Sequelize');
createTheNewDataType();
const sequelize = new Sequelize('sqlite::memory:');

function createTheNewDataType() {
  // Strange behavior would result if we extended DataTypes.ABSTRACT because
  // it's a class wrapped in a Proxy by Utils.classToInvokable.
  class SOMETYPE extends DataTypes.ABSTRACT.prototype.constructor {
    // Mandatory: set the type key
    static key = 'SOMETYPE';
    key = SOMETYPE.key;

    // Optional: disable escaping after stringifier. Do this at your own risk, since this opens opportunity for SQL injections.
    escape = false

    // Optional: map dialect datatype names (mandatory if not creating dialect-specific datatype classes as in the example below)
    types = {
      postgres: ['pg_new_type'],
      mysql: [ 'mysql_new_type' ],
      mariadb: [ 'mariadb_new_type' ],
      sqlite: [ 'sqlite_new_type' ],
      mssql: false,
      db2: false,
      snowflake: [ 'snowflake_new_type' ],
      oracle: [ 'oracle_new_type' ]
    };

    // Mandatory: complete definition of the new type in the database
    toSql() {
      return 'INTEGER(11) UNSIGNED ZEROFILL'
    }

    // Optional: validator function
    validate(value, options) {
      return (typeof value === 'number') && (!Number.isNaN(value));
    }

    // Optional: sanitizer
    _sanitize(value) {
      // Force all numbers to be positive
      return value < 0 ? 0 : Math.round(value);
    }

    // Optional: value stringifier before sending to database
    _stringify(value) {
      return value.toString();
    }

    // Optional: parser for values received from the database
    static parse(value) {
      return Number.parseInt(value);
    }
  }

  // Optional: add the new type to DataTypes. Optionally wrap it on `Utils.classToInvokable` to
  // be able to use this datatype directly without having to call `new` on it.
  DataTypes.SOMETYPE = Utils.classToInvokable(SOMETYPE);
}
```

After creating this new datatype, you may wish to map this datatype in each database dialect and make some adjustments.

## Dialect-specific customization

If you want to customize parsing, stringifying, etc. on a per-dialect basis then you can create dialect-specific subclasses
of your custom data type and add them to `DataTypes[dialect]`.  Sequelize will replace the base type with `DataTypes[dialect][baseType.key]`.
For example for PostgreSQL:

```js
function createTheNewDataType() {
  class SOMETYPE extends DataTypes.ABSTRACT.prototype.constructor {
    // [...]
  }

  DataTypes.SOMETYPE = Utils.classToInvokable(SOMETYPE);

  const PgTypes = DataTypes.postgres; // or .mysql, .mariadb, .sqlite, .mssql, .db2, .snowflake, .oracle

  // Optional: create a postgres-specific child datatype with its own parse
  // method. The parser will be dynamically mapped to the OID of pg_new_type.

  class PgSOMETYPE extends SOMETYPE {
    // Mandatory: set the type key.  Must match SOMETIME.key or the dialect-specific
    // override won't work!
    static key = SOMETYPE.key;
    key = SOMETYPE.key;

    // Mandatory: map postgres datatype name
    types = { postgres: ['pg_new_type'] };

    // Postgres-specific parser
    static parse(value) {
      // [...]
    }

    // Optional: add or override methods of the postgres-specific datatype
    // like toSql, escape, validate, _stringify, _sanitize...
  }

  // Using classToInvokable is never necessary for dialect-specific types.
  PgTypes.SOMETYPE = PgSOMETYPE;
}
```

### Ranges

After a new range type has been [defined in postgres](https://www.postgresql.org/docs/current/static/rangetypes.html#RANGETYPES-DEFINING), it is trivial to add it to Sequelize.

In this example the name of the postgres range type is `SOMETYPE_range` and the name of the underlying postgres datatype is `pg_new_type`. The key of `subtypes` and `castTypes` is the key of the Sequelize datatype `DataTypes.SOMETYPE.key`, in lower case.

```js
function createTheNewDataType() {
  // [...]

  // Add postgresql range, SOMETYPE comes from DataType.SOMETYPE.key in lower case
  DataTypes.RANGE.types.postgres.subtypes.SOMETYPE = 'SOMETYPE_range';
  DataTypes.RANGE.types.postgres.castTypes.SOMETYPE = 'pg_new_type';
}
```

The new range can be used in model definitions as `DataTypes.RANGE(DataTypes.SOMETYPE)` or `DataTypes.RANGE(DataTypes.SOMETYPE)`.
