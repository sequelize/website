import clsx from "clsx";
import React from "react";
import styles from "./homepage-users.module.css";

type User = {
  image: string;
  style?: any;
};

const users: User[] = [
  { image: "bitovi-logo.png", style: { paddingBottom: "10px" } },
  { image: "ermeshotels-logo.png" },
  { image: "metamarkets.png" },
  { image: "logo-snaplytics-green.png" },
  { image: "shutterstock.png" },
  { image: "walmart-labs-logo.png" },
];

export default function HomepageUsers(): JSX.Element {
  return (
    <section className={styles.users}>
      <div className="container">
        <h2>Trusted and used by</h2>
        <div className={clsx("row", styles.userRow)}>
          {users.map(({ image, style }) => (
            <div className={clsx("col", styles.userCol)} key={image}>
              <img src={`/img/${image}`} style={style} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
