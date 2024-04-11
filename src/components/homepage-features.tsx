import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';
import clsx from 'clsx';
import React from 'react';
import { trim } from '../models/string';
import styles from './homepage-features.module.scss';

type FeatureItem = {
  code: string;
  description: JSX.Element;
  title: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Data Modeling',
    description: (
      <>Define your models with ease and make optional use of automatic database synchronization.</>
    ),
    code: trim`
      const Wishlist = sequelize.define("Wishlist", {
        title: DataTypes.STRING,
      });
      const Wish = sequelize.define("Wish", {
        title: DataTypes.STRING,
        quantity: DataTypes.NUMBER,
      });

      // Automatically create all tables
      await sequelize.sync();
    `,
  },
  {
    title: 'Associations',
    description: (
      <>Define associations between models and let Sequelize handle the heavy lifting.</>
    ),
    code: trim`
      Wish.belongsTo(Wishlist);
      Wishlist.hasMany(Wish);

      const wishlist = await Wishlist.findOne();
      const wishes = await wishlist.getWishes();
      const wish = await wishlist.createWish({ 
        title: 'Toys', quantity: 3,
      });

      await wishlist.removeWish(wish);
    `,
  },
  {
    title: 'Soft deletion',
    description: (
      <>Mark data as deleted instead of removing it once and for all from the database.</>
    ),
    code: trim`
      const User = sequelize.define("User", 
        { username: DataTypes.STRING },
        { paranoid: true },
      });

      const user = await User.findOne();

      await user.destroy();
      await User.findAll(); // non-deleted only
      await User.findAll({ paranoid: false }); // all
    `,
  },
];

function Feature({ title, description, code }: FeatureItem) {
  return (
    <div className={clsx('col col--4', styles.col)}>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <CodeBlock language="js" className={styles.codeBlock}>
        {code}
      </CodeBlock>
    </div>
  );
}

export function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={clsx('row', styles.row)}>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
      <div className={clsx('container--small', styles.footerCta)}>
        <h2>Ready to get started with Sequelize?</h2>
        <p>
          <Link className="topics" to="/docs/v6/other-topics/transactions/">
            Transactions
          </Link>
          ,{' '}
          <Link className="topics" to="/docs/v6/other-topics/migrations/">
            migrations
          </Link>
          ,{' '}
          <Link className="topics" to="/docs/v6/other-topics/typescript/">
            strong typing
          </Link>
          ,{' '}
          <Link
            className="topics"
            to="/docs/v6/other-topics/other-data-types/#json-sqlite-mysql-mariadb-oracle-and-postgresql-only">
            JSON querying
          </Link>
          ,{' '}
          <Link className="topics" to="/docs/v6/other-topics/hooks/">
            lifecycle events (hooks)
          </Link>
          , and more.
          <br />
          Learn more about the many features Sequelize has to offer!
        </p>
        <Link className="button button--primary button--lg" to="/docs/v6/getting-started">
          Getting Started
        </Link>
      </div>
    </section>
  );
}
