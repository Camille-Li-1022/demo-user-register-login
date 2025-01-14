import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly configService: ConfigService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = request.headers.authorization?.split(' ')[1];

        if (!token) {
            throw new UnauthorizedException('未提供认证令牌');
        }

        try {
            const decoded = jwt.verify(token, this.configService.get<string>('JWT_SECRET'));

            request.user = decoded;

            return true;
        } catch (error) {
            throw new UnauthorizedException('无效的认证令牌');
        }
    }
}