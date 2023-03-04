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

## Composite Foreign Keys

Composite foreign keys are not currently supported by Sequelize's associations. See [issue #311](https://github.com/sequelize/sequelize/issues/311) for more information.
