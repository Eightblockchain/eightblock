export const siteConfig = {
  name: 'Eightblock',
  author: 'Eightblock',
  role: 'Web3 builder & writer',
  tagline:
    'Notes on blockchain, smart contracts, and the systems shaping decentralized technology.',
  description:
    'Research notes, tutorials and field reports on web3, smart contracts, zero-knowledge, Cardano, Midnight and Safrochain, from building on real networks.',
  url: 'https://eightblock.dev',
  /** The separate admin app, for accounts with the ADMIN role. */
  adminUrl: (process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001').replace(/\/$/, ''),
  twitterHandle: '@Eightblock66103',
  showWrittenBy: false,
  links: {
    twitter: 'https://x.com/Eightblock66103',
    github: 'https://github.com/Eightblockchain/eightblock',
  },
  hero: {
    eyebrow: 'Independent blockchain writing',
    titleLead: 'Understand the chain.',
    titleTrail: 'Build with confidence.',
    subtitle:
      'Research notes, tutorials and field reports from building on real networks. Written plainly, so you can learn blockchain without the noise.',
  },
  /** Default topics printed on generated social cards. */
  networks: ['Cardano', 'Midnight', 'Safrochain', 'Ethereum', 'Zero-Knowledge'],
  /** Tags suggested on the home page even before anything is published under them. */
  topics: ['Zero-Knowledge', 'Smart Contracts', 'Ethereum', 'DeFi', 'Governance', 'Tutorials'],
  principles: [
    {
      title: 'Built, then written',
      body: 'Every post comes from hands-on work on live networks and testnets. These are the notes I wish I had when I started.',
    },
    {
      title: 'Clear over clever',
      body: 'Concepts explained plainly, with sources and working code where it matters. No hype, no shilling.',
    },
    {
      title: 'Made to last',
      body: 'Fundamentals that stay useful beyond the current cycle: architecture, security, privacy and governance.',
    },
  ],
  newsletter: {
    title: 'New blocks, straight to your inbox.',
    description:
      'New articles on web3, smart contracts and decentralized systems, plus a short weekly roundup when there is something new. No spam, and you can unsubscribe in one click.',
  },
  about: {
    bio: 'I build and write about web3. My work sits at the intersection of smart contracts, blockchain infrastructure, and the ecosystems trying to make decentralized systems practical.',
    extended:
      'This blog is my public notebook: research notes, technical write-ups, and lessons from building on Cardano, Midnight, Safrochain and the wider web3 space. I publish here to share what I learn and to document ideas worth revisiting.',
    focusAreas: [
      'Smart contract development',
      'Cardano, Midnight & Safrochain',
      'Zero-knowledge & privacy',
      'Decentralized governance',
      'Developer tooling',
    ],
  },
};

export type SiteConfig = typeof siteConfig;
