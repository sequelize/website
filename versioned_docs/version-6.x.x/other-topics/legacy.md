# Working with Legacy Tables

While out of the box Sequelize will seem a bit opinionated it's easy to work legacy tables and forward proof your application by defining (otherwise generated) table and field names.

## Tables

```js
class User extends Model {}
User.init({
  // ...
}, {
  modelName: 'user',
  tableName: 'users',
  sequelize,
});
```

## Fields

```js
class MyModel extends Model {}
MyModel.init({
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_id'
  }
}, { sequelize });
```

## Primary keys

Sequelize will assume your table has a `id` primary key property by default.

To define your own primary key:

```js
class Collection extends Model {}
Collection.init({
  uid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true // Automatically gets converted to SERIAL for postgres
  }
}, { sequelize });

class Collection extends Model {}
Collection.init({
  uuid: {
    type: DataTypes.UUID,
    primaryKey: true
  }
}, { sequelize });
```

And if your model has no primary key at all you can use `Model.removeAttribute('id');`

Instances without primary keys can still be retrieved using `Model.findOne` and `Model.findAll`.  
While it's currently possible to use their instance methods (`instance.save`, `instance.update`, etc…), doing this will lead to subtle bugs,
and is planned for removal in a future major update.

:::info

If your model has no primary keys, you need to use the static equivalent of the following instance methods, and provide your own `where` parameter:

- `instance.save`: `Model.update`
- `instance.update`: `Model.update`
- `instance.reload`: `Model.findOne`
- `instance.destroy`: `Model.destroy`
- `instance.restore`: `Model.restore`
- `instance.decrement`: `Model.decrement`
- `instance.increment`: `Model.increment`

:::

## Foreign keys

```js
// 1:1
Organization.belongsTo(User, { foreignKey: 'owner_id' });
User.hasOne(Organization, { foreignKey: 'owner_id' });

// 1:M
Project.hasMany(Task, { foreignKey: 'tasks_pk' });
Task.belongsTo(Project, { foreignKey: 'tasks_pk' });

// N:M
User.belongsToMany(Role, { through: 'user_has_roles', foreignKey: 'user_role_user_id' });
Role.belongsToMany(User, { through: 'user_has_roles', foreignKey: 'roles_identifier' });
```
