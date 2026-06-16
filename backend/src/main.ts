import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('新生儿喂养与作息记录 API')
    .setDescription('新生儿喂养、睡眠、尿布、生长记录等后端接口文档')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addTag('认证', '微信登录、获取用户信息')
    .addTag('宝宝档案', '宝宝档案的增删改查')
    .addTag('事件记录', '喂奶/尿布/睡眠/其他事件管理')
    .addTag('生长记录', '体重身长记录与曲线')
    .addTag('用户设置', '喂奶间隔、当前宝宝等偏好设置')
    .addTag('数据同步', '本地数据批量导入/全量导出')
    .addTag('订阅消息', '微信订阅消息模板与喂奶提醒推送')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Baby Tracker API 文档',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
