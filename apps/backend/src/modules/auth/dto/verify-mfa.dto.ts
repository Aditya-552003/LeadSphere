import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyMfaDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'MFA token must be exactly 6 digits' })
  totp_code: string;
}
