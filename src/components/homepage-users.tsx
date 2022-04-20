import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { Carousel } from 'react-responsive-carousel';
import styles from './homepage-users.module.scss';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

type User = {
  image: string,
  name: string,
  testimonial: string,
  style?: any,
  author?: string,
};
const users: User[] = [
  {
    name: 'uphold',
    image: '/img/uphold-logo.svg',
    testimonial:
      'Uphold is proud to be using Sequelize for 7+ years. It has served us well and has allowed us to grow to 12 million users (and counting). We will continue to invest and contribute in the platform.',
    author: 'Nuno Sousa',
  },
  {
    image: '/img/bitovi-logo.png',
    style: { maxHeight: 50 },
    name: 'Bitovi',
    testimonial:
      'We have used Sequelize in enterprise projects for some of our Fortune 100 and Fortune 500 clients. It is used in deployments that are depended on by hundreds of millions of devices every year.',
  },
  {
    image: '/img/ermeshotels-logo.png',
    name: 'Ermes Hotels',
    testimonial:
      'Using Sequelize in production for two different apps with 30k+ daily users by 2 years. I doubt there is something better at this moment in terms of productivity and features.',
  },
  {
    image: '/img/secure-coders.png',
    name: 'Secure Coders',
    testimonial:
      'Sequelize provides a reliable and convenient ORM for any SQL dialect which greatly simplifies working with both simple and complex data models. The data migration features are just icing on the cake.',
    author: 'Charley Wooley',
  },
  {
    image: '/img/logo-snaplytics-green.png',
    name: 'Snaplytics',
    testimonial:
      'We\'ve been using sequelize since we started in the beginning of 2015. We use it for our graphql servers (in connection with graphql-sequelize), and for all our background workers.',
    style: { paddingTop: '10px' },
  },
  // {
  //   image: "/img/shutterstock.png",
  //   name: "Shutterstock",
  //   style: { paddingTop: "10px" },
  // },
  {
    image: '/img/walmart-labs-logo.png',
    name: 'Walmart Labs',
    testimonial:
      '... we are avid users of sequelize and have been for the past 18 months. (Feb 2017)',
    style: { paddingTop: '15px' },
  },
];

export default function HomepageUsers(): JSX.Element {
  const [activeUser, setActiveUser] = useState<User>(users[0]);
  const [width, setWidth] = useState<number>(window.innerWidth);

  function handleWindowSizeChange() {
    setWidth(window.innerWidth);
  }

  const onChange = (index: number) => {
    setActiveUser(users[index]);
  };

  useEffect(() => {
    window.addEventListener('resize', handleWindowSizeChange);

    return () => {
      window.removeEventListener('resize', handleWindowSizeChange);
    };
  }, []);

  const isMobile = width <= 768;

  return (
    <section className={styles.users}>
      <div className="container">
        <h2>Trusted and used by</h2>
        <div className={clsx(styles.userRow)}>
          <Carousel
            showArrows={false}
            showStatus={false}
            showIndicators={false}
            infiniteLoop
            showThumbs={false}
            useKeyboardArrows
            autoPlay
            stopOnHover
            swipeable
            emulateTouch
            centerSlidePercentage={isMobile ? 75 : 25}
            centerMode
            onChange={onChange}
            transitionTime={1000}
          >
            {users.map(user => (
              <div key={user.name} className={styles.slide}>
                <img src={user.image} style={user.style} alt={user.name} />
              </div>
            ))}
          </Carousel>

          <div className={styles.testimonialWrapper}>
            <div className={styles.testimonial}>
              <span className={styles.testimonialText}>
                {activeUser.testimonial}
              </span>
              <span className={styles.userName}>
                {activeUser.author
                  ? `${activeUser.author} (${activeUser.name})`
                  : activeUser.name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
