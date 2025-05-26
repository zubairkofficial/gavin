import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { RegisterDTO } from './register.dto';

export class InviteUserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'test123',
  })
  email: string;
}

export class InviteUserRegistrationDto extends RegisterDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'test123',
  })
  inviteToken: string;
}
