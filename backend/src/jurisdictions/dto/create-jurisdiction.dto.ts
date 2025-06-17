import { IsNotEmpty, IsString } from 'class-validator';

export class CreateJurisdictionDto {
    @IsNotEmpty()
    @IsString()
    jurisdiction: string;
}
