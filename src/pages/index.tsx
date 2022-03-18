import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import clsx from "clsx";
import React from "react";
import HomepageFeatures from "../components/homepage-features";
import HomepageUsage from "../components/homepage-usage";
import HomepageUsers from "../components/homepage-users";
import styles from "./index.module.css";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();

  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className={clsx("container", styles.heroBannerContainer)}>
        <img src="/img/logo.svg" className="container-logo" />
        <div className={styles.textContainer}>
          <h1 className="hero__title">{siteConfig.title}</h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
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

            <Link
              className="button button--secondary button--lg"
              to="/docs/v6/other-topics/upgrade-to-v6"
            >
              Upgrade to V6
            </Link>

            <Link
              className={clsx("button button--secondary button--lg", styles.supportButton)}
              to="https://opencollective.com/sequelize"
            >
              Support us
            </Link>
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
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />"
    >
      <HomepageHeader />
      <main>
        <HomepageUsage />
        <HomepageFeatures />
        {/* <HomepageUsers /> */}
      </main>
    </Layout>
  );
}
