// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const lightCodeTheme = require('prism-react-renderer/themes/github');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Sequelize',
  tagline:
    'Sequelize is a modern TypeScript and Node.js ORM for Oracle, Postgres, MySQL, MariaDB, SQLite and SQL Server, and more. Featuring solid transaction support, relations, eager and lazy loading, read replication and more.',
  url: 'https://sequelize.org',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  organizationName: 'sequelize',
  trailingSlash: true,
  projectName: 'sequelize',
  plugins: ['docusaurus-plugin-sass'],
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/sequelize/website/tree/main/',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          versions: {
            // the name of the version inside 'docs'
            // this should always be the 'alpha' version
            // the stable version should be inside 'versioned_docs'
            current: {
              label: 'v7 - alpha',
              path: 'v7',
            },
            '6.x.x': {
              label: 'v6 - stable',
              path: 'v6',
            },
          },
        },
        theme: {
          customCss: require.resolve('./src/css/custom.scss'),
        },
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    {
      navbar: {
        title: 'Sequelize',
        logo: {
          alt: 'Sequelize Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docsVersionDropdown',
            position: 'left',
            dropdownItemsAfter: [
              {
                href: 'pathname:///v5',
                label: 'v5',
              },
              {
                href: 'pathname:///v4',
                label: 'v4',
              },
              {
                href: 'pathname:///v3',
                label: 'v3',
              },
              {
                href: 'pathname:///v2',
                label: 'v2',
              },
              {
                href: 'pathname:///v1',
                label: 'v1',
              },
            ],
            dropdownActiveClassDisabled: true,
          },
          {
            type: 'dropdown',
            label: 'API References',
            position: 'left',
            items: [
              {
                label: 'Sequelize 7',
                href: 'pathname:///api/v7',
              },
              {
                label: 'Sequelize 6',
                href: 'pathname:///api/v6/identifiers.html',
              },
              {
                label: 'Sequelize 5',
                href: 'pathname:///v5/identifiers.html',
              },
              {
                label: 'Sequelize 4',
                href: 'pathname:///v4/identifiers.html',
              },
              {
                label: 'Sequelize 3',
                href: 'pathname:///v3/api/sequelize',
              },
              {
                label: 'Sequelize 2',
                href: 'pathname:///v2/api/sequelize',
              },
            ],
          },
          {
            href: 'https://sequelize.org/slack',
            label: 'Slack',
            position: 'right',
          },
          {
            href: 'https://github.com/sequelize/sequelize',
            label: 'GitHub',
            position: 'right',
          },
          {
            href: 'https://github.com/sequelize/sequelize/blob/main/SECURITY.md',
            label: 'Security',
            position: 'right',
          },
        ],
      },
      // documentation: https://docusaurus.io/docs/search
      algolia: {
        appId: 'HFDFWN39WP',
        apiKey: '71548217f591df1f6774c85a602ec591',
        indexName: 'sequelize',
        contextualSearch: true,

        // Path of search page
        searchPagePath: 'search',
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Guides',
                to: '/docs/v6/',
              },
              {
                label: 'Version Policy',
                to: '/releases',
              },
              {
                label: 'Security',
                href: 'https://github.com/sequelize/sequelize/blob/main/SECURITY.md',
              },
              {
                label: 'Changelog',
                href: 'https://github.com/sequelize/sequelize/releases',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/sequelize.js',
              },
              {
                label: 'Slack',
                href: 'https://sequelize.org/slack',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/SequelizeJS',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/sequelize/sequelize',
              },
            ],
          },
          {
            title: 'Support',
            items: [
              {
                label: 'OpenCollective',
                href: 'https://opencollective.com/sequelize',
              },
              {
                html: '<div class="ads-container"></div>',
              },
            ],
          },
        ],
        copyright: `
          Copyright © ${new Date().getFullYear()} Sequelize Contributors. <br/>
          Built with Docusaurus and <a href="https://www.netlify.com">powered by Netlify</a>.
        `,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        magicComments: [
          {
            className: 'theme-code-block-highlighted-line',
            line: 'highlight-next-line',
            block: { start: 'highlight-start', end: 'highlight-end' },
          },
          {
            className: 'code-block-error-line',
            line: 'error-next-line',
            block: { start: 'error-start', end: 'error-end' },
          },
          {
            className: 'code-block-success-line',
            line: 'success-next-line',
            block: { start: 'success-start', end: 'success-end' },
          },
        ],
      },
    },
};

module.exports = config;
