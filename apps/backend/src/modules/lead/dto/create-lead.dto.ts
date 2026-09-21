import { IsNotEmpty, IsOptional, IsString, IsEmail, IsObject, IsUUID } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty({ message: 'Lead full name is required' })
  full_name: string;

  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;

  @IsString()
  @IsOptional()
  company_name?: string;

  @IsString()
  @IsOptional()
  designation?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  industry?: string;

  @IsEmail({}, { message: 'Email must be valid' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  source?: string;

  @IsUUID('4')
  @IsOptional()
  status_stage_id?: string;

  @IsUUID('4')
  @IsOptional()
  owner_membership_id?: string;

  @IsObject()
  @IsOptional()
  custom?: Record<string, any>;
}
