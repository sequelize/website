---
sidebar_position: 2
title: UPDATE Queries
---

:::note

This guide assumes you understand [how to create models](../models/defining-models.mdx).
In the examples below, we will use the `User` class, which is a Model.

:::

## Updating a row using `Model#save`

If you change the value of an instance's attribute, calling [`save`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#save) again will update it accordingly.

`save()` will persist any other changes that have been made on this instance since it was retrieved, or last saved.

```ts
const jane = await User.create({ name: 'Jane' });
// the user is currently named "Jane" in the database
jane.name = 'Ada';
// the name is still "Jane" in the database
await jane.save();
// Now their name has been updated to "Ada" in the database!
```

Note that if no changes have been made to the instance, `save` will not do anything.

:::warning A word about how `save` detects changes

`save` is unable to detect changes to nested objects.
While you can re-assign an attribute, you should consider the attribute value immutable: replace it with a new object instead of mutating it.

Instead of doing the following:

```ts
const jane = await User.create({ name: 'Jane', role: ['admin'] });

// `save` will not be able to detect this change, because `role` was mutated
// error-next-line
jane.role.push('admin');

await jane.save();
```

Do this:

```ts
const jane = await User.create({ name: 'Jane', role: ['admin'] });

// `save` will be able to detect this change, because `role` has been replaced
// success-next-line
jane.role = [...jane.role, 'admin'];

await jane.save();
```

Alternatively, you can use [`Model#changed`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#changed) to force `save` to consider it changed:

```ts
const jane = await User.create({ name: 'Jane', role: ['admin'] });

jane.role.push('admin');
// this makes `save` aware that `role` has changed
// success-next-line
jane.changed('role', true);

await jane.save();
```

:::

You can modify several fields at once with the [`set`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#set) method:

```ts
const jane = await User.create({ name: 'Jane' });

jane.set({
  name: 'Ada',
  favoriteColor: 'blue',
});

// both the name and the favoriteColor have been updated locally,
// but won't be saved to the database until you call save()

await jane.save();
```

### Saving only some fields

It is possible to define which attributes should be saved when calling `save`, by passing an array of column names.

This is useful when you set attributes based on a previously defined object.
For example, when you get the values of an object from a web app form.

This is what it looks like:

```js
const jane = await User.create({ name: 'Jane' });
console.log(jane.name); // "Jane"
console.log(jane.favoriteColor); // "green"
jane.name = 'Jane II';
jane.favoriteColor = 'blue';
await jane.save({ fields: ['name'] });
console.log(jane.name); // "Jane II"
console.log(jane.favoriteColor); // "blue"
// The above printed blue because the local object has it set to blue, but
// in the database it is still "green":
await jane.reload();
console.log(jane.name); // "Jane II"
console.log(jane.favoriteColor); // "green"
```

## Updating a row using `Model#update`

Models have an **instance method** called [`update`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#update-1) that can be used as
an alternative way to update a single record in the database.

Unlike [`save`](#updating-a-row-using-modelsave), `update` only updates the fields that you specify.
It does not save any other changes that have been made on this instance since it was retrieved, or last saved:

```ts
const jane = await User.create({ name: 'Jane' });
jane.favoriteColor = 'blue';
await jane.update({ name: 'Ada' });
// The database now has "Ada" for name, but still has the default "green" for favorite color
await jane.save();
// Now the database has "Ada" for name and "blue" for favorite color
```

## Updating in bulk

Sequelize also provides a **static Model method** called [`update`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#update-1) to update multiple records at once:

```ts
// Change everyone without a last name to "Doe"
await User.update(
  { lastName: 'Doe' },
  {
    where: {
      lastName: null,
    },
  },
);
```

## Incrementing and decrementing integer values

In order to increment/decrement values of an instance without running into concurrency issues,
Sequelize provides the [`increment`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#increment) and [`decrement`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#decrement) instance methods.

```js
const jane = await User.create({ name: 'Jane', age: 100 });
const incrementResult = await jane.increment('age', { by: 2 });
// Note: to increment by 1 you can omit the `by` option and just do `user.increment('age')`

// In PostgreSQL, `incrementResult` will be the updated user, unless the option
// `{ returning: false }` was set (and then it will be undefined).

// In other dialects, `incrementResult` will be undefined. If you need the updated instance, you will have to call `user.reload()`.
```

You can also increment multiple fields at once:

```js
const jane = await User.create({ name: 'Jane', age: 100, cash: 5000 });
await jane.increment({
  age: 2,
  cash: 100,
});

// If the values are incremented by the same amount, you can use this other syntax as well:
await jane.increment(['age', 'cash'], { by: 2 });
```

Decrementing works in the exact same way.

:::info Tip!

The same methods are also available as static methods on the model, which will update all instances that match the given criteria:

- [`Model.increment`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#increment-1)
- [`Model.decrement`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#decrement-1)

:::
