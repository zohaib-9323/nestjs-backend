import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import basicAuth = require('express-basic-auth');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Secure Swagger in production with Basic Auth
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Get credentials from environment variables
    const swaggerUser = process.env.SWAGGER_USER || 'admin';
    const swaggerPassword = process.env.SWAGGER_PASSWORD || 'changeme123';

    // Apply basic authentication to Swagger endpoint
    app.use(
      ['/api', '/api-json'],
      basicAuth({
        challenge: true,
        users: {
          [swaggerUser]: swaggerPassword,
        },
      }),
    );

    console.log('🔒 Swagger is protected with Basic Authentication in production');
    console.log(`   Username: ${swaggerUser}`);
    console.log('   Password: [hidden - check SWAGGER_PASSWORD env var]');
  }

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Multi-Tenant NestJS Backend API')
    .setDescription(
      `Enterprise-grade REST API with Multi-Tenant Architecture, Role-Based Access Control, and Voiceflow Integration
      
      🔐 Features:
      - JWT Authentication
      - Multi-Tenant Data Isolation
      - Company-Scoped Resources (Products, Projects, Offers)
      - Voiceflow Script Generator with Caching
      - Voiceflow Webhook Integration
      - Comprehensive Testing
      
      📖 Getting Started:
      1. Register a user: POST /auth/register
      2. Login: POST /auth/login (get JWT token)
      3. Click 'Authorize' button above and enter: Bearer YOUR_TOKEN
      4. Create a company: POST /companies
      5. Start managing resources!
      
      🔒 Security:
      - All endpoints require JWT authentication (except /auth/register, /auth/login, and webhook)
      - CompanyAccessGuard prevents cross-tenant access
      - Role-based authorization (SUPERADMIN, ADMIN, USER)
      - DELETE operations require SUPERADMIN role
      `,
    )
    .setVersion('1.0')
    .setContact(
      'API Support',
      'https://github.com/yourusername/nestjs-backend',
      'support@example.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token (obtained from /auth/login)',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User authentication and registration')
    .addTag('Users', 'User management endpoints')
    .addTag('Companies', 'Company management and member operations')
    .addTag('Products', 'Company-scoped product management')
    .addTag('Projects', 'Company-scoped project management')
    .addTag('Offers', 'Company-scoped offer management')
    .addTag('Voiceflow', 'Voiceflow integration (script generator and webhook)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai',
      },
      tryItOutEnabled: true,
    },
    customSiteTitle: 'Multi-Tenant NestJS API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #e0234e }
      .swagger-ui .scheme-container { background: #f7f7f7; padding: 15px; border-radius: 4px; }
    `,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  console.log('🚀 Application is running!');
  console.log(`📍 Server: http://localhost:${port}`);
  console.log(`📚 Swagger: http://localhost:${port}/api`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (isProduction) {
    console.log('⚠️  Swagger is protected - use credentials to access');
  }
}
bootstrap();
