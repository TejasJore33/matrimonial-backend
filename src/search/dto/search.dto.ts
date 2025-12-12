import { IsOptional, IsEnum, IsInt, IsBoolean, IsString, Min, Max, IsArray } from 'class-validator';

export class SearchFiltersDto {
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender?: string;

  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(100)
  minAge?: number;

  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(100)
  maxAge?: number;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(250)
  minHeight?: number;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(250)
  maxHeight?: number;

  @IsOptional()
  @IsString()
  religion?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  religions?: string[];

  @IsOptional()
  @IsString()
  caste?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  castes?: string[];

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cities?: string[];

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  states?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  countries?: string[];

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  educations?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  occupations?: string[];

  @IsOptional()
  @IsInt()
  minIncome?: number;

  @IsOptional()
  @IsInt()
  maxIncome?: number;

  @IsOptional()
  @IsBoolean()
  manglik?: boolean;

  @IsOptional()
  @IsBoolean()
  withPhoto?: boolean;

  @IsOptional()
  @IsBoolean()
  verifiedOnly?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  motherTongue?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(['NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'AWAITING_DIVORCE'], { each: true })
  maritalStatuses?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(['NUCLEAR', 'JOINT', 'EXTENDED'], { each: true })
  familyTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(['VEGETARIAN', 'NON_VEGETARIAN', 'EGGETARIAN', 'VEGAN', 'JAIN'], { each: true })
  diets?: string[];

  @IsOptional()
  @IsBoolean()
  workingAbroad?: boolean;

  @IsOptional()
  @IsBoolean()
  nri?: boolean;

  @IsOptional()
  @IsBoolean()
  smoking?: boolean;

  @IsOptional()
  @IsBoolean()
  drinking?: boolean;
}

