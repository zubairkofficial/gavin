import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class googleUserDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'John',
  })
  token: string;

}
