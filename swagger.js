const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Collaborative Decision Voting API',
      version: '1.0.0',
      description: 'API for a collaborative decision-making voting application',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        UserResponces: {
          type: 'object',
          required: ['id', 'email', 'name'],
          properties: {
            data:{
              token: { 
                type: 'string', description: 'JWT token for authentication' },
              user: { 
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                },
              }
            }
          },
        },
        Room: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            uniqueId: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            deadline: { type: 'string', format: 'date-time' },
            creatorId: { type: 'string', format: 'uuid' },
            options: {
              type: 'array',
              items: { $ref: '#/components/schemas/Option' },
            },
          },
          required: ['title', 'description', 'deadline', 'creatorId', 'options'],
        },
        Option: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            text: { type: 'string' },
            voteCount: { type: 'integer', minimum: 0 },
            roomId: { type: 'string', format: 'uuid' },
          },
          required: ['text', 'roomId'],
        },
        Vote: {
          type: 'object',
          properties: {
            optionId: { type: 'string', format: 'uuid' },
            guestsId: { type: 'string', format: 'uuid' },
          },
          required: ['optionId'],
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
          required: ['message'],
        },
      },
    },
  },
  apis: ['./src/routes/*.js' ], // Scan routes for JSDoc comments
};

export default  options;