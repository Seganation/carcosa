import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/search',
    component: ComponentCreator('/search', '5de'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', '344'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '726'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', 'bf4'),
            routes: [
              {
                path: '/authentication',
                component: ComponentCreator('/authentication', 'f01'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/configuration',
                component: ComponentCreator('/configuration', '21e'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/examples/basic-upload',
                component: ComponentCreator('/examples/basic-upload', '01a'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/file-router/overview',
                component: ComponentCreator('/file-router/overview', 'a6f'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/installation',
                component: ComponentCreator('/installation', '63c'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/migration/from-uploadthing',
                component: ComponentCreator('/migration/from-uploadthing', '4ab'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/nextjs/components',
                component: ComponentCreator('/nextjs/components', '3fa'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/nextjs/setup',
                component: ComponentCreator('/nextjs/setup', '3f0'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/quick-start',
                component: ComponentCreator('/quick-start', '198'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/',
                component: ComponentCreator('/', '94e'),
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
