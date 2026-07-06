import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'The ID of the user' })
  id!: number;

  @ApiProperty({ description: 'The name of the user' })
  name!: string;

  @ApiProperty({ description: 'The email of the user' })
  email!: string;

  @ApiProperty({
    description: 'The telephone number of the user',
    nullable: true,
  })
  tel!: string | null;

  @ApiProperty({ description: 'The image URL of the user', nullable: true })
  image!: string | null;

  @ApiProperty({ description: 'The role of the user', enum: Role })
  role!: Role;

  @ApiProperty({ description: 'The date when the user was created' })
  createdAt!: Date;

  @ApiProperty({ description: 'The date when the user was last updated' })
  updatedAt!: Date;

  @ApiProperty({
    description: 'The date when the user was deleted',
    nullable: true,
  })
  deletedAt!: Date | null;
}
