const swaggerDoc = {
  openapi: '3.0.0',
  info: {
    title: 'eightblock API',
    version: '0.1.0',
    description: 'REST API for articles, engagement, and admin tooling.',
  },
  servers: [{ url: 'http://localhost:4000/api' }],
  paths: {
    '/articles': {
      get: { summary: 'List articles', responses: { '200': { description: 'OK' } } },
      post: {
        summary: 'Create article',
        requestBody: { required: true },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/articles/{slug}': {
      get: {
        summary: 'Get article by slug',
        parameters: [{ name: 'slug', in: 'path', required: true }],
        responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } },
      },
    },
    '/subscriptions': {
      post: { summary: 'Subscribe to newsletter', responses: { '201': { description: 'Created' } } },
    },
  },
};

export default swaggerDoc;
