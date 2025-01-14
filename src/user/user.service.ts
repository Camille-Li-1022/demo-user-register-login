import { Injectable, ConflictException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './user.entity';
import { RedisService } from '../redis/redis.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly redisService: RedisService,
        private readonly configService: ConfigService,
    ) {}

    async register(userData: { email: string; password: string }): Promise<{ message: string }> {
        try {
            // 检查邮箱是否已存在
            const existingUser = await this.userRepository.findOne({ 
                where: { email: userData.email } 
            });

            if (existingUser) {
                throw new ConflictException('邮箱已被注册');
            }

            // 密码加密
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            // 创建新用户
            const user = this.userRepository.create({
                email: userData.email,
                password: hashedPassword,
            });

            await this.userRepository.save(user);
            return { message: '注册成功' };
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            if (error.code == 'ER_DUP_ENTRY') {
                throw new ConflictException('邮箱已被注册');
            }
            throw new InternalServerErrorException('注册失败，请稍后重试');
        }
    }

    async login(userData: { email: string; password: string }): Promise<{ token: string }> {
        try {
            console.log("debug login: ", userData)
            // 1. 先尝试从 Redis 获取用户信息
            const cachedUser = await this.redisService.get(`user:${userData.email}`);
            let user: User;
            if (cachedUser) {
                user = JSON.parse(cachedUser);
            } else {
                // 2. 如果 Redis 中没有用户信息，则从数据库中获取
                user = await this.userRepository.findOne({ 
                    where: { email: userData.email } 
                });

                if (user) {
                    const userCache = { ...user };
                    // delete userCache.password;
                    // 3. 将用户信息缓存到 Redis 中，设置 24 小时过期
                    await this.redisService.set(`user:${user.email}`, JSON.stringify(userCache), 24 * 60 * 60);
                }
            }

            if (!user) {
                throw new UnauthorizedException('用户不存在');
            }
            console.log("========== get user: ", user)

            // 验证密码
            const isPasswordValid = await bcrypt.compare(userData.password, user.password);
            if (!isPasswordValid) {
                throw new UnauthorizedException('密码错误');
            }


            // 生成 JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                this.configService.get<string>('JWT_SECRET'),  // 从环境变量获取密钥
                { expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') }  // 从环境变量获取过期时间
            );
            // 将 token 存入 Redis，设置 24 小时过期
            const cache_key = `user_token:${user.id}`
            await this.redisService.set(cache_key, token, 24 * 60 * 60);
            // console.log("==== cache done")
            // const cachedToken = await this.redisService.get(cache_key);
            // console.log("============ get cache token: ", { cache_key, cachedToken })

            return { token };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            console.log(error)
            throw new InternalServerErrorException('登录失败，请稍后重试');
        }
    }

    async validateToken(token: string): Promise<boolean> {
        try {
            const decoded = jwt.verify(token, this.configService.get<string>('JWT_SECRET')) as { userId: number };
            const cache_key = `user_token:${decoded.userId}`
            const cachedToken = await this.redisService.get(cache_key);
            // console.log("============ get cache token: ", { cache_key, cachedToken })

            return cachedToken === token;
        } catch {
            return false;
        }
    }

      // 提取 email 地址
    async extractEmailFromToken(token: string): Promise<string | null> {
        try {
            const decoded = jwt.verify(token, this.configService.get('JWT_SECRET'));
            return decoded.email || null;  // 假设 JWT 中包含 email
        } catch (error) {
            return null;
        }
    }

    // 注销逻辑
    async logout(email: string) {
        // 假设 Redis 中的缓存键是 `user:{email}`
        const redisKey = `user:${email}`;

        // 删除 Redis 中的缓存
        await this.redisService.del(redisKey);
    }
}