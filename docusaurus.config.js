// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const lightCodeTheme = require('prism-react-renderer/themes/github');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Sequelize',
  tagline: 'Sequelize is a promise-based Node.js ORM for Postgres, MySQL, MariaDB, SQLite and Microsoft SQL Server. It features solid transaction support, relations, eager and lazy loading, read replication and more.',
  url: 'https://sequelize.org',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  organizationName: 'sequelize',
  projectName: 'sequelize',
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl:
            'https://github.com/sequelize/sequelize/tree/main/documentation/',
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
          customCss: require.resolve('./src/css/custom.css'),
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
            ],
            dropdownActiveClassDisabled: true,
          },
          // {
          //   type: 'doc',
          //   docId: 'intro',
          //   position: 'left',
          //   label: 'Guides',
          // },
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
            ],
          },
          {
            href: 'https://sequelize-slack.herokuapp.com/',
            label: 'Slack',
            position: 'right',
          },
          {
            href: 'https://github.com/sequelize/sequelize',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Tutorial',
                to: '/docs/v6/intro',
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
                href: 'https://sequelize-slack.herokuapp.com/',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/SequelizeJS',
              },
            ],
          },
          {
            title: 'More',
            items: [
              // {
              //   label: 'Blog',
              //   to: '/blog',
              // },
              {
                label: 'GitHub',
                href: 'https://github.com/sequelize/sequelize',
              },
              {
                label: 'Changelog',
                href: 'https://github.com/sequelize/sequelize/releases',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Sequelize Contributors. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    },
};

module.exports = config;
