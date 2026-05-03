import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @ApiProperty({ minimum: 1, maximum: 100, description: 'Kunlik buyurtma limiti (global)' })
  @IsInt()
  @Min(1)
  @Max(100)
  dailyOrderLimit!: number;
}
