---
sidebar_position: 3
title: DELETE Queries
---

:::note

This guide assumes you understand [how to create models](../models/defining-models.mdx).
In the examples below, we will use the `User` class, which is a Model.

:::

## Deleting a single row

You can delete an instance by calling the [`destroy`](pathname:///api/v7/classes/Model.html#destroy) instance method on your model:

```js
const jane = await User.create({ name: "Jane" });
// jane is now in the database
await jane.destroy();
// Now this entry has been removed from the database
```

## Deleting in bulk

Delete queries also accept the `where` option, just like the read queries shown above.

```ts
// Delete everyone named "Jane"
await User.destroy({
  where: {
    firstName: "Jane"
  },
});
```

## Truncating

Models also expose a [`truncate`](pathname:///api/v7/classes/Model.html#truncate) method that will delete all rows in a table.

```js
// Truncate the table
await User.truncate();
```
