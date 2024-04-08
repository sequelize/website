---
sidebar_position: 2
---

# Other databases

If you are using a database that is not currently supported by Sequelize, there are a few options available to you:

- [Request support for the new dialect](#requesting-support-for-a-new-dialect)
- [Contribute a new dialect](#contributing-a-new-dialect)
- [Create a third-party dialect](#creating-a-third-party-dialect)

## Requesting support for a new dialect

You can request support for a new dialect by creating a feature request on the [Sequelize repository](https://github.com/sequelize/sequelize).
Make sure to verify that there isn't already an open issue for the dialect you are requesting. [View the list of requests for new dialects here](https://github.com/sequelize/sequelize/issues?q=is%3Aopen+is%3Aissue+label%3A%22dialect%3A+new%22).

We have conditions for accepting new dialects:

- The database must support SQL queries.
- The database must have an existing Node.js library we can use to connect to it.
- The database must have a large enough user base to justify the maintenance cost.
- We must be able to run a database instance in GitHub codespaces for testing purposes.
- Our integration tests must be able to run against the database in 15 minutes or less.

It is also possible to sponsor the development of a new dialect. If you are interested in this option, [please contact us via email](https://github.com/sequelize/sequelize/blob/main/CONTACT.md).
Please keep in mind that the above conditions still apply to sponsored dialects, and that implementing a new dialect can be a significant investment.

## Contributing a new dialect

:::important

We do not accept new dialects for Sequelize 6.

:::

If you wish to open a pull request to add a new dialect, please follow the steps below:

- [Open a feature request](#requesting-support-for-a-new-dialect) for the new dialect, if one does not already exist.
- Indicate that you are working on implementing the dialect in the feature request (even if it's not your own request).
- Explore the source code of an existing dialect package to understand how it works. We unfortunately do not have a guide for creating a new dialect at this time.

## Creating a third-party dialect

:::important

While we are slowly working towards providing a stable public API to create third-party dialects, many necessary APIs are
still internal and subject to change.

If you do implement a third-party dialect, please be aware that it may break in future non-major versions of Sequelize.

:::

If your dialect does not match the requirements for inclusion in Sequelize, you can create a third-party dialect.

Each dialect is a separate package that extends Sequelize with the necessary functionality to connect to the database.
Third-party dialects can be published on npm and used in your project like any other package.

Consider exploring the source code of an existing dialect package to understand how it works.
We unfortunately do not have a guide for creating a new dialect at this time.
