---
sidebar_position: 3
title: HasMany
---

# The HasMany Association

The HasMany association is used to create a One-To-Many relationship between two models.

In a One-To-Many relationship, a row of one table is associated with _zero, one or more_ rows of another table.

For instance, a post can have zero or more comments, but a comment can only belong to one post.

```mermaid
erDiagram
  posts ||--o{ comments : comments
```

## Defining the Association

Here is how you would define the `Post` and `Comment` models in Sequelize:

```ts
import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, NonAttribute } from '@sequelize/core';
import { PrimaryKey, Attribute, AutoIncrement, NotNull, HasMany, BelongsTo } from '@sequelize/core/decorators-legacy';

class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  @Attribute(DataTypes.INTEGER)
  @AutoIncrement
  @PrimaryKey
  declare id: CreationOptional<number>;

  // highlight-start
  @HasMany(() => Comment, /* foreign key */ 'postId')
  declare comments?: NonAttribute<Comment[]>;
  // highlight-end
}

class Comment extends Model<InferAttributes<Comment>, InferCreationAttributes<Comment>> {
  @Attribute(DataTypes.INTEGER)
  @AutoIncrement
  @PrimaryKey
  declare id: CreationOptional<number>;

  // highlight-start
  // This is the foreign key
  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare postId: number;
  // highlight-end
}
```

Note that in the example above, the `Comment` model has a foreign key to the `Post` model. __`HasMany` adds the foreign key
on the model the association targets.__

Unlike `HasOne`, __`HasMany` does not make the foreign key unique by default__.
This means that multiple different people can have the same birthplace.

## Inverse association

The `HasMany` association automatically creates an inverse association on the target model.
The inverse association is a [`BelongsTo`](./belongs-to.md) association.

You can configure that inverse association by using the `inverse` option:

```ts
import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, NonAttribute } from '@sequelize/core';
import { PrimaryKey, Attribute, AutoIncrement, NotNull, HasMany, BelongsTo } from '@sequelize/core/decorators-legacy';

class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  @Attribute(DataTypes.INTEGER)
  @AutoIncrement
  @PrimaryKey
  declare id: CreationOptional<number>;
  
  @HasMany(() => Comment, {
    foreignKey: 'birthplaceId',
    // highlight-start
    inverse: {
      as: 'birthplace',
    },
    // highlight-end
  })
  declare comments?: NonAttribute<Comment[]>;
}

class Comment extends Model<InferAttributes<Comment>, InferCreationAttributes<Comment>> {
  @Attribute(DataTypes.INTEGER)
  @AutoIncrement
  @PrimaryKey
  declare id: CreationOptional<number>;

  // highlight-start
  /** Defined by {@link City.bornPeople} */
  declare post?: NonAttribute<Post>;
  // highlight-end
  
  // This is the foreign key
  @Attribute(DataTypes.INTEGER)
  @NotNull
  declare postId: number;
}
```

## Association Methods

All associations add methods to the source model[^1]. These methods can be used to fetch, create, and delete associated models.

If you use TypeScript, you will need to declare these methods on your model class.

### Association Getter (`getX`)

The association getter is used to fetch the associated model. It is always named `get<AssociationName>`:

```ts
import { HasManyGetAssociationsMixin } from '@sequelize/core';

class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  @HasMany(() => Comment, 'postId')
  declare comments?: NonAttribute<Comment[]>;

  // highlight-start
  declare getComments: HasManyGetAssociationsMixin<Comment>;
  // highlight-end
}

// ...

const post = await Post.findByPk(1);

// highlight-start
const comments: Comment[] = await post.getComments();
// highlight-end
```

### Association Setter (`setX`)

The association setter is used to set the associated models. It is always named `set<AssociationName>`.

If the model is already associated to one or more models, the old associations are removed before the new ones are added.

```ts
import { HasManySetAssociationsMixin } from '@sequelize/core';

class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  @HasMany(() => Comment, 'postId')
  declare comments?: NonAttribute<Comment[]>;

  // highlight-start
  declare setComments: HasManySetAssociationsMixin<
    Comment,
    /* this is the type of the primary key of the target */
    Comment['id']
  >;
  // highlight-end
}

// ...

const post = await Post.findByPk(1);
const [comment1, comment2, comment3] = await Comment.findAll({ limit: 3 });

// highlight-start
// Remove all previous associations and set the new ones
await post.setComments([comment1, comment2, comment3]);

// You can also use the primary key of the newly associated model as a way to identify it
// without having to fetch it first.
await post.setComments([1, 2, 3]);
// highlight-end
```

:::caution

If the foreign key is not nullable, using this method on a model that is already associated to one or more models will result in a validation error.
This is because Sequelize will try to set the foreign key of the target model to `null`.

