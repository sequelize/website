---
title: Indexes
sidebar_position: 7
---

Sequelize supports adding indexes to the model definition which will be created on [`sequelize.sync()`](pathname:///api/v7/classes/Sequelize.html#sync).

```js
const User = sequelize.define('User', { /* attributes */ }, {
  indexes: [
    // Create a unique index on email
    {
      unique: true,
      fields: ['email']
    },

    // Creates a gin index on data with the jsonb_path_ops operator
    {
      fields: ['data'],
      using: 'gin',
      operator: 'jsonb_path_ops'
    },

    // By default index name will be [table]_[fields]
    // Creates a multi column partial index
    {
      name: 'public_by_author',
      fields: ['author', 'status'],
      where: {
        status: 'public'
      }
    },

    // A BTREE index with an ordered field
    {
      name: 'title_index',
      using: 'BTREE',
      fields: [
        'author',
        {
          name: 'title',
          collate: 'en_US',
          order: 'DESC',
          length: 5
        }
      ]
    }
  ]
});
```

## Unique Indexes

Our code example above defines a unique constraint on the `username` field:

```js
/* ... */ {
  username: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
} /* ... */
```

When this model is synchronized (by calling `sequelize.sync` for example), the `username` field will be created in the table as `` `username` TEXT UNIQUE``, and an attempt to insert an username that already exists there will throw a `SequelizeUniqueConstraintError`.
