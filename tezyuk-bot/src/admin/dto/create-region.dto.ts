import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateRegionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  key!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  nameUz!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  topicId!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
