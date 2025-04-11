import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';

export const createTestingModule = async (): Promise<INestApplication> => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();
  return app;
};

export const createModuleFixture = async (): Promise<TestingModule> => {
  return await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
};
