---
title: Hooks
---

Hooks are events that you can listen to, and which are triggerred when their corresponding method is called.

They are useful for adding custom functionality to the core of the application.
For example, if you want to always set a value on a model before saving it, you can listen to the Model `beforeUpdate` hook.

## Static Sequelize Hooks

The `Sequelize` class supports the following hooks:

| Hook name                  | Async | Run when                        |
|----------------------------|-------|---------------------------------|
|  `beforeInit`, `afterInit` | ❌     | A sequelize instance is created |

Example:

```typescript
import { Sequelize } from '@sequelize/core';

Sequelize.hooks.addListener('beforeInit', () => {
  console.log('A new sequelize instance is being created');
});
```

## Instance Sequelize Hooks

`Sequelize` instances support the following hooks:

| Hook name                             | Async | Run when                                                   |
|---------------------------------------|-------|------------------------------------------------------------|
| `beforeDefine`, `afterDefine`         | ❌     | A new `Model` class is being registered                    |
| `beforeQuery`, `afterQuery`           | ✅     | A SQL query is being run                                   |
| `beforeBulkSync`, `afterBulkSync`     | ✅     | `sequelize.sync` is called                                 |
| `beforeConnect`, `afterConnect`       | ✅     | Whenever a new connection to the database is being created |
| `beforeDisconnect`, `afterDisconnect` | ✅     | Whenever a connection to the database is being closed      |

:::info

