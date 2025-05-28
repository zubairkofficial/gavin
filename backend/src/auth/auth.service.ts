import { generatePasswordHash } from '@/common/utils/bcrypt';
import { MailService } from '@/shared/mail.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compareSync, hashSync } from 'bcryptjs';
import { MoreThan, Repository } from 'typeorm';
import {
  EmailVerificationInput,
  RequestResetPasswordInput,
  ResetPasswordInput,
  ValidateEmailInput,
  VerifyEmailInput,
} from './dto/auth.dto';
import { LoginDTO } from './dto/login.dto';
import { RegisterDTO } from './dto/register.dto';
import { User } from './entities/user.entity';
import { TokenService } from './token.service';
import { UserService } from './user.service';
import { googleUserDTO } from './dto/google-user.dto';
import firebaseAPP from './firebase-admin';
import { AuthToken } from './entities/authToken.entity';
import { AuthTokenType } from './types';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UserService,
    private tokenService: TokenService,
    private mailService: MailService,
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(AuthToken) private authTokenRepository: Repository<AuthToken>,
  ) {}

  async login(loginDTO: LoginDTO) {
    const user = await this.usersRepository.findOne({
      where: { email: loginDTO.email }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    if (!user.isEmailVerified) {
      const storedToken = await this.authTokenRepository.findOne({
        where: {
          identifier: user.email,
          type: AuthTokenType.emailVerification,
          TTL: MoreThan(new Date()),
        },
      });
      if (!storedToken) {
        await this.sendEmailVerification({
          email: user.email
        })
      }
      throw new UnauthorizedException('Email not verified');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    const isPasswordValid = compareSync(loginDTO.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    const token = this.jwtService.sign(
      { id: user.id, role: user.role },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '7d',
      },
    );

    const {password, ...userData} = user;

    return {
      token,
      user: userData,
    };
  }

  async register(registerDTO: RegisterDTO) {
    const userExists = await this.usersRepository.findOne({
      where: { email: registerDTO.email },
    });

    if (userExists && userExists.isEmailVerified) {
      throw new ConflictException('Email already in use');
    }

    if (!userExists?.isEmailVerified) {
      await this.userService.deleteUserByFilters({ email: registerDTO.email });
    }

    registerDTO.password = hashSync(registerDTO.password, 10);

    const user = await this.usersRepository.save(registerDTO);
    const emailVerificationToken =
    await this.tokenService.signEmailVerificationToken(user.email);

    await this.mailService.sendVerificationMail({
      email: user.email,
      token: emailVerificationToken,
    });

    return {
      message: 'Registration successful. Please, check your email inbox for email verification.',
    };
  }

  async loginGoogleUser(registerDTO: googleUserDTO) {
    const { name, email, picture } = await firebaseAPP.auth().verifyIdToken(registerDTO.token);
    let user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user?.isEmailVerified) {
      await this.userService.deleteUserByFilters({ email });
    }

    if (!user) {
      const newUser = this.usersRepository.create({
        fullName: name,
        profilePicture: picture,
        email,
        isActive: true,
        isEmailVerified: true,
        isUsingGoogleAuth: true,
      })
  
      user = await this.usersRepository.save(newUser);
    }

    const token = this.jwtService.sign(
      { id: user.id, role: user.role },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '7d',
      },
    );

    const {password, ...userData} = user;

    return {
      token,
      user: userData,
    };
  }

  async requestResetPassword(input: RequestResetPasswordInput) {
    const user = await this.userService.getByEmail(input.email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const token = await this.tokenService.signResetPasswordToken(input.email);
    await this.mailService.sendResetPasswordMail({
      email: input.email,
      fullName: user.fullName,
      token,
    });
  }

  async resetPassword(input: ResetPasswordInput) {
    const email = await this.tokenService.verifyResetPasswordToken(input.code);
    const user = await this.userService.getByEmail(email);

    user.password = generatePasswordHash(input.password);
    await this.usersRepository.save(user);

    await this.mailService.sendResetPasswordSuccessMail({
      email,
      fullName: user.fullName,
    });
  }

  async validateEmail(input: ValidateEmailInput) {
    const user = await this.userService.findByEmail(input.email);

    return { exist: !!user };
  }

  async verifyEmail(input: VerifyEmailInput) {
    const identifier = await this.tokenService.verifyEmailVerificationToken(
      input.code,
    );
    await this.userService.updateUserByFilters(
      { email: identifier },
      { isEmailVerified: true, isActive: true },
    );


    const user = await this.usersRepository.findOne({
      where: {
        email: identifier
      }
    })

    if (!user) {
      throw new InternalServerErrorException("Error creating Token")
    }

    const token = this.jwtService.sign(
      { id: user.id, role: user.role },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '7d',
      },
    );

    const {password, ...userData} = user;

    return {
      token,
      user: userData,
    };
  }

  async sendEmailVerification(input: EmailVerificationInput) {
    const user = await this.userService.getByEmail(input.email);
    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const token = await this.tokenService.signEmailVerificationToken(
      user.email,
    );

    await this.mailService.sendVerificationMail({
      email: user.email,
      token,
    });
  }

}
