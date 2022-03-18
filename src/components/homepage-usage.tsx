import CodeBlock from '@theme/CodeBlock';
import clsx from 'clsx';
import React from 'react';
import { trim } from '../models/string';
import styles from './homepage-usage.module.scss';

export default function HomepageUsage(): JSX.Element {
  return (
    <section className={styles.usage}>
      <div className="container">
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
          </div>

          <div className={styles.usageSection}>
            <h2>Define models</h2>
            <CodeBlock language="js">
              {trim`
                import { Sequelize, Model, DataTypes } from 'sequelize';

                const sequelize = new Sequelize('sqlite::memory:');
                const User = sequelize.define('User', {
                  username: DataTypes.STRING,
                  birthday: DataTypes.DATE
                });
              `}
            </CodeBlock>
          </div>

          <div className={styles.usageSection}>
            <h2>Persist and query</h2>
            <CodeBlock language="js">
              {trim`
                const jane = await User.create({
                  username: 'janedoe',
                  birthday: new Date(1980, 6, 20)
                });

                const users = await User.findAll();
              `}
            </CodeBlock>
          </div>
        </div>
      </div>
    </section>
  );
}
