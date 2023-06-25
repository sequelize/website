---
sidebar_position: 1
title: INSERT Queries
---

# Creating new records

:::note

This guide assumes you understand [how to create models](../models/defining-models.mdx).
In the examples below, we will use the `User` class, which is a Model.

:::

## Inserting a single entity

The simplest way to create a new record is to use the [`create`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#create) method of your model:

```ts
// Create a new user
const jane = await User.create({ firstName: "Jane", lastName: "Doe" });
// by this point, the user has been saved to the database!
console.log("Jane's auto-generated ID:", jane.id);
```

The [`Model.create()`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#create) method is a shorthand
for building an unsaved instance with [`Model.build()`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#build) then
saving the instance with [`instance.save()`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#save). You can do the individual steps yourself if you need more control:

```ts
const jane = User.build({ firstName: "Jane", lastName: "Doe" });

// "jane" has not been saved to the database yet!
// You can change any of its properties here, and call `save()` later to persist them all at once.

await jane.save();

// "jane" is now saved to the database!
```

Note, from the usage of `await` in the snippet above, that `save` is an asynchronous method. In fact, almost every Sequelize method is asynchronous; `build` is one of the very few exceptions.

## `findOrCreate`

The method [`findOrCreate`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#findOrCreate) will create an entry in the table unless it can find one fulfilling the query options. In both cases, it will return an instance (either the found instance or the created instance) and a boolean indicating whether that instance was created or already existed.

The `where` option is considered for finding the entry, and the `defaults` option is used to define what must be created in case nothing was found. If the `defaults` do not contain values for every column, Sequelize will take the values given to `where` (if present).

Let's assume we have an empty database with a `User` model which has a `username` and a `job`.

```js
const [user, created] = await User.findOrCreate({
  where: { username: 'sdepold' },
  defaults: {
    job: 'Technical Lead JavaScript'
  }
});

console.log(user.username); // 'sdepold'
console.log(user.job); // This may or may not be 'Technical Lead JavaScript'
console.log(created); // The boolean indicating whether this instance was just created
if (created) {
  console.log(user.job); // This will certainly be 'Technical Lead JavaScript'
}
```

:::caution

[`findOrCreate`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#findOrCreate) wraps its operations in a transaction (or a savepoint if a transaction is already in progress).  
You may want to use [`findCreateFind`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#findCreateFind) instead if you want to avoid this. 

[`findOrBuild`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#findOrBuild) is also available if you want to avoid saving the new instance.

:::

## Inserting in bulk

Sequelize provides the `Model.bulkCreate` method to allow creating multiple records at once, with only one query.

The usage of `Model.bulkCreate` is very similar to `Model.create`, by receiving an array of objects instead of a single object.

```ts
const captains = await Captain.bulkCreate([
  { name: 'Jack Sparrow' },
  { name: 'Davy Jones' }
]);

console.log(captains.length); // 2
console.log(captains[0] instanceof Captain); // true
console.log(captains[0].name); // 'Jack Sparrow'
console.log(captains[0].id); // 1 (or another auto-generated value)
```

If you are accepting values directly from the user, it might be beneficial to limit the columns that you want to actually insert. 
To support this, `bulkCreate()` accepts a `fields` option, an array defining which fields must be considered (the rest will be ignored).

```ts
await User.bulkCreate([
  { username: 'foo' },
  { 
    username: 'bar', 
    // highlight-start
    // This property will be ignored, because it is not listed in the "fields" option
    admin: true 
    // highlight-end
  },
], { fields: ['username'] });
```

## Inserting Associated Records

:::note

This section assumes you understand [how to associate models](../associations/basics.md).

:::

If two models are associated, you can create both instances in one go by using the `include` option,
which is available on the `create` method.

In the following example, we want to immediately assign an `Address` to a `User`, as soon as a `User` is created.

```ts
await User.create({
  name: 'Mary Read',
  // highlight-start
  address: {
    // you can specify the attributes of the associated model you want to create
    city: 'Nassau',
    country: 'Bahamas'
  },
  // highlight-end
}, {
  // highlight-start
  // you must specify which associated models must be created here
  include: ['address'],
  // highlight-end
})
```

:::tip

If your association's type is [`HasMany`](../associations/has-many.md) or [`BelongsToMany`](../associations/belongs-to-many.md),
you can create multiple associated models at once:

```ts
await User.create({
  name: 'Mary Read',
  // highlight-start
  addresses: [
    {
      city: 'Nassau',
      country: 'Bahamas',
    },
    {
      city: 'London',
      country: 'England',
    }
  ],
  // highlight-end
}, {
  // highlight-start
  include: ['addresses'],
  // highlight-end
})
```

:::

:::caution

The feature described above only works if you need to create the associated model, and not if you need to associate an existing model.

If you need to associate an existing model upon creation of the main model,
you must specify its foreign key (when possible), or associate it after creation:

```ts
const address = await Address.create();

// This will not work
await User.create({
  name: 'Mary Read',
  // error-next-line
  address,
});

// This will work (assuming the foreign key is on User, and not Address)
await User.create({
  name: 'Mary Read',
  // success-next-line
  addressId: address.id,
});

// This also works (no matter where the foreign key is)
await User.create({
  name: 'Mary Read',
})

// success-next-line
await user.setAddress(address);
```

We intend on improving this feature in a future version of Sequelize. 
Read more on this on [issue #15233](https://github.com/sequelize/sequelize/issues/15233)

:::
