---
title: Association Scopes
---

:::info

This section concerns association scopes, not to be confused with [model scopes](../other-topics/scopes.md).

:::

Association scopes are a way to automatically apply default filters on associated models.

For instance, you could define an association from `City` to `Restaurant` with a scope that only returns restaurants that are open:

```js
class City extends Model {
  @Attribute(DataTypes.STRING)
  name;

  /** this association returns all restaurants */
  @HasMany(() => Restaurant, 'cityId')
  restaurants;

  /** this association only returns open restaurants */
  @HasMany(() => Restaurant, {
    foreignKey: 'cityId',
    // highlight-next-line
    scope: { status: 'open' },
  })
  openRestaurants;
}

class Restaurant extends Model {
  @Attribute(DataTypes.STRING)
  status;
}

const city = await City.findByPk(1);

// this will return all restaurants
const restaurants = await city.getRestaurants();

// this will return only open restaurants
const openRestaurants = await city.getOpenRestaurants();
```

This last query would roughly generate the following SQL:

```sql
SELECT * FROM `restaurants` WHERE `restaurants`.`status` = 'open' AND `restaurants`.`cityId` = 1;
```

## BelongsToMany scope

All associations support specifying a scope to filter the target model, but the `BelongsToMany` association 
also supports specifying a scope to filter the join table. This is useful when you want to filter based on extra information
stored in the join table.

It is done by setting the `through.scope` option.

Here is a simple example. We want to store which person worked on a game, but we also want to store the role they had in its creation:

```js
class GameAuthor extends Model {
  @Attribute(DataTypes.STRING)
  role;
}

class Person extends Model {}

class Game extends Model {
  /** This association will list everyone that worked on the game */
  @BelongsToMany(() => Person, {
    through: GameAuthor
  })
  allAuthors;
}
```

In the above example, we can use the `allAuthors` association to list everyone that worked on the game, but we can
also add other associations to filter the authors based on their role:

```js
class Game extends Model {
  /** This association will list everyone that worked on the game */
  @BelongsToMany(() => Person, {
    through: GameAuthor,
    foreignKey: 'gameId',
    otherKey: 'personId',
  })
  allAuthors;
  
  /** This association will list everyone that worked on the game as a programmer */
  @BelongsToMany(() => Person, {
    through: { 
      model: GameAuthor,
      foreignKey: 'gameId',
      otherKey: 'personId',
      // highlight-next-line
      scope: { role: 'programmer' },
    },
  })
  programmers;
  
  /** This association will list everyone that worked on the game as a designer */
  @BelongsToMany(() => Person, {
    through: {
      model: GameAuthor,
      foreignKey: 'gameId',
      otherKey: 'personId',
      // highlight-next-line
      scope: { role: 'designer' },
    },
  })
  designers;
}

const game = await Game.findByPk(1);

// this will return all authors
const allAuthors = await game.getAllAuthors();

// this will return only programmers
const programmers = await game.getProgrammers();

// this will return only designers
const designers = await game.getDesigners();
```
