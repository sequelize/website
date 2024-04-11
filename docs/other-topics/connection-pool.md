---
title: Connection Pool
---

Sequelize uses a connection pool,
powered by [sequelize-pool](https://www.npmjs.com/package/sequelize-pool), to manage connections to the database.
This provides better performance than creating a new connection for every query.

## Pool Configuration

This connection pool can be configured through the constructor's [`pool`](pathname:///api/v7/interfaces/_sequelize_core.index.PoolOptions.html) option: 

```js
const sequelize = new Sequelize({
  // ...
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});
```

By default, the pool has a maximum size of 5 active connections.
Depending on your scale, you may need to adjust this value to avoid running out of connections by setting the `max` option.

:::caution

When increasing the connection pool size, 
keep in mind that your database server has a maximum number of allowed active connections.

The `max` option should be set to a value that is less than the limit imposed by your database server.

Keep in mind that the connection pool is _not shared_ between Sequelize instances.
If your application uses multiple Sequelize instances, is running on multiple processes, or other applications are connecting
to the same database, make sure to reserve enough connections for each instance.

For instance, if your database server has a maximum of 100 connections, and your application is running on 2 processes,
you should set the `max` option to 45; reserving 10 connections for other uses, such as database migrations, monitoring, etc.

:::

## Pool Monitoring

Sequelize exposes a number of properties that can be used to monitor the state of the connection pool.

You can access these properties via [`sequelize.connectionManager.pool.write`] and
[`sequelize.connectionManager.pool.read`] (if you use [read replication](./read-replication.md)).

These pools expose the following properties:

- `size`: how many connections are currently in the pool (both in use and available)
- `available`: how many connections are currently available for use in the pool
- `using`: how many connections are currently in use in the pool
- `waiting`: how many requests are currently waiting for a connection to become available

You can also monitor how long it takes 
to acquire a connection from the pool 
by listening to the `beforePoolAcquire` and `afterPoolAcquire` [sequelize hooks](./hooks.mdx#instance-sequelize-hooks):

```ts
const acquireAttempts = new WeakMap();

sequelize.hooks.addListener('beforePoolAcquire', options => {
  acquireAttempts.set(options, Date.now());
})

sequelize.hooks.addListener('afterPoolAcquire', _connection, options => {
  const elapsedTime = Date.now() - acquireAttempts.get(options);
  console.log(`Connection acquired in ${elapsedTime}ms`);
})
```

## `ConnectionAcquireTimeoutError`

If you start seeing this error, 
it means that Sequelize was unable to acquire a connection from the pool within the configured `acquire` timeout.

This can happen for a number of reasons, including:

- Your server is doing too many concurrent requests, and the pool is unable to keep up. It may be necessary to increase the `max` option.
- Some of your queries are taking too long to execute, and requests are piling up. Monitor your database server to see if there are any slow queries, and optimize them.
- You have idle transactions that are not being committed or rolled back.  
  This can happen if you use [unmanaged transactions](../querying/transactions.md#unmanaged-transactions). 
  Make sure you are committing or rolling back your unmanaged transactions properly, 
  or use [managed transactions](../querying/transactions.md#managed-transactions-recommended) instead.
  We also recommend monitoring for connections that have been idle in transaction for a long time.
- You have other slow operations that are preventing your transactions from being committed in time. 
  For instance, if you are doing network requests inside a transaction,
  and there is a network slowdown, your transaction is going to stay open for longer than usual, 
  and cause a cascade of issues.
  To solve this, make sure to set [a timeout](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) on relevant asynchronous operations.

[`sequelize.connectionManager.pool.read`]: pathname:///api/v7/classes/_sequelize_core.index.unknown.ReplicationPool.html#read
[`sequelize.connectionManager.pool.write`]: pathname:///api/v7/classes/_sequelize_core.index.unknown.ReplicationPool.html#write
