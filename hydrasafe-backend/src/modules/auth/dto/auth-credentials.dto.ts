/**
 * DTO for authentication credentials
 */

import { IsString, IsNotEmpty } from 'class-validator';

export class AuthCredentialsDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
