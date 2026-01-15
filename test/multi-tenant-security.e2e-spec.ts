import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Multi-Tenant Security (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let johnToken: string;
  let aliceToken: string;
  let johnCompanyId: string;
  let aliceCompanyId: string;
  let johnUserId: string;
  let aliceUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    connection = moduleFixture.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    // Clean up test data
    await connection.dropDatabase();
    await app.close();
  });

  describe('Setup: Create users and companies', () => {
    it('should register John', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'john@test.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      johnUserId = response.body._id;
    });

    it('should login John', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'john@test.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      johnToken = response.body.access_token;
    });

    it('should create company for John', async () => {
      const response = await request(app.getHttpServer())
        .post('/companies')
        .set('Authorization', `Bearer ${johnToken}`)
        .send({
          name: 'John Company',
          websiteUrl: 'https://john.com',
          phoneNumber: '+1111111111',
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      johnCompanyId = response.body._id;
    });

    it('should register Alice', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'alice@test.com',
          password: 'password123',
          firstName: 'Alice',
          lastName: 'Smith',
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      aliceUserId = response.body._id;
    });

    it('should login Alice', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'alice@test.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      aliceToken = response.body.access_token;
    });

    it('should create company for Alice', async () => {
      const response = await request(app.getHttpServer())
        .post('/companies')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          name: 'Alice Company',
          websiteUrl: 'https://alice.com',
          phoneNumber: '+2222222222',
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      aliceCompanyId = response.body._id;
    });
  });

  describe('Multi-Tenant Access Control', () => {
    it('should not allow Alice to access John company data', async () => {
      await request(app.getHttpServer())
        .get(`/companies/${johnCompanyId}/products`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(403);
    });

    it('should not allow Alice to create products in John company', async () => {
      await request(app.getHttpServer())
        .post(`/companies/${johnCompanyId}/products`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          name: 'Hacker Product',
          description: 'Should not be created',
          price: 999.99,
        })
        .expect(403);
    });

    it('should not allow Alice to access John projects', async () => {
      await request(app.getHttpServer())
        .get(`/companies/${johnCompanyId}/projects`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(403);
    });

    it('should not allow Alice to access John offers', async () => {
      await request(app.getHttpServer())
        .get(`/companies/${johnCompanyId}/offers`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(403);
    });

    it('should not allow Alice to generate Voiceflow script for John company', async () => {
      await request(app.getHttpServer())
        .get(`/companies/${johnCompanyId}/voiceflow/script`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(403);
    });
  });

  describe('Authorized Access', () => {
    let johnProductId: string;

    it('should allow John to create products in his company', async () => {
      const response = await request(app.getHttpServer())
        .post(`/companies/${johnCompanyId}/products`)
        .set('Authorization', `Bearer ${johnToken}`)
        .send({
          name: 'John Product',
          description: 'This is John product',
          price: 99.99,
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      johnProductId = response.body._id;
    });

    it('should allow John to access his own products', async () => {
      const response = await request(app.getHttpServer())
        .get(`/companies/${johnCompanyId}/products`)
        .set('Authorization', `Bearer ${johnToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
    });

    it('should allow Alice to access her own company', async () => {
      const response = await request(app.getHttpServer())
        .get(`/companies/${aliceCompanyId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      expect(response.body.name).toBe('Alice Company');
    });
  });

  describe('Member Access', () => {
    it('should allow John to add Alice as member', async () => {
      await request(app.getHttpServer())
        .post(`/companies/${johnCompanyId}/members/${aliceUserId}`)
        .set('Authorization', `Bearer ${johnToken}`)
        .expect(200);
    });

    it('should now allow Alice to access John company as member', async () => {
      const response = await request(app.getHttpServer())
        .get(`/companies/${johnCompanyId}/products`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should allow Alice (as member) to create products in John company', async () => {
      await request(app.getHttpServer())
        .post(`/companies/${johnCompanyId}/products`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          name: 'Product by Member Alice',
          description: 'Created by team member',
          price: 149.99,
        })
        .expect(201);
    });

    it('should now show 2 products in John company', async () => {
      const response = await request(app.getHttpServer())
        .get(`/companies/${johnCompanyId}/products`)
        .set('Authorization', `Bearer ${johnToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
    });
  });

  describe('Unauthenticated Access', () => {
    it('should not allow access without token', async () => {
      await request(app.getHttpServer())
        .get(`/companies/${johnCompanyId}/products`)
        .expect(401);
    });

    it('should not allow access with invalid token', async () => {
      await request(app.getHttpServer())
        .get(`/companies/${johnCompanyId}/products`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});

