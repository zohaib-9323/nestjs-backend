import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Webhook Integration (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let userToken: string;
  let companyId: string;
  let productId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    connection = moduleFixture.get<Connection>(getConnectionToken());

    // Setup: Create user, company, and products
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'webhook@test.com',
        password: 'password123',
        firstName: 'Webhook',
        lastName: 'Test',
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'webhook@test.com',
        password: 'password123',
      });

    userToken = loginResponse.body.access_token;

    const companyResponse = await request(app.getHttpServer())
      .post('/companies')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Webhook Test Company',
        websiteUrl: 'https://webhook-test.com',
        phoneNumber: '+1234567890',
      });

    companyId = companyResponse.body._id;

    // Create test products
    const product1 = await request(app.getHttpServer())
      .post(`/companies/${companyId}/products`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Premium Laptop',
        description: 'High-performance laptop',
        price: 999.99,
      });

    productId = product1.body._id;

    await request(app.getHttpServer())
      .post(`/companies/${companyId}/products`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse',
        price: 29.99,
      });

    // Create test project
    await request(app.getHttpServer())
      .post(`/companies/${companyId}/projects`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Mobile App Development',
        goal: 'Build iOS and Android apps',
      });

    // Create test offer
    await request(app.getHttpServer())
      .post(`/companies/${companyId}/offers`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'New Year Sale',
        discount: 25,
      });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await app.close();
  });

  describe('Webhook - get_products intent', () => {
    it('should return products for valid company', async () => {
      const response = await request(app.getHttpServer())
        .post('/voiceflow/webhook')
        .send({
          intent: 'get_products',
          companyId: companyId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.intent).toBe('get_products');
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data.products).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(response.body.message).toContain('2 products');
    });

    it('should respect limit parameter', async () => {
      const response = await request(app.getHttpServer())
        .post('/voiceflow/webhook')
        .send({
          intent: 'get_products',
          companyId: companyId,
          parameters: { limit: 1 },
        })
        .expect(201);

      expect(response.body.data.products).toHaveLength(1);
    });
  });

  describe('Webhook - search_products intent', () => {
    it('should search products by name', async () => {
      const response = await request(app.getHttpServer())
        .post('/voiceflow/webhook')
        .send({
          intent: 'search_products',
          companyId: companyId,
          parameters: { query: 'laptop' },
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toContain('Laptop');
    });

    it('should return empty array for no matches', async () => {
      const response = await request(app.getHttpServer())
        .post('/voiceflow/webhook')
        .send({
          intent: 'search_products',
          companyId: companyId,
          parameters: { query: 'nonexistent' },
        })
        .expect(201);

      expect(response.body.data.products).toHaveLength(0);
      expect(response.body.message).toContain("couldn't find");
    });
  });

  describe('Webhook - get_product_details intent', () => {
    it('should return specific product details', async () => {
      const response = await request(app.getHttpServer())
        .post('/voiceflow/webhook')
        .send({
          intent: 'get_product_details',
          companyId: companyId,
          parameters: { productName: 'Premium Laptop' },
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.found).toBe(true);
      expect(response.body.data.product.name).toBe('Premium Laptop');
      expect(response.body.data.product.price).toBe(999.99);
    });

    it('should handle product not found', async () => {
      const response = await request(app.getHttpServer())
        .post('/voiceflow/webhook')
        .send({
          intent: 'get_product_details',
          companyId: companyId,
          parameters: { productName: 'Nonexistent Product' },
        })
        .expect(201);

      expect(response.body.data.found).toBe(false);
      expect(response.body.message).toContain("couldn't find");
    });
  });

  describe('Webhook - get_projects intent', () => {
    it('should return projects', async () => {
      const response = await request(app.getHttpServer())
        .post('/voiceflow/webhook')
        .send({
          intent: 'get_projects',
          companyId: companyId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projects).toHaveLength(1);
      expect(response.body.data.projects[0].title).toBe('Mobile App Development');
    });
  });

  describe('Webhook - get_offers intent', () => {
    it('should return offers', async () => {
      const response = await request(app.getHttpServer())
        .post('/voiceflow/webhook')
        .send({
          intent: 'get_offers',
          companyId: companyId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.offers).toHaveLength(1);
      expect(response.body.data.offers[0].discount).toBe(25);
      expect(response.body.message).toContain('25% off');
    });
  });

  describe('Webhook - get_company_info intent', () => {
    it('should return company information', async () => {
      const response = await request(app.getHttpServer())
        .post('/voiceflow/webhook')
        .send({
          intent: 'get_company_info',
          companyId: companyId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.company.name).toBe('Webhook Test Company');
      expect(response.body.data.company.website).toBe('https://webhook-test.com');
      expect(response.body.data.company.phone).toBe('+1234567890');
    });
  });

  describe('Webhook - Error Handling', () => {
    it('should return 400 for unknown intent', async () => {
      await request(app.getHttpServer())
        .post('/voiceflow/webhook')
        .send({
          intent: 'unknown_intent',
          companyId: companyId,
        })
        .expect(400);
    });

    it('should return 404 for non-existent company', async () => {
      await request(app.getHttpServer())
        .post('/voiceflow/webhook')
        .send({
          intent: 'get_products',
          companyId: '507f1f77bcf86cd799439999',
        })
        .expect(404);
    });

    it('should return 400 for invalid company ID format', async () => {
      await request(app.getHttpServer())
        .post('/voiceflow/webhook')
        .send({
          intent: 'get_products',
          companyId: 'invalid-id',
        })
        .expect(400);
    });

    it('should return 400 for search without query parameter', async () => {
      await request(app.getHttpServer())
        .post('/voiceflow/webhook')
        .send({
          intent: 'search_products',
          companyId: companyId,
          parameters: {},
        })
        .expect(400);
    });
  });

  describe('Webhook - Public Access (No Authentication)', () => {
    it('should work without authentication token', async () => {
      const response = await request(app.getHttpServer())
        .post('/voiceflow/webhook')
        .send({
          intent: 'get_products',
          companyId: companyId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });
});

