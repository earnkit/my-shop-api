import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'The current password of the user' })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({ description: 'The new password of the user' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword!: string;
}
