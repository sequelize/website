import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import React from 'react';
import HomepageFeatures from '../components/homepage-features';
import HomepageUsage from '../components/homepage-usage';
import HomepageUsers from '../components/homepage-users';
import css from './index.module.scss';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();

  return (
    <header className={clsx('hero hero--primary', css.heroBanner)}>
      <div className={clsx('container', css.heroBannerContainer)}>
        <img src="/img/logo.svg" className="container-logo" alt="" />
        <div className={css.textContainer}>
          <h1 className="hero__title">{siteConfig.title}</h1>
          <p className={css.heroSubtitle}>{siteConfig.tagline}</p>
          <div className={css.buttons}>
            <div className={css.buttonGroup}>
              <Link
                className="button button--primary button--lg"
                to="/docs/v6/getting-started"
              >
                Getting Started
              </Link>

              <Link
                className="button button--secondary button--lg"
                to="/docs/v6/getting-started"
              >
                API Reference
              </Link>
            </div>

            <div className={css.buttonGroup}>
              <Link
                className="button button--secondary button--lg"
                to="/docs/v6/other-topics/upgrade-to-v6"
              >
                Upgrade to V6
              </Link>

              <Link
                className={clsx('button button--secondary button--lg', css.supportButton)}
                to="https://opencollective.com/sequelize"
              >
                Support us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      title="Sequelize - Feature-rich ORM for modern TypeScript & JavaScript"
      description={siteConfig.tagline}
    >
      <HomepageHeader />
      <main>
        <HomepageUsage />
        <HomepageFeatures />
        <HomepageUsers />
      </main>
    </Layout>
  );
}
