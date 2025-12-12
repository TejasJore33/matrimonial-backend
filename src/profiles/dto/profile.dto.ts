import { IsString, IsOptional, IsEnum, IsInt, IsBoolean, IsDateString, IsObject, Min, Max } from 'class-validator';

export class CreateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string | Date;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(250)
  height?: number;

  @IsOptional()
  @IsEnum(['NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'AWAITING_DIVORCE'])
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  religion?: string;

  @IsOptional()
  @IsString()
  caste?: string;

  @IsOptional()
  @IsString()
  motherTongue?: string;

  @IsOptional()
  @IsBoolean()
  manglik?: boolean;

  @IsOptional()
  @IsString()
  gothra?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  citizenship?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsString()
  college?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsInt()
  income?: number;

  @IsOptional()
  @IsString()
  fatherOccupation?: string;

  @IsOptional()
  @IsString()
  motherOccupation?: string;

  @IsOptional()
  @IsInt()
  siblings?: number;

  @IsOptional()
  @IsEnum(['NUCLEAR', 'JOINT', 'EXTENDED'])
  familyType?: string;

  @IsOptional()
  @IsEnum(['VEGETARIAN', 'NON_VEGETARIAN', 'EGGETARIAN', 'VEGAN', 'JAIN'])
  diet?: string;

  @IsOptional()
  @IsBoolean()
  smoking?: boolean;

  @IsOptional()
  @IsBoolean()
  drinking?: boolean;

  @IsOptional()
  @IsString()
  hobbies?: string;

  @IsOptional()
  @IsObject()
  partnerPreferences?: any;

  @IsOptional()
  @IsObject()
  privacySettings?: any;

  @IsOptional()
  @IsString()
  aboutMe?: string;

  @IsOptional()
  @IsObject()
  highlights?: any;

  @IsOptional()
  latitude?: number;

  @IsOptional()
  longitude?: number;

  @IsOptional()
  @IsString()
  contactPrivacyLevel?: string;

  @IsOptional()
  @IsString()
  photoPrivacyLevel?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymousViewing?: boolean;
}

export class UpdateProfileDto extends CreateProfileDto {}

