---
sidebar_position: 4
---

# SELECT Queries: Finder Methods

Finder methods are the ones that generate `SELECT` queries. All of the following methods are methods available on [Model classes](../models/defining-models.mdx), and can be called on any model.

## `findAll`

The [`findAll`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#findAll) method is the most basic finder method. 
It returns all the records in the database that match the query.

It generates a standard `SELECT` query which will retrieve all entries from the table (unless restricted by something like a `where` clause, for example).

The following example returns the array of all users in the database whose first name is "John":

```ts
const users = await User.findAll({
  where: {
    firstName: 'John',
  },
});
```

:::info

This method accepts many options, which are described in detail in [the second part of the SELECT queries guide](./select-in-depth.md).

:::

## `findOne`

The [`findOne`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#findAll) method obtains the first entry it finds (that fulfills the optional query options, if provided).  
It is equivalent to using `limit: 1` in a [`findAll`](#findall) query.

```js
const project = await Project.findOne({ where: { title: 'My Title' } });
if (project === null) {
  console.log('Not found!');
} else {
  console.log(project instanceof Project); // true
  console.log(project.title); // 'My Title'
}
```

:::info `rejectOnEmpty`

`findOne` supports a useful option called `rejectOnEmpty`. If set to `true`, it will throw a `SequelizeEmptyResultError` if no entry is found. 
This is useful in TypeScript if you're certain that the entry exists, and want to avoid having to use a redundant `null` check.

```ts
// project will be of type Project, not Project | null
const project = await Project.findOne({ 
  where: { title: 'My Title' }, 
  rejectOnEmpty: true,
});
```

:::

## `findByPk`

The [`findByPk`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#findByPk) method obtains only a single entry from the table, using the provided primary key.

```js
const project = await Project.findByPk(123);
if (project === null) {
  console.log('Not found!');
} else {
  console.log(project instanceof Project); // true
  // Its primary key is 123
}
```

## `findAndCountAll`

The [`findAndCountAll`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#findAndCountAll)  method is a convenience method that combines `findAll` and `count`. This is useful when dealing with queries related to pagination where you want to retrieve data with a `limit` and `offset` but also need to know the total number of records that match the query.

### Interactions with the `group` option

When `group` is not provided, the `findAndCountAll` method returns an object with two properties:

* `count` - an integer - the total number records matching the query
* `rows` - an array of objects - the obtained records

When `group` is provided, the `findAndCountAll` method returns an object with two properties:

* `count` - an array of objects - contains the count in each group and the projected attributes
* `rows` - an array of objects - the obtained records

```js
const { count, rows } = await Project.findAndCountAll({
  where: {
    title: {
      [Op.like]: 'foo%',
    },
  },
  offset: 10,
  limit: 2,
});

console.log(count);
console.log(rows);
```

### Interactions with the `include` option

The `findAndCountAll` utility function supports includes.
Only includes that are marked as `required` will have an impact on `count`.

For example, if you want to find and count all users who have a profile, you could write the following:

```js
User.findAndCountAll({
  include: [
    { model: Profile, required: true },
  ],
  limit: 3,
});
```

## Utility methods

Sequelize also provides a few utility methods.

### `count`

The [`count`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#count) method simply counts the occurrences of elements in the database.

```js
console.log(`There are ${await Project.count()} projects`);

const amount = await Project.count({
  where: {
    id: {
      [Op.gt]: 25
    }
  }
});
console.log(`There are ${amount} projects with an id greater than 25`);
```

### `max`, `min` and `sum`

Sequelize also provides the [`max`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#max), [`min`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#min), and [`sum`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#sum) convenience methods.

Let's assume we have three users, whose ages are 10, 5, and 40.

```js
await User.max('age'); // 40
await User.max('age', { where: { age: { [Op.lt]: 20 } } }); // 10
await User.min('age'); // 5
await User.min('age', { where: { age: { [Op.gt]: 5 } } }); // 10
await User.sum('age'); // 55
await User.sum('age', { where: { age: { [Op.gt]: 5 } } }); // 50
```

## Reloading an instance

You can reload an instance from the database by calling the [`reload`](pathname:///api/v7/classes/_sequelize_core.index.Model.html#reload) **instance** method:

```js
const jane = await User.create({ name: "Jane" });
console.log(jane.name); // "Jane"
jane.name = "Ada";
// the name is still "Jane" in the database
await jane.reload();
console.log(jane.name); // "Jane"
```

The reload call generates a `SELECT` query to get the up-to-date data from the database.

## Fetching as plain objects

By default, the results of all finder methods are instances of the model class (as opposed to being just plain JavaScript objects).
This means that after the database returns the results, Sequelize automatically wraps everything in proper instance objects.
In a few cases, when there are too many results, this wrapping can be inefficient.
To disable this wrapping and receive a plain response instead, pass [`{ raw: true }`](pathname:///api/v7/interfaces/_sequelize_core.index.FindOptions.html#raw) as an option to the finder method.
