import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RequestResetPasswordInput {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class ResetPasswordInput {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  code: string;
}

export class ValidateEmailInput {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class EmailVerificationInput {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class VerifyEmailInput {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  code: string;
}

export class CheckResetCodeInput {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  code: string;
}

