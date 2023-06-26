---
title: Polymorphic Associations
---

A **polymorphic association** is an association that can target multiple models. For example, imagine a `Comment` model that can belong to either a `Article` or a `Video`.

Sequelize offers three ways of implementing polymorphic associations, in order of recommendation:

- A. Using [Model Inheritance](#inheritance-based-polymorphic-associations) (recommended)
  - 👍 This solution supports foreign keys
  - 👍 Tables are lighter, more performant
  - 👍 Can easily add model-specific attributes
  - ❌ This solution requires more tables
- B. Using a [single model with multiple foreign keys](#single-model-multiple-foreign-key-polymorphic-associations)
  - 👍 This solution supports foreign keys
  - 👍 Uses a single table
- C. Using a [single model with a single foreign key](#single-model-single-foreign-key-polymorphic-associations)
  - 👍 Uses a single table
  - ❌ Does not support foreign keys

## Inheritance-based polymorphic associations

The way this polymorphic association works is by creating a base model, such as `AbstractComment`,
which defines the common fields between all comments.
Then, we create models that [inherit](../models/inheritance.md) from it
for each model that can have comments, such as `ArticleComment` and `VideoComment`.

```ts
// This is the base model, which defines the common fields between all comments.
@AbstractModel
abstract class AbstractComment<Attributes, CreationAttributes> extends Model<Attributes, CreationAttributes> {
  declare id: number;

  @Attributes(DataTypes.STRING)
  @NotNull
  declare content: string;

  @Attributes(DataTypes.INTEGER)
  @NotNull
  declare targetId: number;
}

// This is the model for comments on articles.
class ArticleComment extends AbstractComment<InferAttributes<ArticleComment>, InferCreationAttributes<ArticleComment>> {
  @BelongsTo(() => Article, 'targetId')
  declare target?: Article;
}

// This is the model for comments on videos.
class VideoComment extends AbstractComment<InferAttributes<VideoComment>, InferCreationAttributes<VideoComment>> {
  @BelongsTo(() => Video, 'targetId')
  declare target?: Video;
}
```

The above code will create two tables: `ArticleComments` and `VideoComments`.

## Single-model, multiple-foreign-key polymorphic associations

This solution only requires a single table, to which we add multiple, mutually-exclusive foreign keys:

```ts
class Comment extends Model<InferAttributes<Comment>, InferCreationAttributes<Comment>> {
  declare id: number;

  @Attributes(DataTypes.STRING)
  @NotNull
  declare content: string;

  @Attributes(DataTypes.INTEGER)
  declare articleId: number | null;

  @BelongsTo(() => Article, 'articleId')
  declare article?: Article;

  @Attributes(DataTypes.INTEGER)
  declare videoId: number | null;

  @BelongsTo(() => Video, 'videoId')
  declare video?: Video;
}
```

You can then determine which foreign key to use by checking which one is `null`.

We recommend that you add a [`CHECK` constraint](../models/validations-and-constraints.md#check-constraints) on this table to ensure that only one of the foreign keys is not null at a time.

## Single-model, single-foreign-key polymorphic associations

:::caution

This type of polymorphic associations cannot use foreign keys, as a single column can only ever reference one other table.
This may be a problem if you want to use foreign keys for data integrity, as well as for `SELECT` performance.

Due to using the same column for multiple associations, you also put yourself at greater risk of creating a data integrity issue.

For these reasons, we highly recommend using one of the other two solutions instead. Proceed with caution.

:::

In this type of polymorphic association, we don't use foreign keys at all. 
Instead, we use two columns: one to store the type of the associated model, and one to store the ID of the associated model.

As stated above, we must disable the foreign key constraints on the association, as the same column is referencing multiple tables.
This can be done by using the `constraints: false`.

We then use [association scopes](./association-scopes.md) to filter which comments belong to which models.

```ts
class Comment extends Model<InferAttributes<Comment>, InferCreationAttributes<Comment>> {
  declare id: number;

  @Attributes(DataTypes.STRING)
  @NotNull
  declare content: string;

  @Attributes(DataTypes.STRING)
  @NotNull
  declare targetModel: 'article' | 'video';

  @Attributes(DataTypes.INTEGER)
  @NotNull
  declare targetId: number;
 
  /** Defined by {@link Article#comments} */
  declare article?: NonAttribute<Article>;
  
  /** Defined by {@link Video#comments} */
  declare video?: NonAttribute<Video>;
  
  get target(): NonAttribute<Article | Video | undefined> {
    if (this.targetModel === 'article') {
      return this.article;
    } else {
      return this.video;
    }
  }
}

class Video extends Model<InferAttributes<Video>, InferCreationAttributes<Video>> {
  declare id: number;

  @HasMany(() => Comment, {
    inverse: {
      as: 'videos',
    },
    foreignKey: 'targetId',
    // highlight-start
    // Foreign Keys must be disabled.
    constraints: false,
    // This scope ensures that loading the "comments" association only loads comments that belong to videos.
    scope: {
      targetModel: 'video',
    },
    // highlight-end
  })
  declare comments: Comment[];
}

class Article extends Model<InferAttributes<Article>, InferCreationAttributes<Article>> {
  declare id: number;

  @HasMany(() => Comment, {
    inverse: {
      as: 'articles',
    },
    foreignKey: 'targetId',
    constraints: false,
    scope: {
      targetModel: 'article',
    },
  })
  declare comments: Comment[];
}
```

You can then eager-load `Comment` when loading `Article` or `Video`:

```ts
const article = await Article.findOne({
  // this will only include the comments that belong to articles
  include: ['comments'],
});
```

Or lazy-load them:

```ts
const article = await Article.findOne();

// this will only include the comments that belong to this article
const comments = await article.getComments();
```

:::warning

Do not use the inverse association without extra filtering! 

While using the association from Article or Video to Comment is safe,
using the inverse association from Comment to Article or Video is not safe.

The following is unsafe:

```ts
const comment = await Comment.findOne({
  include: ['article'],
});
```

This is because an association scope only applies to the target model, not the source model.
The above query will try to load the "article" association of the comment, even if the comment belongs to a video.
Worse yet, it will try to load the article using the primary key of the video.

If you wish to do this, you must make sure that you filter the comment model yourself:

```ts
const comment = await Comment.findOne({
  include: ['article'],
  where: {
    // highlight-next-line
    targetModel: 'article',
  },
});
```

Or, when lazy-loading, that you use the right accessor:

```ts
const comment = await Comment.findOne();

// highlight-start
if (comment.targetModel === 'article') {
  const article = await comment.getArticle();
} else {
  const video = await comment.getVideo();
}
```

:::
