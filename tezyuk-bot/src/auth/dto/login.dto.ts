import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  username!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password!: string;
}
