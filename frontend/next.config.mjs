import { withContentlayer } from 'next-contentlayer';

/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    mdxRs: true,
  },
};

export default withContentlayer(config);
