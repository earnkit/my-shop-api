import { PartialType, PickType } from '@nestjs/swagger';
import { RegisterDto } from './register.dto';

export class UpdateProfileDto extends PartialType(
  PickType(RegisterDto, ['name', 'email', 'tel', 'image'] as const),
) {}
