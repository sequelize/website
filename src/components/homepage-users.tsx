import clsx from 'clsx';
import type { CSSProperties } from 'react';
import React from 'react';
import styles from './homepage-users.module.scss';

type User = {
  image: string,
  style?: CSSProperties,
};

const users: User[] = [
  { image: 'bitovi-logo.png', style: { paddingBottom: '10px' } },
  { image: 'ermeshotels-logo.png' },
  { image: 'metamarkets.png' },
  { image: 'logo-snaplytics-green.png' },
  { image: 'shutterstock.png' },
  { image: 'walmart-labs-logo.png' },
];

export default function HomepageUsers(): JSX.Element {
  return (
    <section className={styles.users}>
      <div className="container">
        <h2>Trusted and used by</h2>
        <div className={clsx(styles.userRow)}>
          <div>
            <img src="/img/bitovi-logo.png" style={{ paddingBottom: '10px' }} alt="Bitovi" />
            <img src="/img/ermeshotels-logo.png" alt="ErmesHotels" />
            <img src="/img/metamarkets.png" alt="Metamarkets" />
            <img src="/img/logo-snaplytics-green.png" alt="Snaplytics" />
          </div>
          <div>
            <img src="/img/shutterstock.png" alt="Shutterstock" />
            <img src="/img/walmart-labs-logo.png" alt="Wallmart Labs" />
          </div>
        </div>
      </div>
    </section>
  );
}
