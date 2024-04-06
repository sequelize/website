---
title: Transactions
sidebar_position: 11
---

Sequelize supports [transactions](https://en.wikipedia.org/wiki/Database_transaction) out of the box and offers two ways of using transactions:

1. [**Managed transactions**](#managed-transactions-recommended) (recommended): Sequelize will automatically rollback the transaction if any error is thrown,
   or commit the transaction otherwise. Queries also automatically use the active transaction by default.
2. [**Unmanaged transactions**](#unmanaged-transactions): Committing and rolling back the transaction must be handled manually by the user (by calling the appropriate Sequelize methods).

## Managed transactions (recommended)

With managed transactions, Sequelize handles committing or rolling back transactions automatically.

Managed transactions are started using [`sequelize.transaction`].
a method which accepts an async callback. This method works like this:

* Sequelize will start a transaction
* Then, Sequelize will execute the callback you provided
* If your callback throws, Sequelize will automatically rollback the transaction
* If your callback finishes successfully, Sequelize will automatically commit the transaction

```ts
try {
  const result = await sequelize.transaction(async () => {
    // both of these queries will run in the transaction
    const user = await User.create({
      firstName: 'Abraham',
      lastName: 'Lincoln'
    });

    await user.setShooter({
      firstName: 'John',
      lastName: 'Boothe'
    });

    return user;
  });

  // If the execution reaches this line, the transaction has been committed successfully
  // `result` is whatever was returned from the transaction callback (the `user`, in this case)

} catch {
  // If the execution reaches this line, an error occurred.
  // The transaction has already been rolled back automatically by Sequelize!
}
```

### Nested Transactions

Nesting transactions is the act of calling [`sequelize.transaction`] inside a transaction callback. 
This concept is exclusive to managed transactions.

Sequelize supports 3 behaviors for nested transactions:

- `TransactionMode.reuse` (default): The child block will not do anything, and the transaction created by the parent block will be used inside the child block.
- [`TransactionMode.savepoint`](#savepoints): A save point will be created inside the parent transaction, and the child block will use this save point.
- [`TransactionMode.separate`](#concurrent-transactions): A new transaction will be created inside the child block, completely independent of the parent transaction.

This option can be set by passing the `nestMode` option to [`sequelize.transaction`].

```ts
await sequelize.transaction(async () => {
  await sequelize.transaction({ nestMode: TransactionNestMode.savepoint }, async () => {
  });
});
```

You can also configure the default behavior globally
by setting the [`defaultTransactionNestMode`](pathname:///api/v7/interfaces/_sequelize_core.index.options#defaultTransactionNestMode) that the Sequelize constructor accepts.

```ts
new Sequelize({
  /* options */
  defaultTransactionNestMode: TransactionNestMode.savepoint,
});
```

---

If you [disabled CLS](#disabling-cls), you must pass the parent transaction object to the child block yourself.
If you don't, the child block will not be aware of the parent transaction, and will always create a new transaction instead.

```ts
await sequelize.transaction(async (parentTransaction) => {
  // a transaction has been created here

  await sequelize.transaction(
    { 
      nestMode: TransactionNestMode.savepoint,
      // highlight-next-line
      transaction: parentTransaction,
    }, 
    async (childTransaction) => {
      // a save point has been created here
    },
  );

  // the save point has been released (or rolled back if the above block threw an error)
});

// the transaction has been committed (or rolled back if the above block threw an error)
```

### Savepoints

If `nestMode` is set to `TransactionNestMode.savepoint`, a save point will be created inside the parent transaction, 
and the child block will use this save point.

If the child block throws an error, the save point will be rolled back, but the parent transaction will continue.  
If the child block finishes successfully, the save point will be released:

```ts
await sequelize.transaction(async () => {
  // a transaction has been created here

  await sequelize.transaction({ nestMode: TransactionNestMode.savepoint }, async () => {
    // a save point has been created here
  });

  // the save point has been released (or rolled back if the above block threw an error)
});

// the transaction has been committed (or rolled back if the above block threw an error)
```

### Concurrent Transactions

:::warning

Be very careful when using Concurrent Transactions, as improper usage can lead to deadlocks.

:::

Concurrent transactions are transactions that run concurrently with each other.
This can be done by starting multiple transactions at the same time, then specifying which transaction each query must use.

```ts
sequelize.transaction((t1) => {
  return sequelize.transaction({ nestMode: TransactionNestMode.separate }, (t2) => {
    // Queries in this block will use the transaction t2 by default,
    // but you can specify which transaction must be used
    // by using the `transaction` option.
    return Promise.all([
      // runs query in transaction t1
      User.create({ name: 'Mallory' }, { transaction: t1 }),
      // runs query in transaction t2 (the default)
      User.create({ name: 'Mallory' }, { transaction: t2 }),
    ]);
  });
});
```

### Escaping the transaction

:::warning

Be very careful when doing the following, as it can easily lead to deadlocks.

:::

If you need to run a query outside the transaction, you can set the `transaction` option to `null`.

```ts
await sequelize.transaction(async () => {
  // this query will run inside the transaction
  await User.create({ name: 'Mallory' });

  // this query will run outside the transaction
  await User.create({ name: 'Mallory' }, { transaction: null });
});
```

### Getting the current transaction

If you need to access the current transaction object, [`sequelize.transaction`] passes
the transaction object to your callback. You can also access it by calling [`sequelize.getCurrentClsTransaction`]

```ts
const result = await sequelize.transaction(async (transaction) => {
  // true
  console.log(sequelize.getCurrentClsTransaction() === transaction);
});
```

This can be helpful if you need to [use two different transactions in the same block](#concurrent--partial-transactions), or if you [disable CLS](#disabling-cls)

### Disabling CLS

By default, Sequelize uses [AsyncLocalStorage](https://nodejs.org/api/async_context.html#class-asynclocalstorage)
to automatically use the active transaction in all queries started in the transaction callback.

This behavior can be disabled by setting the Sequelize `disableClsTransactions` option to true.

[`sequelize.transaction`] passes
the transaction object to your callback, and you must pass it to the querying methods yourself if this behavior is disabled.

```ts
const sequelize = new Sequelize({
  // ... credentials
  disableClsTransactions: true,
});

const result = await sequelize.transaction(async transaction => {
  return User.create({
    firstName: 'Abraham',
    lastName: 'Lincoln',
  }, {
    // You must specify this option when disableClsTransactions is true, or 
    // this query will run outside of the transaction
    // highlight-next-line
    transaction,
  });
});
```

:::info

The `transaction` object proposes the [`commit`] and [`rollback`] methods, 
which are designed to be used with [unmanaged transactions](#unmanaged-transactions).  
These methods *must not* be used in [managed transactions](#managed-transactions-recommended).

:::

## Unmanaged transactions

Unmanaged transactions are transactions that are not automatically committed or rolled back by Sequelize. You must do it yourself
using the [`commit`] and [`rollback`](pathname:///api/v7/classes/_sequelize_core.index.Transaction.html#rollback) transaction methods.

```js
// First, we start a transaction and save it into a variable
const transaction = await sequelize.startUnmanagedTransaction();

try {
  // Then, we do some calls passing this transaction as an option:

  const user = await User.create({
    firstName: 'Bart',
    lastName: 'Simpson'
  }, { transaction });

  await user.addSibling({
    firstName: 'Lisa',
    lastName: 'Simpson'
  }, { transaction });

  // If the execution reaches this line, no errors were thrown.
  // We commit the transaction.
  await t.commit();
} catch (error) {

  // If the execution reaches this line, an error was thrown.
  // We rollback the transaction.
  await t.rollback();
}
```

Note that innoDB (MariaDB and MySQL) will still automatically rollback transactions in case of deadlock. [Read more on this here](https://github.com/sequelize/sequelize/pull/12841).

:::caution

Unmanaged transactions are incompatible with CLS. You must always pass them to your queries manually.

:::

## Options

Both [`sequelize.transaction`]
and [`sequelize.startUnmanagedTransaction`] accept options:

- For managed transactions, pass them as the first parameter: `sequelize.transaction(options, callback)`
- For unmanaged transactions, it's the only possible parameter: `sequelize.startUnmanagedTransaction(options)`

### Isolation levels

The possible isolation levels to use when starting a transaction:

```js
import { IsolationLevel } from '@sequelize/core';

// The following are valid isolation levels:
IsolationLevel.READ_UNCOMMITTED
IsolationLevel.READ_COMMITTED
IsolationLevel.REPEATABLE_READ
IsolationLevel.SERIALIZABLE
```

By default, sequelize uses the isolation level of the database. 
If you want to use a different isolation level, pass in the desired level as the first argument:

```ts
import { IsolationLevel } from '@sequelize/core';

await sequelize.transaction({
  isolationLevel: IsolationLevel.SERIALIZABLE
}, async (t) => {
  // Your code
});
```

You can also change the default `isolationLevel` globally by setting the option in the Sequelize constructor:

```ts
import { Sequelize, IsolationLevel } from '@sequelize/core';

const sequelize = new Sequelize({
  /* options */
  isolationLevel: IsolationLevel.SERIALIZABLE,
});
```

**Note for MSSQL:** _The `SET ISOLATION LEVEL` queries are not logged since the specified `isolationLevel` is passed directly to `tedious`._

### Constraint Checks

PostgreSQL supports deferring [constraint checking](https://www.postgresql.org/docs/current/sql-set-constraints.html) to the end of a transaction.
This allows you to insert or update rows that violate constraints,as long as you fix the violations before committing the transaction.

In Sequelize, you can enable this behavior by setting the `constraintChecking` option to `DEFERRED`:

```ts
import { ConstraintChecking } from '@sequelize/core';

await sequelize.transaction({
  constraintChecking: ConstraintChecking.DEFERRED
}, async (t) => {
  // Your code
});
```

You can also specify which constraints to defer by passing an array of constraint names:

```ts
import { ConstraintChecking } from '@sequelize/core';

await sequelize.transaction({
  constraintChecking: ConstraintChecking.DEFERRED(['project_owner_fk'])
}, async (t) => {
  // Your code
});
```

### Read replication

If you use [read replication](../other-topics/read-replication.md),
you can let Sequelize know whether the transaction is _only_ going to be used for read queries by setting the `readOnly` option to `true`:

This will cause Sequelize to open the transaction against a read replica instead of the primary server.

```ts
await sequelize.transaction({
  readOnly: true
}, async (t) => {
  // Your code
});
```

## Transaction Hooks

### The `afterCommit` hook

The [`afterCommit`](pathname:///api/v7/classes/_sequelize_core.index.Transaction.html#afterCommit) hook can be used to execute code immediately after the transaction has been committed.

This hook is supported by both managed and unmanaged transaction objects:

```js
// Managed transaction:
await sequelize.transaction(async (t) => {
  t.afterCommit(() => {
    // Your logic
  });
});

// Unmanaged transaction:
const t = await sequelize.startUnmanagedTransaction();
t.afterCommit(() => {
  // Your logic
});
await t.commit();
```

The callback passed to `afterCommit` can be `async`. In this case:

* For a managed transaction: the [`sequelize.transaction`] call will wait for it before settling;
* For an unmanaged transaction: the [`commit`] call will wait for it before settling.

Notes:

* The `afterCommit` hook is not called if the transaction is rolled back.
* Unlike most hooks, the `afterCommit` hook does not allow modifying the return value of the transaction.

You can use the `afterCommit` hook in conjunction with model hooks to know when an instance is saved and available outside a transaction

```js
User.hooks.addListener('afterSave', (instance, options) => {
  if (options.transaction) {
    // Save done within a transaction, wait until transaction is committed to
    // notify listeners the instance has been saved
    options.transaction.afterCommit(() => { /* Your Logic */ })
    return;
  }
  // Save done outside a transaction, safe for callers to fetch the updated model
  // Your Logic Here
});
```

### The `afterRollback` hook

The [`afterRollback`](pathname:///api/v7/classes/_sequelize_core.index.Transaction.html#afterRollback) 
hook can be used to execute code immediately after the transaction has been rolled back.

It works the same way as the [`afterCommit`](#the-aftercommit-hook) hook, 
except that it is called when the transaction is rolled back.

### The `afterTransaction` hook

The [`afterTransaction`](pathname:///api/v7/classes/_sequelize_core.index.Transaction.html#afterTransaction)
hook can be used to execute code immediately after the transaction has been committed or rolled back.

It works the same way as the previous hooks, but it is called for both commits and rollbacks.
It is the equivalent of a `finally` block in a `try/catch` statement, but for transactions.

## Locks

Queries within a `transaction` can be performed with locks:

```js
return User.findAll({
  limit: 1,
  lock: true,
  transaction: t1
});
```

Queries within a transaction can skip locked rows:

```js
return User.findAll({
  limit: 1,
  lock: true,
  skipLocked: true,
  transaction: t2
});
```

[`sequelize.transaction`]: pathname:///api/v7/classes/_sequelize_core.index.Sequelize.html#transaction
[`sequelize.startUnmanagedTransaction`]: pathname:///api/v7/classes/_sequelize_core.index.Sequelize.html#startUnmanagedTransaction
[`sequelize.getCurrentClsTransaction`]: pathname:///api/v7/classes/_sequelize_core.index.Sequelize.html#getCurrentClsTransaction
[`commit`]: pathname:///api/v7/classes/_sequelize_core.index.Transaction.html#commit
[`rollback`]: pathname:///api/v7/classes/_sequelize_core.index.Transaction.html#rollback
