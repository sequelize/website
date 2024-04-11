---
sidebar_position: 4
title: BelongsTo
---

# The BelongsTo Association

The `BelongsTo` association is the association all other associations are based on. It's the simplest form of
association, and is meant to be used as a way to add a foreign key to a model.

We recommend reading the guides on [`HasOne`](./has-one.md) and [`HasMany`](./has-many.md) before reading this guide.

## Defining a BelongsTo Association

The `BelongsTo` association is used on the opposite side of where you would use a `HasOne` or `HasMany` association.
It is capable of creating both One-To-One and One-To-Many relationships.

For instance, here is how you would create the association we described in the [`HasMany`](./has-many.md) guide, 
using a `BelongsTo` association:

```ts
import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, NonAttribute } from '@sequelize/core';
import { PrimaryKey, Attribute, AutoIncrement, NotNull, BelongsTo } from '@sequelize/core/decorators-legacy';

class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  @Attribute(DataTypes.INTEGER)
  @AutoIncrement
  @PrimaryKey
  declare id: CreationOptional<number>;
}

class Comment extends Model<InferAttributes<Comment>, InferCreationAttributes<Comment>> {
  @Attribute(DataTypes.INTEGER)
  @AutoIncrement
  @PrimaryKey
  declare id: CreationOptional<number>;

  // highlight-start
  @BelongsTo(() => Post, 'postId')
  declare post?: NonAttribute<Post>;

  // This is the foreign key
  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare postId: number;
  // highlight-end
}
```

And here is how you would create the association we described in the [`HasOne`](./has-one.md) guide:

```ts
import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, NonAttribute } from '@sequelize/core';
import { PrimaryKey, Attribute, AutoIncrement, NotNull, HasOne, BelongsTo } from '@sequelize/core/decorators-legacy';

class Person extends Model<InferAttributes<Person>, InferCreationAttributes<Person>> {
  @Attribute(DataTypes.INTEGER)
  @AutoIncrement
  @PrimaryKey
  declare id: CreationOptional<number>;
}

class DrivingLicense extends Model<InferAttributes<DrivingLicense>, InferCreationAttributes<DrivingLicense>> {
  @Attribute(DataTypes.INTEGER)
  @AutoIncrement
  @PrimaryKey
  declare id: CreationOptional<number>;
  
  // highlight-start
  @BelongsTo(() => Person, /* foreign key */ 'ownerId')
  declare owner?: NonAttribute<Person>;

  // This is the foreign key
  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare ownerId: number;
  // highlight-end
}
```

## Inverse Association

Unlike the other 3 associations, `BelongsTo` does _not_ automatically create the inverse association, because it does
not know whether it should be a `HasOne` or a `HasMany` association.

You can configure the inverse association by using the `inverse` option:

```ts
class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  @Attribute(DataTypes.INTEGER)
  @AutoIncrement
  @PrimaryKey
  declare id: CreationOptional<number>;
  
  // highlight-start
  /** Declared by {@link Comment#post} */
  declare comments?: Comment[];
  // highlight-end
}

class Comment extends Model<InferAttributes<Comment>, InferCreationAttributes<Comment>> {
  @Attribute(DataTypes.INTEGER)
  @AutoIncrement
  @PrimaryKey
  declare id: CreationOptional<number>;

  @BelongsTo(() => Post, {
    foreignKey: 'postId',
    // highlight-start
    inverse: {
      as: 'comments',
      // Either 'hasOne' or 'hasMany'
      type: 'hasMany',
    },
    // highlight-end
  })
  declare post?: NonAttribute<Post>;

  // This is the foreign key
  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare postId: number;
}
```

## Association Methods

The `BelongsTo` association adds the following methods to the model it is defined on:

### Association Getter (`getX`)

The getter method is used to retrieve the associated model. It is always named `get<AssociationName>`.

```ts
import { BelongsToGetAssociationMixin } from '@sequelize/core';
class Comment extends Model {
  @BelongsTo(() => Post, 'postId')
  declare post?: NonAttribute<Post>;
  
  // highlight-start
  declare getPost: BelongsToGetAssociationMixin<Post>;
  // highlight-end
}

const comment = await Comment.findByPk(1);
const post = await comment.getPost();
```

### Association Setter (`setX`)

The setter method is used to associate a model with another model. It is always named `set<AssociationName>`.

It is equivalent to setting the foreign key directly, then calling `save`.

```ts
import { BelongsToSetAssociationMixin } from '@sequelize/core';

class Comment extends Model {
  @BelongsTo(() => Post, 'postId')
  declare post?: NonAttribute<Post>;
  
  // highlight-start
  declare setPost: BelongsToSetAssociationMixin<Post, /* Foreign Key Type */ Comment['postId']>;
  // highlight-end
}

const comment = await Comment.findByPk(1);
const post = await Post.findByPk(1);
await comment.setPost(post);

// Or, if you already have the foreign key
await comment.setPost(1);
```

It is also possible to delay the call to `save` by setting the `save` option to `false`, however __this is not very useful__,
as it is equivalent to setting the foreign key directly, but using a (pointlessly) asynchronous method.

```ts
await comment.setPost(post, { save: false });
await comment.save();
```

### Association Creator (`createX`)

The creator method is used to create a new associated model. It is always named `create<AssociationName>`.

It is equivalent to creating a new model, then setting the foreign key, then calling `save`.

```ts
import { BelongsToCreateAssociationMixin } from '@sequelize/core';

class Comment extends Model {
  @BelongsTo(() => Post, 'postId')
  declare post?: NonAttribute<Post>;
  
  // highlight-start
  declare createPost: BelongsToCreateAssociationMixin<Post>;
  // highlight-end
}

const comment = await Comment.create({ content: 'This is a comment' });

// highlight-start
const post = await comment.createPost({
  title: 'New Post',
  content: 'This is a new post',
});
// highlight-end
```

:::caution Inefficient method

Using this method is discouraged, as it is less efficient than creating the associated model first,
then creating or updating the current model.

The following code is more efficient:

```ts
const post = await Post.create({
  title: 'New Post',
  content: 'This is a new post',
});

const comment = await Comment.create({
  content: 'This is a comment',
  postId: post.id,
});
```

Or, if you have defined the inverse association, this is just as efficient:

```ts
const post = await Post.create({
  title: 'New Post',
  content: 'This is a new post',
});

const comment = await post.createComment({
  content: 'This is a comment',
});
```

:::

## Foreign Key targets (`targetKey`)

By default, Sequelize will use the primary key of the target model as the attribute the foreign key references.
You can customize this by using the `targetKey` option.

```ts
class Comment extends Model {
  declare id: CreationOptional<number>;
  
  @BelongsTo(() => Post, {
    foreignKey: 'postId',
    // highlight-next-line
    // The foreign key will reference the 'id' attribute of the Post model
    targetKey: 'id',
  })
  declare post?: NonAttribute<Post>;
}
```