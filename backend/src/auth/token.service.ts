import { InvalidTokenException } from '@/common/exceptions';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { AuthToken } from './entities/authToken.entity';
import { User } from './entities/user.entity';
import { AuthTokenType } from './types';
import { UserService } from './user.service';
import { randomBytes } from 'crypto';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    @InjectRepository(AuthToken)
    private readonly authTokenRepository: Repository<AuthToken>,
  ) {}

  async signAuthTokens(user: User, rememberME: boolean) {
    const tokens = {
      accessToken: '',
      refreshToken: '',
    };

    tokens.accessToken = this.signAccessToken(user);
    if (rememberME) {
      tokens.refreshToken = await this.signRefreshToken(user);
    }

    return tokens;
  }

  signAccessToken(user: User) {
    return this.jwtService.sign(
      { email: user.email, id: user.id },
      { expiresIn: `${this.configService.get('ACCESS_TOKEN_EXPIRATION')}s` },
    );
  }

  async signRefreshToken(user: User) {
    const token = this.jwtService.sign(
      { id: user.id },
      { expiresIn: `${this.configService.get('REFRESH_TOKEN_EXPIRATION')}s` },
    );

    await this.authTokenRepository.save(
      this.authTokenRepository.create({
        identifier: user.id,
        token,
        type: AuthTokenType.refreshToken,
        TTL: new Date(
          Date.now() +
            this.configService.get('REFRESH_TOKEN_EXPIRATION') * 1000,
        ),
      }),
    );

    return token;
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken);

      const storedToken = await this.authTokenRepository.findOne({
        where: {
          identifier: decoded.ID,
          token: refreshToken,
          type: AuthTokenType.refreshToken,
        },
      });

      if (!storedToken) {
        throw new InvalidTokenException('Invalid refresh token');
      }

      const user = await this.userService.getById(decoded.ID);

      return {
        accessToken: this.signAccessToken(user),
        refreshToken: await this.signRefreshToken(user),
      };
    } catch {
      throw new InvalidTokenException('Failed to refresh token');
    }
  }

  async signResetPasswordToken(email: string) {
    const token = randomBytes(32).toString('hex').slice(0, 4);

    await this.authTokenRepository.save(
      this.authTokenRepository.create({
        identifier: email,
        token,
        type: AuthTokenType.resetPassword,
        TTL: new Date(
          Date.now() +
            this.configService.get('RESET_PASSWORD_TOKEN_EXPIRATION') * 1000,
        ),
      }),
    );

    return token;
  }

  async checkResetPasswordToken(code: string) {
    const storedToken = await this.authTokenRepository.findOne({
      where: {
        token: code,
        type: AuthTokenType.resetPassword,
        TTL: MoreThan(new Date()),
      },
    });
    if (!storedToken) {
      throw new InvalidTokenException('Token not found/expired');
    }

    return storedToken.identifier;
  }

  async verifyResetPasswordToken(token: string) {
    const storedToken = await this.authTokenRepository.findOne({
      where: {
        token,
        type: AuthTokenType.resetPassword,
        TTL: MoreThan(new Date()),
      },
    });
    if (!storedToken) {
      throw new InvalidTokenException('Token not found/expired');
    }

    await this.authTokenRepository.delete({
      type: AuthTokenType.resetPassword,
      identifier: storedToken.identifier,
      token,
    });

    return storedToken.identifier;
  }

  async signEmailVerificationToken(email: string) {
    const token = randomBytes(32).toString('hex').slice(0, 4);

    await this.authTokenRepository.save(
      this.authTokenRepository.create({
        identifier: email,
        token,
        type: AuthTokenType.emailVerification,
        TTL: new Date(
          Date.now() +
            this.configService.get('EMAIL_VERIFICATION_TOKEN_EXPIRATION') *
              1000,
        ),
      }),
    );

    return token;
  }

  async verifyEmailVerificationToken(code: string): Promise<string> {
    const storedToken = await this.authTokenRepository.findOne({
      where: {
        token: code,
        type: AuthTokenType.emailVerification,
        TTL: MoreThan(new Date()),
      },
    });

    if (!storedToken) {
      throw new InvalidTokenException('Token not found/expired');
    }

    await this.authTokenRepository.remove(storedToken);

    return storedToken.identifier;
  }
}
