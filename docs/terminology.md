---
sidebar_position: 1000
---

# Terminology

## `Sequelize` vs `sequelize`

In our documentation, `Sequelize` refers to the library itself while the lowercase `sequelize` refers to an instance of Sequelize.
This is the recommended convention, and it will be followed throughout the documentation.

## Tables, Models & Entities

In Sequelize, Models are the JavaScript classes that represent [Database Tables](<https://en.wikipedia.org/wiki/Table_(database)>).

Some ORM call these Entities. By convention, they are called Models in Sequelize.

Learn more about Models in [Defining a Model](./models/defining-models.mdx)

## Attributes & Columns

An attribute is the JavaScript representation of a [Table Column](<https://en.wikipedia.org/wiki/Column_(database)>).

In this documentation, if _column_ is used, it references the SQL column. If _attribute_ is used, it references the JavaScript representation of a column.

Learn more about Attributes in [Defining a Model](./models/defining-models.mdx)

## Associations & Relationships

An association is the JavaScript representation of a [Table Relationship](https://en.wikipedia.org/wiki/Entity%E2%80%93relationship_model).

See [Associations](./associations/basics.md) for more information.
