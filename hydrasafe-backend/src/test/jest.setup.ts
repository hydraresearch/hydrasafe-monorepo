import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

// Create a global test app instance
let testApp;

beforeAll(async () => {
  testApp = await NestFactory.create(AppModule);
  await testApp.init();
});

afterAll(async () => {
  await testApp.close();
});

export { testApp };
