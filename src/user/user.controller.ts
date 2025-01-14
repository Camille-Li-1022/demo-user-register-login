import { Controller, Post, Get, Body, UseGuards, Headers } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post('register')
    async register(@Body() userData: { email: string; password: string }) {
        return this.userService.register(userData);
    }

    @Post('login')
    async login(@Body() userData: { email: string; password: string }) {
        return this.userService.login(userData);
    }


    @Get('validate')
    @UseGuards(AuthGuard)
    async validateToken(@Headers('authorization') auth: string) {
        const token = auth.split(' ')[1];
        const isValid = await this.userService.validateToken(token);
        return { isValid };
    }

    @Post('logout')
    @UseGuards(AuthGuard)  // 确保 JWT 验证
    async logout(@Headers('authorization') auth: string) {
        const token = auth.split(' ')[1];  // 提取 token
        const email = await this.userService.extractEmailFromToken(token);  // 从 JWT 中提取 email
    
        if (email) {
            // 删除与 email 相关的缓存
            await this.userService.logout(email);
            return { message: 'Logged out successfully' };
        } else {
            throw new Error('Invalid token');
        }
    }
}