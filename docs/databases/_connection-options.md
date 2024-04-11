Connection Options are used to configure a connection to the database.

The simplest way to use them is at the root of the configuration object. These options can also be
used in the [`replication`](../other-topics/read-replication.md) option to customize the connection for each replica,
and can be modified by the [`beforeConnect`](../other-topics/hooks.mdx) hook on a connection-by-connection basis.
