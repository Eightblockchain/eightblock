import { PrismaClient, ArticleStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to generate article content
function generateArticleContent(topic: string, paragraphs: number = 5): string {
  const sentences = [
    `${topic} represents a significant advancement in blockchain technology.`,
    `Understanding ${topic} is crucial for developers entering the Web3 space.`,
    `The implementation of ${topic} on Cardano offers unique advantages over other platforms.`,
    `Security considerations for ${topic} must be carefully evaluated in production environments.`,
    `Best practices for ${topic} continue to evolve with the ecosystem maturity.`,
    `Performance optimization in ${topic} requires systematic approaches and monitoring.`,
    `The future of ${topic} looks promising with ongoing research and development.`,
    `Community adoption of ${topic} has been steadily increasing across global markets.`,
  ];

  let content = '';
  for (let i = 0; i < paragraphs; i++) {
    content += sentences.join(' ') + '\n\n';
  }
  return content;
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Delete existing data
  await prisma.tagOnArticle.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  // Create the user with the specified wallet address
  const user = await prisma.user.create({
    data: {
      walletAddress:
        'addr1q9pyac4s5jxhhhfr4uqft4pcf830zj0kge24d52rrlljmc5mquh7wnm244uznlqx7xck0ppkyecsftexwxkv33cay4vsqd2jsh',
      name: 'Cardano Developer',
      role: 'WRITER',
      bio: 'Blockchain enthusiast and Cardano ecosystem contributor',
    },
  });

  console.log('✅ Created user:', user.walletAddress);

  // Create tags
  const tagData = [
    { name: 'Blockchain', slug: 'blockchain' },
    { name: 'Cardano', slug: 'cardano' },
    { name: 'DeFi', slug: 'defi' },
    { name: 'Smart Contracts', slug: 'smart-contracts' },
    { name: 'Web3', slug: 'web3' },
    { name: 'NFTs', slug: 'nfts' },
    { name: 'Plutus', slug: 'plutus' },
    { name: 'Marlowe', slug: 'marlowe' },
  ];

  const tags = await Promise.all(tagData.map((tag) => prisma.tag.create({ data: tag })));

  console.log('✅ Created tags:', tags.length);

  // Articles data (31 articles for infinite scroll testing)
  const articles = [
    {
      title: 'Getting Started with Cardano Development',
      slug: 'getting-started-cardano-development',
      description: 'A comprehensive guide to begin your journey in Cardano blockchain development',
      category: 'Tutorial',
      featured: true,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[1].id, tags[4].id],
    },
    {
      title: 'Understanding Plutus Smart Contracts',
      slug: 'understanding-plutus-smart-contracts',
      description: 'Deep dive into Plutus programming language and smart contract development',
      category: 'Tutorial',
      featured: true,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[3].id, tags[6].id],
    },
    {
      title: 'The Future of DeFi on Cardano',
      slug: 'future-of-defi-on-cardano',
      description: 'Exploring the potential of decentralized finance on the Cardano blockchain',
      category: 'Analysis',
      featured: true,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[1].id, tags[2].id],
    },
    {
      title: 'Building NFT Marketplaces on Cardano',
      slug: 'building-nft-marketplaces-cardano',
      description: 'Step-by-step guide to creating NFT platforms on Cardano',
      category: 'Tutorial',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[5].id, tags[1].id],
    },
    {
      title: 'Cardano Staking Explained',
      slug: 'cardano-staking-explained',
      description: 'Everything you need to know about staking ADA and earning rewards',
      category: 'Guide',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[1].id],
    },
    {
      title: 'Marlowe Financial Contracts',
      slug: 'marlowe-financial-contracts',
      description: 'Introduction to Marlowe for creating financial smart contracts',
      category: 'Tutorial',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[7].id, tags[3].id],
    },
    {
      title: 'Web3 Development Best Practices',
      slug: 'web3-development-best-practices',
      description: 'Essential practices for building secure and efficient Web3 applications',
      category: 'Guide',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[4].id, tags[0].id],
    },
    {
      title: 'Cardano Improvement Proposals (CIPs)',
      slug: 'cardano-improvement-proposals-cips',
      description: 'Understanding the governance and evolution of Cardano protocol',
      category: 'Analysis',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[1].id],
    },
    {
      title: 'Decentralized Identity on Cardano',
      slug: 'decentralized-identity-cardano',
      description: 'Exploring self-sovereign identity solutions on Cardano',
      category: 'Analysis',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[1].id, tags[4].id],
    },
    {
      title: 'Optimizing Plutus Script Performance',
      slug: 'optimizing-plutus-script-performance',
      description: 'Techniques for improving smart contract efficiency and reducing costs',
      category: 'Tutorial',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[6].id, tags[3].id],
    },
    {
      title: 'Draft: Upcoming Protocol Updates',
      slug: 'draft-upcoming-protocol-updates',
      description: 'Analysis of proposed changes to Cardano protocol',
      category: 'Analysis',
      featured: false,
      status: 'DRAFT' as ArticleStatus,
      tagIds: [tags[1].id],
    },
    {
      title: 'Cardano vs Ethereum: Technical Comparison',
      slug: 'cardano-vs-ethereum-technical-comparison',
      description: 'In-depth comparison of two leading blockchain platforms',
      category: 'Analysis',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[0].id, tags[1].id],
    },
    {
      title: 'Building Decentralized Exchanges on Cardano',
      slug: 'building-decentralized-exchanges-cardano',
      description: 'Guide to creating DEX platforms using Cardano technology',
      category: 'Tutorial',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[2].id, tags[3].id],
    },
    {
      title: 'Cardano Native Tokens Guide',
      slug: 'cardano-native-tokens-guide',
      description: 'Creating and managing custom tokens on Cardano',
      category: 'Guide',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[1].id],
    },
    {
      title: 'Smart Contract Security Auditing',
      slug: 'smart-contract-security-auditing',
      description: 'Best practices for auditing and securing blockchain smart contracts',
      category: 'Guide',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[3].id, tags[6].id],
    },
    {
      title: 'Cardano Node Setup and Configuration',
      slug: 'cardano-node-setup-configuration',
      description: 'Complete guide to running a Cardano node',
      category: 'Tutorial',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[1].id],
    },
    {
      title: 'Understanding UTXO Model',
      slug: 'understanding-utxo-model',
      description: "Deep dive into Cardano's UTXO-based transaction model",
      category: 'Guide',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[0].id, tags[1].id],
    },
    {
      title: 'Cardano Wallet Integration',
      slug: 'cardano-wallet-integration',
      description: 'Integrating wallet functionality into dApps',
      category: 'Tutorial',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[1].id, tags[4].id],
    },
    {
      title: 'Draft: Advanced Plutus Patterns',
      slug: 'draft-advanced-plutus-patterns',
      description: 'Exploring advanced programming patterns in Plutus',
      category: 'Tutorial',
      featured: false,
      status: 'DRAFT' as ArticleStatus,
      tagIds: [tags[6].id],
    },
    {
      title: 'Cardano Metadata Standards',
      slug: 'cardano-metadata-standards',
      description: 'Understanding and implementing metadata in transactions',
      category: 'Guide',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[1].id],
    },
    {
      title: 'Building Oracle Solutions for Cardano',
      slug: 'building-oracle-solutions-cardano',
      description: 'Creating reliable data feeds for smart contracts',
      category: 'Tutorial',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[1].id, tags[3].id],
    },
    {
      title: 'Cardano Treasury System',
      slug: 'cardano-treasury-system',
      description: "Understanding Cardano's governance and funding mechanisms",
      category: 'Analysis',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[1].id],
    },
    {
      title: 'Multi-Signature Wallets on Cardano',
      slug: 'multi-signature-wallets-cardano',
      description: 'Implementing secure multi-sig wallet solutions',
      category: 'Tutorial',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[1].id, tags[3].id],
    },
    {
      title: 'Cardano Sidechains and Layer 2',
      slug: 'cardano-sidechains-layer-2',
      description: 'Exploring scalability solutions for Cardano',
      category: 'Analysis',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[0].id, tags[1].id],
    },
    {
      title: 'Draft: Hydra Protocol Deep Dive',
      slug: 'draft-hydra-protocol-deep-dive',
      description: "Technical analysis of Cardano's Hydra scaling solution",
      category: 'Analysis',
      featured: false,
      status: 'DRAFT' as ArticleStatus,
      tagIds: [tags[1].id],
    },
    {
      title: 'Cardano Token Economics',
      slug: 'cardano-token-economics',
      description: 'Understanding ADA tokenomics and monetary policy',
      category: 'Analysis',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[1].id, tags[2].id],
    },
    {
      title: 'Building Gaming dApps on Cardano',
      slug: 'building-gaming-dapps-cardano',
      description: 'Creating blockchain-based gaming experiences',
      category: 'Tutorial',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[1].id, tags[5].id],
    },
    {
      title: 'Cardano Interoperability Solutions',
      slug: 'cardano-interoperability-solutions',
      description: 'Cross-chain communication and asset transfers',
      category: 'Guide',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[0].id, tags[1].id],
    },
    {
      title: 'Privacy on Cardano',
      slug: 'privacy-on-cardano',
      description: 'Understanding privacy features and best practices',
      category: 'Guide',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[1].id],
    },
    {
      title: 'Cardano Developer Resources',
      slug: 'cardano-developer-resources',
      description: 'Comprehensive list of tools, libraries, and documentation',
      category: 'Guide',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[1].id, tags[4].id],
    },
    {
      title: 'Real World Use Cases of Cardano',
      slug: 'real-world-use-cases-cardano',
      description: 'Exploring successful Cardano implementations globally',
      category: 'Analysis',
      featured: false,
      status: 'PUBLISHED' as ArticleStatus,
      tagIds: [tags[1].id],
    },
  ];

  console.log('📝 Creating articles...');

  for (const articleData of articles) {
    const { tagIds, ...articleFields } = articleData;

    const article = await prisma.article.create({
      data: {
        ...articleFields,
        content: generateArticleContent(articleFields.title, 8),
        author: { connect: { id: user.id } },
        tags: {
          create: tagIds.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    console.log(`  ✅ Created: ${article.title} (${article.status})`);
  }
  console.log(`\n🎉 Seeding completed!`);
  console.log(`   📊 Users: 1`);
  console.log(`   🏷️  Tags: ${tags.length}`);
  console.log(
    `   📝 Articles: ${articles.length} (${articles.filter((a) => a.status === 'PUBLISHED').length} published, ${articles.filter((a) => a.status === 'DRAFT').length} drafts)`
  );
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
