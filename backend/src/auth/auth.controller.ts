import { JWTPayload } from '@/common/types';
import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JWTUser } from './decorators/jwtUser.decorator';
import { Public } from './decorators/public.decorator';
import {
  CheckResetCodeInput,
  EmailVerificationInput,
  RequestResetPasswordInput,
  ResetPasswordInput,
  ValidateEmailInput,
  VerifyEmailInput,
} from './dto/auth.dto';
import { LoginDTO } from './dto/login.dto';
import { RegisterDTO } from './dto/register.dto';
import { UpdateUserDTO } from './dto/update.dto';
import { UserService } from './user.service';
import { googleUserDTO } from './dto/google-user.dto';
import { TokenService } from './token.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}

  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns JWT token',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: 'eyJhbGciOi...' },
      },
    },
  })
  @HttpCode(200)
  @Public()
  @Post('/login')
  login(@Body() loginDTO: LoginDTO) {
    return this.authService.login(loginDTO);
  }

  @ApiOperation({ summary: 'Google User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns JWT token',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: 'eyJhbGciOi...' },
      },
    },
  })
  @HttpCode(200)
  @Public()
  @Post('/login-google')
  loginWithGoogle(@Body() googleUserDTO: googleUserDTO) {
    return this.authService.loginGoogleUser(googleUserDTO);
  }

  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({
    status: 201,
    description: 'Registration successful, email verification sent',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Registration successful. Please, check your email inbox for email verification.' },
      },
    },
  })
  @Public()
  @Post('/register')
  register(@Body() registerDTO: RegisterDTO) {
    return this.authService.register(registerDTO);
  }

  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Check your mailbox' },
      },
    },
  })
  @Public()
  @Get('request-reset-password')
  async requestResetPassword(@Query() input: RequestResetPasswordInput) {
    await this.authService.requestResetPassword(input);
    return { message: 'Check your mailbox' };
  }

  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password reset successfully' },
      },
    },
  })
  @Public()
  @Post('check-reset-code')
  async checkResetCode(@Body() input: CheckResetCodeInput) {
    await this.tokenService.checkResetPasswordToken(input.code);
    return { message: 'Code is valid' };
  }

  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password reset successfully' },
      },
    },
  })
  @Public()
  @Post('reset-password')
  async resetPassword(@Body() input: ResetPasswordInput) {
    await this.authService.resetPassword(input);
    return { message: 'Password reset successfully' };
  }

  @ApiOperation({ summary: 'Validate email token' })
  @ApiResponse({
    status: 200,
    description: 'Email validation token status',
    schema: {
      type: 'object',
      properties: {
        exist: { type: 'boolean' },
      },
    },
  })
  @Public()
  @Get('validate-email')
  async validateEmail(@Query() input: ValidateEmailInput) {
    return this.authService.validateEmail(input);
  }

  @ApiOperation({ summary: 'Verify email' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Congratulation, your email verified successfully' },
      },
    },
  })
  @Public()
  @Get('verify-email')
  async verifyEmail(@Query() input: VerifyEmailInput) {
    return this.authService.verifyEmail(input);
  }

  @ApiOperation({ summary: 'Send email verification link' })
  @ApiResponse({
    status: 200,
    description: 'Email verification link sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Check your mailbox to verify email' },
      },
    },
  })
  @Public()
  @Get('send-email-verification')
  async sendEmailVerification(@Query() input: EmailVerificationInput) {
    await this.authService.sendEmailVerification(input);
    return { message: 'Check your mailbox to verify email' };
  }

  @ApiOperation({ summary: 'Update user information' })
  @ApiResponse({
    status: 200,
    description: 'User information updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Updated Successfully' },
      },
    },
  })
  @ApiBearerAuth()
  @Post('/user/update')
  async updateUser(
    @Body() input: UpdateUserDTO,
    @JWTUser() userInfo: JWTPayload,
  ) {
    await this.userService.updateUserByFilters({ id: userInfo.id }, input);

    return { message: 'Updated Successfully' };
  }

}
