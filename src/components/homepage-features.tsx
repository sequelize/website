import clsx from "clsx";
import React from "react";
import styles from "./homepage-features.module.css";
import CodeBlock from "@theme/CodeBlock";
import { trim } from "../models/string";

type FeatureItem = {
  title: string;
  description: JSX.Element;
  code: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Data Modeling",
    description: (
      <>
        Define your models with ease and make optional use of automatic database
        synchronization.
      </>
    ),
    code: `
      const Wishlist = sequelize.define("Wishlist", {
        title: Sequelize.STRING,
      });
      const Wish = sequelize.define("Wish", {
        title: Sequelize.STRING,
        quantity: Sequelize.NUMBER,
      });

      // Automatically create all tables
      await sequelize.sync();
    `,
  },
  {
    title: "Associations",
    description: (
      <>
        Define associations between models and let Sequelize handle the heavy
        lifting.
      </>
    ),
    code: `
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
    title: "Soft deletion",
    description: (
      <>
        Mark data as deleted instead of removing it once and for all from the database.
      </>
    ),
    code: `
      const User = sequelize.define("User", 
        { username: Sequelize.STRING },
        { paranoid: true, },
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
    <div className={clsx("col col--4")}>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div>
        <CodeBlock language="js" className={styles.codeBlock}>
          {trim(code)}
        </CodeBlock>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
