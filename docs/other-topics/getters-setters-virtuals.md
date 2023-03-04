---
sidebar_position: 5
title: Getters, Setters & Virtuals
---

Sequelize allows you to define custom getters and setters for the attributes of your models.

Sequelize also allows you to specify the so-called [*virtual attributes*](#virtual-attributes), 
which are attributes on the Sequelize Model that doesn't really exist in the underlying SQL table, but instead are populated automatically by Sequelize. 
They are very useful to create custom attributes which also could simplify your code.

## Attribute Getters & Setters

Attribute Getters & Setters are like any other JavaScript getter and setters, but cause the creation of an attribute in the model definition.
The main advantage is that Sequelize will call these getters and setters automatically when the attribute is read or set.

You must decorate your getter or setter with [attribute decorators](../models/defining-models.mdx), just like you would with any other attribute.

Unlike the standard JavaScript getters & setters, __you do not need to define both a getter and a setter for the same attribute__.
Sequelize will automatically create a setter for you if you only define a getter, and vice versa. You can of course define
both if you need to.

### Getters

Getters will be called automatically when the attribute is read, be it through `model.get('attribute')`, or `model.attribute`.  
The only exception is `model.getDataValue('attribute')`, which will return the raw value of the attribute, without calling the getter.

```ts
class User extends Model {
  @Attribute(DataTypes.STRING)
  @NotNull
  get username(): string {
    return this.getDataValue('username').toUpperCase();
  }
}

const user = User.build({ username: 'SuperUser123' });

// This will call the getter
console.log(user.username); // 'SUPERUSER123'

// This will not call the getter
console.log(user.getDataValue('username')); // 'SuperUser123'
```

:::caution Accessing the attribute value

Inside your getter or setter, you should use `this.getDataValue('attributeName')` to access the value of the attribute, and
`this.setDataValue('attributeName', value)` to set the value of the attribute.

If you try to access the attribute directly, you will get an infinite loop.

```ts
class User extends Model {
  @Attribute(DataTypes.STRING)
  @NotNull
  get username(): string {
    // This will call the getter again
    // error-next-line
    return this.username.toUpperCase();
  }
}
```

:::

### Setters

Setters will be called automatically when the attribute is set, be it through `model.set('attribute', value)`, or `model.attribute = value`.  
The only exception is `model.setDataValue('attribute', value)`, which will set the raw value of the attribute, without calling the setter.

```ts
class User extends Model {
  @Attribute(DataTypes.STRING)
  @NotNull
  set username(value: string) {
    this.setDataValue('username', value.toUpperCase());
  }
}
```

:::caution Static Methods

Static model methods do not interact with the instance of the model, and therefore will ignore any getters or setters defined for the model.

```ts
class User extends Model {
  @Attribute(DataTypes.STRING)
  @NotNull
  set username(value: string) {
    this.setDataValue('username', value.toUpperCase());
  }
}

// This will insert the value as-is, without calling the setter,
// so it will not be converted to uppercase
await User.update({
  username: 'ephys',
}, {
  where: { id: 1 },
});
```

:::

:::caution Setter dependencies

While it is possible for a setter to use the value of another attribute,
be aware that the setter will not be called again if the other attribute changes.

The setter is only called when the value of the attribute is set, and is called immediately. Accessing the value 
of another attribute inside the setter can lead to unexpected results depending on the order of operations.

```ts
class User extends Model {
  @Attribute(DataTypes.STRING)
  @NotNull
  declare username: string;
  
  @Attribute(DataTypes.STRING)
  @NotNull
  set password(value): string {
    // Accessing the value of another attribute inside the setter can lead to unexpected results
    // error-next-line
    this.setDataValue('password', hash(this.username + value));
  }
}
```

:::

## Virtual attributes

Virtual attributes are attributes that Sequelize populates under the hood, but in reality they don't even exist in the database.

For example, let's say we have a User model with `firstName` and `lastName`[^1] attributes.  
It would be nice to have a simple way to obtain the *full name* directly!  
A simple solution is to add a regular JavaScript getter to the model:

```ts
class User extends Model {
  @Attribute(DataTypes.STRING)
  @NotNull
  declare firstName: string;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare lastName: string;

  // highlight-start
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
  // highlight-end
}
```

This works, but you can also make it an attribute and use the `VIRTUAL` Data Type.

The `VIRTUAL` attribute does not create an actual column in the table. The model will not have a `fullName` column,
but the attribute can still be used in JavaScript.

We can combine the idea of `getters` with the special data type Sequelize provides for this kind of situation: `DataTypes.VIRTUAL`:

```ts
import { DataTypes } from '@sequelize/core';

class User extends Model {
  @Attribute(DataTypes.STRING)
  @NotNull
  declare firstName: string;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare lastName: string;

  // highlight-next-line
  @Attribute(DataTypes.VIRTUAL(DataTypes.STRING, ['firstName', 'lastName']))
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
```

The `VIRTUAL` attribute has a few advantages over the regular getter:

- It can be used as an attribute in the attribute list of queries, which will make the query load its dependencies.
- the `.get()` method of your model will return the value of the virtual attribute, instead of `undefined`.

:::caution Uses in queries

Remember, the `VIRTUAL` attribute does not exist in the database. Sequelize lets you specify it in the attribute list of queries,
but it will not be included in the actual query, and cannot be used anywhere else in the query.

```ts
const users = await User.findAll({
  // 'fullName' is a virtual attribute, which will make Sequelize
  // load 'firstName' and 'lastName' instead.
  attributes: ['id', 'fullName'],
  where: {
    // This will not work.
    // error-next-line
    fullName: 'John Doe',
  },
});
```

:::

[^1]: Did you know? Not everyone's name can be neatly separated into [first name & last name](https://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/). 