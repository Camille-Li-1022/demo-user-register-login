import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { RedisModule } from './redis/redis.module';
import { User } from './user/user.entity';
import { RedisService } from './redis/redis.service';
import jwtConfig from './config/jwt.config';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true, // 设置为全局模块
            envFilePath: '.env',
            load: [jwtConfig],
        }),
        // TypeORM 配置
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'mysql',
                host: configService.get('DB_HOST', 'localhost'),
                port: configService.get('DB_PORT', 3306),
                username: configService.get('DB_USERNAME', 'root'),
                password: configService.get('DB_PASSWORD', 'root'),
                database: configService.get('DB_DATABASE', 'nest_demo'),
                entities: [User],
                synchronize: configService.get('DB_SYNCHRONIZE', true), // 注意：生产环境应设置为 false
                logging: configService.get('DB_LOGGING', true),
                autoLoadEntities: true,
            }),
            inject: [ConfigService],
        }),
        UserModule,
        RedisModule,
    ],
    providers: [RedisService],
})
export class AppModule {}