import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Oshinstar API',
      version: '1.0.0',
      description: 'API documentation for Oshinstar',
      contact: {
        name: 'Oshinstar Support',
        email: 'support@oshinstar.com'
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Ensure this path is correct
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

export default swaggerDocs;
