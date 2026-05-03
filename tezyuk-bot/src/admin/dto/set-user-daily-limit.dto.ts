import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class SetUserDailyLimitDto {
  @ApiPropertyOptional({
    nullable: true,
    minimum: 1,
    maximum: 100,
    description: 'Foydalanuvchi kunlik limiti. null = global default ishlatiladi',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit!: number | null;
}
