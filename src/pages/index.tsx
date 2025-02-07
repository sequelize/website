import BrowserOnly from '@docusaurus/BrowserOnly';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import React from 'react';
import { HomepageFeatures } from '../components/homepage-features';
import { HomepageUsage } from '../components/homepage-usage';
import { HomepageUsers } from '../components/homepage-users';
import { useAds } from '../hooks/use-ads';
import css from './index.module.scss';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();

  // This will inject the ads into the footer of the homepage.
  // The target container is injected in the docusaurus footer config.
  useAds({ selector: '.ads-container' });

  return (
    <header className={clsx('hero hero--primary', css.heroBanner)}>
      <div className={clsx('container', css.heroBannerContainer)}>
        <img src="/img/logo.svg" className="container-logo" alt="" />
        <div className={css.textContainer}>
          <h1 className="hero__title">{siteConfig.title}</h1>
          <p className={css.heroSubtitle}>{siteConfig.tagline}</p>
          <div className={css.buttons}>
            <div className={css.buttonGroup}>
              <Link className="button button--primary button--lg" to="/docs/v6/getting-started">
                Getting Started
              </Link>

              <Link
                className="button button--secondary button--lg"
                to="pathname:///api/v6/identifiers">
                API Reference
              </Link>
            </div>

            <div className={css.buttonGroup}>
              <Link
                className="button button--secondary button--lg"
                to="/docs/v6/other-topics/upgrade">
                Upgrade to v6
              </Link>

              <Link
                className={clsx('button button--secondary button--lg', css.supportButton)}
                to="https://opencollective.com/sequelize">
                Support us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function HomepageNewMaintainers() {
  return (
    <div className={css.banner}>
      <h2>
        <span role="img" aria-label="Rocket">
          🚀
        </span>{' '}
        Sequelize Needs Maintainers!{' '}
        <span role="img" aria-label="Rocket">
          🚀
        </span>
      </h2>
      <p>
        Want to help finish the next major release of Sequelize? We're looking for new contributors
        and maintainers! 💡
      </p>
      <p>
        <strong>
          <span role="img" aria-label="Money">
            💰
          </span>{' '}
          Funding available:
        </strong>{' '}
        $2,500 per quarter distributed among maintainers.
      </p>
      <p>
        <span role="img" aria-label="Message">
          📩
        </span>{' '}
        <Link to="https://sequelize.org/slack">Join our Slack</Link> and reach out to{' '}
        <strong>@WikiRik</strong> or <strong>@sdepold</strong>.
      </p>
    </div>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout description={siteConfig.tagline}>
      {/* we don't add '| Sequelize' on the homepage title because it already starts with 'Sequelize -' for better search results display */}
      <Head titleTemplate="%s">
        <title>Sequelize | Feature-rich ORM for modern TypeScript & JavaScript</title>
      </Head>
      <HomepageHeader />
      <main>
        <HomepageNewMaintainers />
        <HomepageUsage />
        <HomepageFeatures />
        <BrowserOnly>{() => <HomepageUsers />}</BrowserOnly>
      </main>
    </Layout>
  );
}
