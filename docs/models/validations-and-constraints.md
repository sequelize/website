---
sidebar_position: 6
title: Validations & Constraints
---

[Validations](#validators) are checks performed by Sequelize, **in pure JavaScript**.  
They can be arbitrarily complex if you provide a custom validator function, 
or can be one of the [built-in validators](#attribute-validators) offered by Sequelize.  
If validation fails, no SQL query will be sent to the database at all.

[Constraints](#constraints) are rules defined **at the SQL level** and are enforced by the Database.  
Common examples are `UNIQUE`. `NOT NULL` and foreign key constraints.

## Not Null Constraints

We already talked about Not Null Constraints in the [section about Defining Models](./defining-models.mdx#nullability).
Using the [`@NotNull`] decorator, you can define a Not Null Constraint on a column.

Sequelize also automatically adds a Not Null Validator to the attribute, meaning the Sequelize will also validate that the attribute is not null
before sending the query to the database.

If an attempt is made to set `null` to an attribute that does not allow null, a [`ValidationError`] will be thrown *without any SQL query being performed*.

## Unique Constraints

Unique constraints are created as unique indexes in the database. Read more about them in the [documentation on Indexes](./indexes.md#unique-indexes).

## Foreign Key Constraints

There are two ways of defining foreign key constraints in Sequelize:

- By [defining an association](../associations/basics.md) between two models (**recommended**).
- Using the [`references`](pathname:///api/v7/interfaces/_sequelize_core.index.ForeignKeyOptions.html#references) option of the [`@Attribute`] decorator.

## Check Constraints

:::note

Sequelize does not provide any way to declare Check Constraints on tables yet, but you can use the low-level [`QueryInterface#addConstraint`] API to add one yourself.

We plan on adding a way to easily declare check constraints on models. See [issue #11211](https://github.com/sequelize/sequelize/issues/11211).

:::

This example showcases how to add a check constraint after a table has been created though [`sync`](./model-synchronization.md):

```ts
import { Sequelize, Model, InferAttributes, InferCreationAttributes } from '@sequelize/core';
import { NotNull, Attribute, AfterSync } from '@sequelize/core/decorators-legacy';

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  @Attribute(DataTypes.STRING)
  @NotNull
  declare email: string;

  @AfterSync
  static async onSync() {
    // highlight-next-line
    await this.sequelize.queryInterface.addConstraint(this.table, {
      fields: ['email'],
      type: 'check',
      where: {
        email: {
          [Op.like]: '%@sequelizejs.com',
        },
      },
    });
  }
}

const sequelize = new Sequelize('sqlite::memory:', { 
  models: [User],
});

await sequelize.sync();
```

:::caution

We do not recommend using `sync` in production, as it can lead to data loss. See [Model Synchronization](./model-synchronization.md) for more information.

:::

## Validators

Validators are JavaScript functions that are run before an instance is persisted or updated in the database. 
You can also run validators manually using [`Model#validate`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#validate).

### Attribute validators

Attribute validators are used to validate the value of a single attribute.
Sequelize provides a number of built-in validators, through extra packages, but you can also define your own.

Sequelize provides the [`@ValidateAttribute`] decorator to define custom validators.

```ts
import { Model, DataTypes } from '@sequelize/core';
import { Attribute, NotNull, ValidateAttribute } from '@sequelize/core/decorators-legacy';

class User extends Model {
  @Attribute(DataTypes.STRING)
  @NotNull
  // highlight-start
  @ValidateAttribute((value: unknown, user: User, attributeName: string) => {
    // this function will run when this attribute is validated.
    if (name.length === 0) {
      throw new Error('Name cannot be empty');
    }
  })
  // highlight-end
  declare name: string;
}
```

### `@sequelize/validator.js`

The [`@sequelize/validator.js`](https://www.npmjs.com/package/@sequelize/validator.js) package provides a number validators 
based on the [`validator.js`](https://www.npmjs.com/package/validator) package, such as email validation and regex matching.

__⚠️ As indicated in the validator.js documentation, the library validates and sanitizes strings only.__

```ts
import { Model, DataTypes } from '@sequelize/core';
import { Attribute, NotNull } from '@sequelize/core/decorators-legacy';
import { IsEmail } from '@sequelize/validator.js';

class User extends Model {
  @Attribute(DataTypes.STRING)
  @NotNull
  // highlight-next-line
  @IsEmail
  declare email: string;
}
```

Head to [its TypeDoc page](pathname:///api/v7/modules/_sequelize_validator_js.html) for the list of available validators.

:::note Future development

We're working on adding support for more validation libraries, see [issue #15497](https://github.com/sequelize/sequelize/issues/15497).

:::

### Model validators

You can also define validators that run on the whole model, rather than on a single attribute.

Model validator methods are called with the model object's context and are deemed to fail if they throw an error, otherwise pass. 
This is just the same as with custom attribute-specific validators.

For example, you could ensure that either `latitude` and `longitude` are both set, or neither are.

```ts
class Place extends Model {
  @Attribute(DataTypes.INTEGER)
  declare latitude: number | null;

  @Attribute(DataTypes.INTEGER)
  declare longitude: number | null;
  
  // highlight-start
  @ModelValidator
  static validateCoords() {
    if ((this.latitude === null) !== (this.longitude === null)) {
      throw new Error('Either both latitude and longitude, or neither!');
    }
  }
  // highlight-end
}
```

If you need to validate an attribute based on the value of another attribute, we highly recommend using Model Validators instead of Attribute Validators,
because Model Validators are always run, while Attribute Validators are only run if the attribute's value has changed.

:::caution

As stated above, model validators are always run.

If you did not load every attribute of a model, and you have a model validator that depends on an attribute that was not loaded,
it will still run but the attribute will be `undefined`. Make sure your model validator can handle this case (for instance, by stopping validation if the attribute is `undefined`).

:::

### Asynchronous validators

Both attribute and model validators can be asynchronous. To do so, simply return a promise from the validator function.

This makes it possible to, for instance, load data from the database to validate the model. Be aware that _this can have serious impacts on your application's performance_.

### Validation of nullable attributes

The nullability validation takes precedence over the attribute validation. If the value of an attribute is null, its [__attribute validators__](#attribute-validators) are not executed. 
Only its nullability validation is run.

On the other hand, [__model validators__](#model-validators) are always executed, even if the value of an attribute is null.
This means that you can use model validators to implement custom nullability validation:

```ts
import { Model, DataTypes } from '@sequelize/core';
import { Attribute, NotNull } from '@sequelize/core/decorators-legacy';
import { IsEmail } from '@sequelize/validator.js';

class User extends Model {
  @Attribute(DataTypes.STRING)
  declare name: string | null;

  @Attribute(DataTypes.INTEGER)
  declare age: number;

  // highlight-start
  @ModelValidator
  static onValidate() {
    if (this.name === null && this.age !== 10) {
      throw new Error("name can't be null unless age is 10");
    }
  }
  // highlight-end
}
```

[`Model`]: pathname:///api/v7/classes/_sequelize_core.index.Model.html
[`@Table`]: pathname:///api/v7/functions/_sequelize_core.decorators_legacy.Table.html
[`@Attribute`]: pathname:///api/v7/functions/_sequelize_core.decorators_legacy.Attribute.html
[`@NotNull`]: pathname:///api/v7/functions/_sequelize_core.decorators_legacy.NotNull.html
[`@Default`]: pathname:///api/v7/functions/_sequelize_core.decorators_legacy.Default.html
[`@PrimaryKey`]: pathname:///api/v7/functions/_sequelize_core.decorators_legacy.PrimaryKey.html
[`@AutoIncrement`]: pathname:///api/v7/functions/_sequelize_core.decorators_legacy.AutoIncrement.html
[`importModels`]: pathname:///api/v7/functions/_sequelize_core.index.importModels.html
[`import`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import
[`require`]: https://nodejs.org/api/modules.html#requireid
[`CreationOptional`]: pathname:///api/v7/types/_sequelize_core.index.CreationOptional.html
[`fn`]: pathname:///api/v7/variables/_sequelize_core.index.sql.fn.html
[`literal`]: pathname:///api/v7/variables/_sequelize_core.index.sql.literal.html
[`Sequelize`]: pathname:///api/v7/classes/_sequelize_core.index.Sequelize.html
[`ValidationError`]: pathname:///api/v7/classes/_sequelize_core.index.ValidationError.html
[`QueryInterface#addConstraint`]: pathname:///api/v7/classes/_sequelize_core.index.AbstractQueryInterface.html#addConstraint
[`Model#validate`]: pathname:///api/v7/classes/index.Model.html#validate
[`@ValidateAttribute`]: pathname:///api/v7/functions/_sequelize_core.decorators_legacy.ValidateAttribute.html
