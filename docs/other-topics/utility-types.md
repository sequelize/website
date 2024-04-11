# Utility TypeScript Types

## Typing a Model Class

[`ModelStatic`](pathname:///api/v7/types/_sequelize_core.index.modelstatic) is designed to be used to type a Model _class_.

Here is an example of a utility method that requests a Model Class, and returns the list of primary keys defined in that class:

```typescript
import {
  ModelStatic,
  ModelAttributeColumnOptions,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from '@sequelize/core';
import { SqliteDialect } from '@sequelize/sqlite3';

/**
 * Returns the list of attributes that are part of the model's primary key.
 */
export function getPrimaryKeyAttributes(model: ModelStatic<any>): NormalizedAttributeOptions[] {
  const attributes: NormalizedAttributeOptions[] = [];

  for (const attribute of model.modelDefinition.attributes.values()) {
    if (attribute.primaryKey) {
      attributes.push(attribute);
    }
  }

  return attributes;
}

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;
}

const sequelize = new Sequelize({
  dialect: SqliteDialect,
  models: [User],
});

const primaryAttributes = getPrimaryKeyAttributes(User);
```

## Getting a Model's attributes

If you need to access the list of attributes of a given model,
[`Attributes<Model>`](pathname:///api/v7/types/_sequelize_core.index.attributes) and [`CreationAttributes<Model>`](pathname:///api/v7/types/_sequelize_core.index.creationattributes)
are what you need to use.

They will return the Attributes (and Creation Attributes) of the Model passed as a parameter.

Don't confuse them with [`InferAttributes`](pathname:///api/v7/types/_sequelize_core.index.inferattributes)
and [`InferCreationAttributes`](pathname:///api/v7/types/_sequelize_core.index.infercreationattributes). These two utility types should only ever be used
in the definition of a Model to automatically create the list of attributes from the model's public class fields. They only work
with class-based model definitions (when using [`Model.init`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#init)).

[`Attributes<Model>`](pathname:///api/v7/types/_sequelize_core.index.attributes) and [`CreationAttributes<Model>`](pathname:///api/v7/types/_sequelize_core.index.creationattributes)
will return the list of attributes of any model, no matter how they were created (be it [`Model.init`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#init)
or [`Sequelize#define`](pathname:///api/v7/classes/_sequelize_core.index.Sequelize.html#define)).

Here is an example of a utility function that requests a Model Class, and the name of an attribute; and returns the corresponding attribute metadata.

```typescript
import {
  ModelStatic,
  ModelAttributeColumnOptions,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Attributes,
} from '@sequelize/core';

export function getAttributeMetadata<M extends Model>(
  model: ModelStatic<M>,
  attributeName: keyof Attributes<M>,
): ModelAttributeColumnOptions {
  const attribute = model.modelDefinition.attributes.get(attributeName);
  if (attribute == null) {
    throw new Error(`Attribute ${attributeName} does not exist on model ${model.name}`);
  }

  return attribute;
}

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;
}

const sequelize = new Sequelize({
  /* options */
  models: [User],
});

// works!
// success-next-line
const idAttributeMeta = getAttributeMetadata(User, 'id');

// fails because 'name' is not an attribute of User
// error-next-line
const nameAttributeMeta = getAttributeMetadata(User, 'name');
```
