import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/search',
    component: ComponentCreator('/search', '5de'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', 'f78'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', 'fa7'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', '3ac'),
            routes: [
              {
                path: '/authentication',
                component: ComponentCreator('/authentication', '153'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/configuration',
                component: ComponentCreator('/configuration', '7ff'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/examples/basic-upload',
                component: ComponentCreator('/examples/basic-upload', 'a25'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/file-router/overview',
                component: ComponentCreator('/file-router/overview', '7eb'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/installation',
                component: ComponentCreator('/installation', '6ad'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/migration/from-uploadthing',
                component: ComponentCreator('/migration/from-uploadthing', '633'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/nextjs/components',
                component: ComponentCreator('/nextjs/components', 'b6d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/nextjs/setup',
                component: ComponentCreator('/nextjs/setup', '3f6'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/quick-start',
                component: ComponentCreator('/quick-start', 'b77'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/',
                component: ComponentCreator('/', '2d7'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
