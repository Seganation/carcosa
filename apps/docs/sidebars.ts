import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'index',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'quick-start',
        'installation',
        'configuration',
        'authentication',
      ],
    },
    {
      type: 'category',
      label: 'Next.js Integration',
      items: [
        'nextjs/setup',
        'nextjs/components',
      ],
    },
    {
      type: 'category',
      label: 'File Router',
      items: [
        'file-router/overview',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      items: [
        'examples/basic-upload',
      ],
    },
    {
      type: 'category',
      label: 'Migration',
      items: [
        'migration/from-uploadthing',
      ],
    },
  ],
};

export default sidebars;