We're working on adding an option to delete the associated models instead of setting their foreign keys to `null`.
Take a look at issue [#14048](https://github.com/sequelize/sequelize/issues/14048) to learn more.

:::

### Association Adder (`addX`)

The association adder is used to add one or more new associated models without removing existing ones. 
There are two versions of this method:

- `add<SingularAssociationName>`: Associates a single new model.
- `add<PluralAssociationName>`: Associates multiple new models.

```ts
import { HasManyAddAssociationMixin, HasManyAddAssociationsMixin } from '@sequelize/core';

class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  @HasMany(() => Comment, 'postId')
  declare comments?: NonAttribute<Comment[]>;

  // highlight-start
  declare addComment: HasManyAddAssociationMixin<
    Comment,
    /* this is the type of the primary key of the target */
    Comment['id']
  >;

  declare addComments: HasManyAddAssociationsMixin<
    Comment,
    /* this is the type of the primary key of the target */
    Comment['id']
  >;
  // highlight-end
}

// ...

const post = await Post.findByPk(1);
const [comment1, comment2, comment3] = await Comment.findAll({ limit: 3 });

// highlight-start
// Add a single comment, without removing existing ones
await post.addComment(comment1);

// Add multiple comments, without removing existing ones
await post.addComments([comment1, comment2]);

// You can also use the primary key of the newly associated model as a way to identify it
// without having to fetch it first.
await post.addComment(1);
await post.addComments([1, 2, 3]);
// highlight-end
```

### Association Remover (`removeX`)

The association remover is used to remove one or more associated models.

There are two versions of this method:

- `remove<SingularAssociationName>`: Removes a single associated model.
- `remove<PluralAssociationName>`: Removes multiple associated models.


```ts
import { HasManyRemoveAssociationMixin, HasManyRemoveAssociationsMixin } from '@sequelize/core';

class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  @HasMany(() => Comment, 'postId')
  declare comments?: NonAttribute<Comment[]>;

  // highlight-start
  declare removeComment: HasManyRemoveAssociationMixin<
    Comment,
    /* this is the type of the primary key of the target */
    Comment['id']
  >;

  declare removeComments: HasManyRemoveAssociationsMixin<
    Comment,
    /* this is the type of the primary key of the target */
    Comment['id']
  >;
  // highlight-end
}

// ...

const post = await Post.findByPk(1);
const [comment1, comment2, comment3] = await Comment.findAll({ limit: 3 });

// highlight-start
// Remove a single comment, without removing existing ones
await post.removeComment(comment1);

// Remove multiple comments, without removing existing ones
await post.removeComments([comment1, comment2]);

// You can also use the primary key of the newly associated model as a way to identify it
// without having to fetch it first.
await post.removeComment(1);
await post.removeComments([1, 2, 3]);
// highlight-end
```

### Association Creator (`createX`)

The association creator is used to create a new associated model and associate it with the source model. It is always named `create<AssociationName>`.

```ts
import { HasManyCreateAssociationMixin } from '@sequelize/core';

class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  @HasMany(() => Comment, 'postId')
  declare comments?: NonAttribute<Comment[]>;

  // highlight-start
  declare createComment: HasManyCreateAssociationMixin<Comment, 'postId'>;
  // highlight-end
}

// ...

const post = await Post.findByPk(1);

// highlight-start
const comment = await post.createComment({
  content: 'This is a comment',
});
// highlight-end
```

:::info Omitting the foreign key

In the example above, we did not need to specify the `postId` attribute. This is because Sequelize will automatically add it to the creation attributes.

If you use TypeScript, you need to let TypeScript know that the foreign key is not required. You can do so using the second generic argument of the `HasManyCreateAssociationMixin` type.

```ts
HasManyCreateAssociationMixin<Comment, 'postId'>
                                        ^ Here
```

:::

### Association Checker (`hasX`)

The association checker is used to check if a model is associated with another model. It has two versions:

- `has<SingularAssociationName>`: Checks if a single model is associated.
- `has<PluralAssociationName>`: Checks whether all the specified models are associated.

```ts
import { HasManyHasAssociationMixin, HasManyHasAssociationsMixin } from '@sequelize/core';

class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  @HasMany(() => Comment, 'postId')
  declare comments?: NonAttribute<Comment[]>;

  // highlight-start
  declare hasComment: HasManyHasAssociationMixin<
    Comment,
    /* this is the type of the primary key of the target */
    Comment['id']
  >;

  declare hasComments: HasManyHasAssociationsMixin<
    Comment,
    /* this is the type of the primary key of the target */
    Comment['id']
  >;
  // highlight-end
}

// ...

const post = await Post.findByPk(1);

// highlight-start
// Returns true if the post has a comment with id 1
const isAssociated = await post.hasComment(comment1);

// Returns true if the post is associated to all specified comments
const isAssociated = await post.hasComments([comment1, comment2, comment3]);

// Like other association methods, you can also use the primary key of the associated model as a way to identify it
const isAssociated = await post.hasComments([1, 2, 3]);
// highlight-end
```

### Association Counter (`countX`)

The association counter is used to count the number of associated models. It is always named `count<AssociationName>`.

```ts
import { HasManyCountAssociationsMixin } from '@sequelize/core';

class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  @HasMany(() => Comment, 'postId')
  declare comments?: NonAttribute<Comment[]>;

  // highlight-start
  declare countComments: HasManyCountAssociationsMixin<Comment>;
  // highlight-end
}

// ...

const post = await Post.findByPk(1);

// highlight-start
// Returns the number of associated comments
const count = await post.countComments();
// highlight-end
```

## Foreign Key targets (`sourceKey`)

By default, Sequelize will use the primary key of the source model as the attribute the foreign key references.
You can customize this by using the `sourceKey` option.

```ts
class Post extends Model {
  declare id: CreationOptional<number>;
  
  @HasMany(() => Comment, {
    foreignKey: 'postId',
    // highlight-next-line
    // The foreign key will reference the `id` attribute of the `Post` model
    sourceKey: 'id',
  })
  declare comments?: NonAttribute<Comment[]>;
}
```