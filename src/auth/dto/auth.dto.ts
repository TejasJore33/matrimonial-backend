import { IsEmail, IsString, IsOptional, IsEnum, MinLength, ValidateIf } from 'class-validator';

export class RegisterDto {
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Mobile must be a string' })
  mobile?: string;

  @IsString({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsOptional()
  @IsEnum(['SELF_MEMBER', 'PARENT'], { message: 'Role must be either SELF_MEMBER or PARENT' })
  role?: string;

  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'], { message: 'Gender must be MALE, FEMALE, or OTHER' })
  gender?: string;

  @IsOptional()
  @IsString({ message: 'Religion must be a string' })
  religion?: string;

  @IsOptional()
  @IsString({ message: 'Mother tongue must be a string' })
  motherTongue?: string;

  @IsOptional()
  @IsString({ message: 'Date of birth must be a string' })
  dateOfBirth?: string;
}

export class LoginDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsString({ message: 'Password is required' })
  password: string;
}

export class VerifyOtpDto {
  @IsString()
  identifier: string;

  @IsString()
  code: string;

  @IsEnum(['EMAIL', 'MOBILE'])
  type: 'EMAIL' | 'MOBILE';
}

export class ResetPasswordDto {
  @IsString()
  identifier: string;

  @IsString()
  code: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