All [Model hooks](#model-sequelize-hooks) are also fired on the sequelize instance:

```typescript
import { Sequelize } from '@sequelize/core';

const sequelize = new Sequelize(/* options */);

// This will be called whenever findAll is called on any model.
sequelize.hooks.addListener('beforeFind', () => {
  console.log('findAll has been called a model');
});
```

:::

### Registering Sequelize hooks

Instance Sequelize hooks can be registered in two ways:

1. Using the `hooks` property of the `Sequelize` instance:
   ```typescript
   import { Sequelize } from '@sequelize/core';
  
   const sequelize = new Sequelize(/* options */);
  
   // highlight-next-line
   sequelize.hooks.addListener('beforeDefine', () => {
     console.log('A new Model is being initialized');
   });
   ```
2. Through the `Sequelize` options:
   ```typescript
   import { Sequelize } from '@sequelize/core';
  
   const sequelize = new Sequelize({
     // highlight-next-line
     hooks: {
       beforeDefine: () => {
         console.log('A new Model is being initialized');
       },
     },
   });
   ```

## Model Sequelize Hooks

`Model` classes support the following hooks:

| Hook name                                                                              | Async | Run when                                                                        |
|----------------------------------------------------------------------------------------|-------|---------------------------------------------------------------------------------|
| `beforeAssociate`, `afterAssociate`                                                    | ❌     | Whenever an association is declared on the model                                |
| `beforeSync`, `afterSync`                                                              | ✅     | When `sequelize.sync` or `Model.sync` are called                                |
| `beforeValidate`, `afterValidate`, `validationFailed`                                  | ✅     | When the model's attributes are being validated (happens in most model methods) |
| `beforeFind`, `beforeFindAfterExpandIncludeAll`, `beforeFindAfterOptions`, `afterFind` | ✅     | When `Model.findAll` is called[^find-all]                                       |
| `beforeCount`                                                                          | ✅     | When `Model.count` is called                                                    |
| `beforeUpsert`, `afterUpsert`                                                          | ✅     | When `Model.upsert` is called                                                   |
| `beforeBulkCreate`, `afterBulkCreate`                                                  | ✅     | When `Model.bulkCreate` is called                                               |
| `beforeBulkDestroy`, `afterBulkDestroy`                                                | ✅     | When `Model.destroy` is called                                                  |
| `beforeDestroy`, `afterDestroy`                                                        | ✅     | When `Model#destroy` is called                                                  |
| `beforeBulkRestore`, `afterBulkRestore`                                                | ✅     | When `Model.restore` is called                                                  |
| `beforeRestore`, `afterRestore`                                                        | ✅     | When `Model#restore` is called                                                  |
| `beforeBulkUpdate`, `afterBulkUpdate`                                                  | ✅     | When `Model.update` is called                                                   |
| `beforeUpdate`, `afterUpdate`                                                          | ✅     | When `Model#update` or `Model#save` is called (and the model isn't new)         |
| `beforeCreate`, `afterCreate`                                                          | ✅     | When `Model#save` is called (and the model is new)                              |
| `beforeSave`, `afterSave`                                                              | ✅     | When `Model#update` or `Model#save` is called                                   |

### Registering Model hooks

Instance Sequelize hooks can be registered in three ways:

1. Using the `hooks` property of the `Sequelize` instance:
   ```typescript
   import { Sequelize, DataTypes } from '@sequelize/core';
    
   const sequelize = new Sequelize(/* options */);
    
   const MyModel = sequelize.define('MyModel', {
     name: DataTypes.STRING,
   });
   
   // highlight-next-line
   MyModel.hooks.addListener('beforeFind', () => {
     console.log('findAll has been called on MyModel');
   });
   ```
2. Through the options of `Model.init`, or `sequelize.define`:
   ```typescript
   import { DataTypes } from '@sequelize/core';

   const MyModel = sequelize.define('MyModel', {
     name: DataTypes.STRING,
   }, {
     // highlight-next-line
     hooks: {
       beforeFind: () => {
         console.log('findAll has been called on MyModel');
       },
     },
   });
   ```
3. Using decorators
   ```typescript
   import { Sequelize, Model, Hook } from '@sequelize/core';
   import { BeforeFind } from '@sequelize/core/decorators-legacy';
   
   export class MyModel extends Model {
     // highlight-next-line
     @BeforeFind
     static logFindAll() {
       console.log('findAll has been called on MyModel');
     }
   }
   ```

## Sync vs Async Hooks

In the tables above, you can see that some hooks are marked as `Async`. 
This means that your listener can return a `Promise` that will be awaited before continuing with the execution of the hook.

Be careful about doing async operations in hooks. Hooks are run in series and will not run the next hook until your hook has resolved. 
This can cause performance issues if you have a lot of hooks.

Trying to return a `Promise` from a synchronous hook will raise an error.

## Removing hooks

You can remove hooks using `hooks.removeListener` and providing either the same callback as `hooks.addListener` or the name of your listener:

```js
class Book extends Model {}
Book.init({
  title: DataTypes.STRING
}, { sequelize });

const myListener = (book, options) => {
  // ...
};

Book.hooks.addListener('afterCreate', 'yourHookIdentifier', myListener);

// Both of these will remove the hook:
// success-next-line
Book.hooks.removeListener('afterCreate', myListener);
// success-next-line
Book.hooks.removeListener('afterCreate', 'yourHookIdentifier');
```

:::caution

Hooks added by decorators cannot be removed using the callback instance, but can still be removed if they are named:

```typescript
import { Sequelize, Model, Hook } from '@sequelize/core';
import { BeforeFind } from '@sequelize/core/decorators-legacy';

export class MyModel extends Model {
  @BeforeFind({ name: 'yourHookIdentifier' })
  static logFindAll() {
    console.log('findAll has been called on MyModel');
  }
}

// This will not work
// error-next-line
MyModel.hooks.removeListener('beforeFind', MyModel.logFindAll);

// But this will
// success-next-line
MyModel.hooks.removeListener('beforeFind', 'yourHookIdentifier');
```

However, we do not recommend removing hooks added through decorators, as it may make your code harder to understand.

:::

## Associations Method Hooks

Methods added by [Associations](../core-concepts/assocs.md) on your model do provide hooks specific to them, but they are built on top
of regular model methods, which will trigger hooks.

For instance, using the `add` / `set` mixin methods will trigger the `beforeUpdate` and `afterUpdate` hooks.

## `individualHooks`

:::caution

Using this option is discouraged for two reasons:

- Unlike the "normal" hook, the data provided to events emitted by `individualHooks` cannot be modified. Only the "bulk" event's data can be modified.
- This option is slow, as it will need to fetch the instances that need to be destroyed.

Use with care. If you need to react to database changes, consider using your database's triggers and notification system instead.

:::

When using static model methods such as `Model.destroy` or `Model.update`, only their corresponding "bulk" hook (such as `beforeBulkDestroy`) will be called, not the instance hooks (such as `beforeDestroy`).

If you want to trigger the instance hooks, you use the `individualHooks` option to the method to run the instance hooks for each row that will be impacted.  
The following example will trigger the `beforeDestroy` and `afterDestroy` hooks for each row that will be deleted:

```js
User.destroy({
  where: {
    id: [1, 2, 3],
  },
  individualHooks: true,
});
```

## Exceptions

Only __Model methods__ trigger hooks. This means there are a number of cases where Sequelize will interact with the database without triggering hooks.
These include but are not limited to:

- Instances being deleted by the database because of an `ON DELETE CASCADE` constraint.
- Instances being updated by the database because of a `SET NULL` or `SET DEFAULT` constraint.
- [Raw queries](../core-concepts/raw-queries.md).
- All QueryInterface methods.

If you need to react to these events, consider using your database's native and notification system instead.

## Hooks and Transactions

Many model operations in Sequelize support specifying a transaction in the options parameter of the method. 
If a transaction *is* specified in the original call, it will be present in the options parameter passed to the hook function.  
For example, consider the following snippet:

```js
User.hooks.addListener('afterCreate', async (user, options) => {
  // We can use `options.transaction` to perform some other call
  // using the same transaction of the call that triggered this hook
  await User.update({ mood: 'sad' }, {
    where: {
      id: user.id
    },
    // highlight-next-line
    transaction: options.transaction
  });
});

await sequelize.transaction(async transaction => {
  await User.create({
    username: 'someguy',
    mood: 'happy'
  }, {
    transaction,
  });
});
```

If we had not included the transaction option in our call to `User.update` in the preceding code, 
no change would have occurred, since our newly created user does not exist in the database until the pending transaction 
has been committed.

[^find-all]: **findAll**: Note that some methods, such as `Model.findOne`, `Model.findAndCountAll` and association getters will also call `Model.findAll` internally. This will cause the `beforeFind` hook to be called for these methods too.
