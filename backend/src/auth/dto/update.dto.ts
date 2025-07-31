
import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateUserDTO {
  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'John Doe',
  })
  fullName: string;


  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'solo-lawyer',
  })
  userType: string;


}
