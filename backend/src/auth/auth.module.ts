import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthToken } from './entities/authToken.entity';
import { User } from './entities/user.entity';
import { TokenService } from './token.service';
import { UserService } from './user.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'defaultSecret',
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, AuthToken]),
  ],  controllers: [AuthController],
  providers: [AuthService, UserService, TokenService],
  exports: [TokenService, JwtModule, AuthService],
})
export class AuthModule {}
