---
sidebar_position: 3
title: Custom Data Types
---

Most likely the type you are trying to implement is already included in our built-in [DataTypes](../models/data-types.mdx).
If the data type you need is not included, this manual will show how to write it yourself, or extend an existing one.

## Creating a new Data Type

A DataType is little more than a class that extends `DataTypes.ABSTRACT`, and implements its `toSql` method:

```typescript
import { Sequelize, DataTypes } from '@sequelize/core';

// All DataTypes must inherit from DataTypes.ABSTRACT.
export class MyDateType extends DataTypes.ABSTRACT {
  // toSql must return the SQL that will be used in a CREATE TABLE statement.
  toSql() {
    return 'TIMESTAMP';
  }
}
```

You can then use your new data type in your models:

```typescript
import { MyDateType } from './custom-types.js';

const sequelize = new Sequelize('sqlite::memory:');

const User = sequelize.define('User', {
  birthday: {
    // highlight-next-line
    type: MyDateType,
  },
}, { timestamps: false, noPrimaryKey: true, underscored: true });

await User.sync();
```

The above will produce the following SQL:

```sql
CREATE TABLE IF NOT EXISTS "users" (
  "birthday" TIMESTAMP
);
```

### Validating user inputs

Right now, our Data Type is very simple. It doesn't do any normalization, and passes values as-is to the database.
It has the same base behavior as if we set our [attribute's type to a string](../models/data-types.mdx#custom-data-types).

You can implement a series of methods to change the behavior of your data type:

- `validate(value): void` - This method is called when setting a value on an instance of your model. If it returns `false`, the value will be rejected.
- `sanitize(value): unknown` - This method is called when setting a value on an instance of your model. It is called before validation. You can use it to normalize a value, such as converting a string to a Date object.
- `areValuesEqual(a, b): boolean` - This method is called when comparing two values of your data type, when determining which attributes of your model need to be saved. 
  If it returns `false`, the new value will be saved. By default, it uses lodash's `isEqual` method.

```typescript
import { Sequelize, DataTypes, ValidationErrorItem } from '@sequelize/core';

export class MyDateType extends DataTypes.ABSTRACT<Date> {
  toSql() {
    return 'TIMESTAMP';
  }
  
  sanitize(value: unknown): unknown {
    if (value instanceof Date) {
      return value;
    }
    
    if (typeof value === 'string') {
      return new Date(value);
    }
    
    throw new ValidationErrorItem('Invalid date');
  }
  
  validate(value: unknown): void {
    if (!(value instanceof Date)) {
      ValidationErrorItem.throwDataTypeValidationError('Value must be a Date object');
    }
    
    if (Number.isNaN(value.getTime())) {
      ValidationErrorItem.throwDataTypeValidationError('Value is an Invalid Date');
    }
  }
  
  sanitize(value: unknown): unknown {
    if (typeof value === 'string') {
      return new Date(value);
    }
  }
}
```

### Serializing & Deserializing

We also have 4 methods that can be implemented to define how the Data Type serializes & deserializes values when interacting with the database:

- `parseDatabaseValue(value): unknown`: Transforms values retrieved from the database[^caveat-1].
- `toBindableValue(value): unknown`: Transforms a value into a value accepted by the connector library when using [bind parameters](../querying/raw-queries.md#bind-parameters).
- `escape(value): string`: Escapes a value for inlining inside of raw SQL, such as when using [replacements](../querying/raw-queries.md#replacements).  
  By default, if `toBindableValue` returns a string, this method will escape that string as a SQL string.

```typescript
import { DataTypes, StringifyOptions } from '@sequelize/core';

export class MyDateType extends DataTypes.ABSTRACT<Date> {
  // [...] truncated example
  
  parseDatabaseValue(value: unknown): Date {
    assert(typeof value === 'string', 'Expected to receive a string from the database');
    
    return new Date(value);
  }

  toBindableValue(value: Date): unknown {
    return value.toISOString();
  }
  
  escape(value: Date, options: StringifyOptions): string {
    return options.dialect.escapeString(value.toISOString());
  }
}
```

## Modifying an existing Data Type

You can inherit the implementation of an existing Data Type to customize its behavior.  
To do so, make your class extend the Data Type you wish to modify instead of `DataTypes.ABSTRACT`.

Note how the following example inherits from `DataTypes.STRING` instead of `DataTypes.ABSTRACT`:

```typescript
import { Sequelize, DataTypes } from '@sequelize/core';

export class MyStringType extends DataTypes.STRING {
  toSql() {
    return 'TEXT';
  }
}
```

Just like with custom data types, use your Data Type class instead of the type you are extending:

```typescript
import { MyStringType } from './custom-types.js';

const sequelize = new Sequelize('sqlite::memory:');

const User = sequelize.define('User', {
  firstName: {
    // highlight-next-line
    type: MyStringType,
  },
}, { timestamps: false, noPrimaryKey: true, underscored: true });

await User.sync();
```

## Limitations

Some dialects support the creation of custom SQL Data Types through the use of the [`CREATE TYPE`](https://www.postgresql.org/docs/current/sql-createtype.html) statement.
This is the case of enums in postgres.

When using `DataTypes.ENUM`, Sequelize will automatically create the enum type in the database. This is not possible for custom types.
If you need to create a custom type, you will need to create it manually in the database before you can use it in one of your models.

[^caveat-1]: `parseDatabaseValue` is only called if a Sequelize Data Type is specified in the query. 
This is the case when using model methods, but not when using [raw queries](../querying/raw-queries.md) or when not specifying the model in [`QueryInterface`](pathname:///api/v7/classes/QueryInterface.html) methods
