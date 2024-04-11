import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';
import clsx from 'clsx';
import React from 'react';
import { ArrowRight } from 'react-feather';
import { trim } from '../models/string';
import styles from './homepage-usage.module.scss';

export function HomepageUsage(): JSX.Element {
  return (
    <section className={styles.usage}>
      <div className="container--small">
        <div className={clsx('row', styles.usageRow)}>
          <div className={styles.usageSection}>
            <h2>Install dependencies</h2>
            <CodeBlock language="bash">
              {trim`
                npm install sequelize sqlite3
                # or
                yarn add sequelize sqlite3
              `}
            </CodeBlock>
            <p className={styles.docsLink}>
              <Link to="/docs/v6/getting-started/">
                Getting Started <ArrowRight size="1.25em" />
              </Link>
            </p>
          </div>

          <div className={styles.usageSection}>
            <h2>Define models</h2>
            <CodeBlock language="js">
              {trim`
                import { Sequelize, DataTypes } from 'sequelize';

                const sequelize = new Sequelize('sqlite::memory:');
                const User = sequelize.define('User', {
                  username: DataTypes.STRING,
                  birthday: DataTypes.DATE,
                });
              `}
            </CodeBlock>
            <p className={styles.docsLink}>
              <Link to="/docs/v6/core-concepts/model-basics/">
                Defining Models <ArrowRight size="1.25em" />
              </Link>
            </p>
          </div>

          <div className={styles.usageSection}>
            <h2>Persist and query</h2>
            <CodeBlock language="js">
              {trim`
                const jane = await User.create({
                  username: 'janedoe',
                  birthday: new Date(1980, 6, 20),
                });

                const users = await User.findAll();
              `}
            </CodeBlock>
            <p className={styles.docsLink}>
              <Link to="/docs/v6/core-concepts/model-querying-basics/">
                Querying Models <ArrowRight size="1.25em" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
