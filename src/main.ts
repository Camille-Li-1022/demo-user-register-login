import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    
    // 添加全局验证管道
    app.useGlobalPipes(new ValidationPipe());
    
    // 配置全局路由前缀
    app.setGlobalPrefix('api');
    
    // 允许跨域
    app.enableCors();
    
    // 启动服务
    await app.listen(3005);
    
    console.log(`用户服务已启动，运行在: ${await app.getUrl()}`);
}
bootstrap();