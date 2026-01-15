import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { ProjectsModule } from './projects/projects.module';
import { OffersModule } from './offers/offers.module';
import { VoiceflowModule } from './voiceflow/voiceflow.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { getMongoConnectionString } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(getMongoConnectionString()),
    CacheModule.register({
      isGlobal: true,
      ttl: 300000, // 5 minutes default TTL in milliseconds
      max: 100, // Maximum number of items in cache
    }),
    AuthModule,
    UsersModule,
    CompaniesModule,
    ProductsModule,
    ProjectsModule,
    OffersModule,
    VoiceflowModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
