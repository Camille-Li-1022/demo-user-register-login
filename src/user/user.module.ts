import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { RedisService } from 'src/redis/redis.service';
import { RedisModule } from 'src/redis/redis.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),        // 引入 UserRepository
        RedisModule
    ],  
    controllers: [UserController],
    providers: [UserService]
})
export class UserModule {}


