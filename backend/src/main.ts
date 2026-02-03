import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  const corsOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [
    'http://localhost:3000',
    'http://localhost:4000',
  ];
  console.log('CORS origins:', corsOrigins);
  
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // Disable versioning - using manual prefix instead
  // app.enableVersioning({
  //   type: VersioningType.URI,
  //   defaultVersion: '1',
  // });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('BLESSCENT API')
    .setDescription('BLESSCENT Retail POS System API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('products', 'Product catalog')
    .addTag('inventory', 'Inventory management')
    .addTag('pricing', 'Pricing management')
    .addTag('sales', 'Sales & orders')
    .addTag('members', 'Member management')
    .addTag('resellers', 'Reseller management')
    .addTag('ledger', 'Ledger & payments')
    .addTag('reports', 'Reports & analytics')
    .addTag('sync', 'Offline sync')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 BLESSCENT Backend running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
