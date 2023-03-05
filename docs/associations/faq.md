# Association FAQ

## Multiple associations to the same model

If you need to create multiple [`HasOne`](./has-one.md) or [`HasMany`](./has-many.md) associations to the same model, make sure to name their inverse associations,
otherwise Sequelize will attempt to use the same inverse association for both associations.

```ts
class Person extends Model<InferAttributes<Person>, InferCreationAttributes<Person>> {
  @HasOne(() => DrivingLicense, {
    foreignKey: 'ownerId',
    // highlight-start
    inverse: {
      as: 'owner',
    },
    // highlight-end
  })
  declare currentDrivingLicense?: NonAttribute<DrivingLicense>;
}
```

## Self-references

Any association can be self-referencing. For example, a `Person` model can have a `parent`/`children` association to another `Person` model.

```ts
class Person extends Model<InferAttributes<Person>, InferCreationAttributes<Person>> {
  @BelongsToMany(() => Person, {
    // highlight-start
    inverse: {
      as: 'parents',
    },
    // highlight-end
  })
  declare children?: NonAttribute<Person[]>;
  declare parents?: NonAttribute<Person[]>;
}
```

## Composite Foreign Keys

Composite foreign keys are not currently supported by Sequelize's associations. See [issue #311](https://github.com/sequelize/sequelize/issues/311) for more information.

## Customizing Foreign Keys

Sequelize will generate foreign keys automatically, but you can customize how. The `foreignKey` option (as well as `otherKey` in [`BelongsToMany`](./belongs-to-many.md)) 
can be set to a string to specify the name of the foreign key, or to an object to specify the name of the foreign key and other options.

When set to an object, the `foreignKey` option accepts all options that regular attributes accept, including `allowNull` and `defaultValue`.  
See the [API reference](pathname:///api/v7/interfaces/_sequelize_core.ForeignKeyOptions.html).

```ts
class Person extends Model {
  @HasOne(() => DrivingLicense, {
    foreignKey: {
      name: 'ownerId',
      columnName: 'owner_id',
    },
  })
  declare drivingLicense?: NonAttribute<DrivingLicense>;
}
```

You can also use [Attribute Decorators](../models/defining-models.mdx) on your foreign key attribute:

```ts
class Person extends Model {
  @HasOne(() => DrivingLicense, 'ownerId')
  declare drivingLicense?: NonAttribute<DrivingLicense>;
}

class DrivingLicense extends Model {
  @Attribute({ 
    columnName: 'owner_id',
  })
  declare ownerId: number;
}
```

### `onDelete` and `onUpdate`

One of the most common use cases for customizing foreign keys is to set the `onDelete` and `onUpdate` behaviors.

```ts
class Person extends Model {
  @HasOne(() => DrivingLicense, {
    foreignKey: {
      name: 'ownerId',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  })
  declare drivingLicense?: NonAttribute<DrivingLicense>;
}
```

The possible choices are `RESTRICT`, `CASCADE`, `NO ACTION`, `SET DEFAULT` and `SET NULL`.

By default, Sequelize will set the following values:

- for `ON DELETE`: `SET NULL` if the foreign key is nullable, and `CASCADE` if it is not.
- for `ON UPDATE`: `CASCADE`