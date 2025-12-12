export declare class CreateProfileDto {
    firstName?: string;
    lastName?: string;
    gender?: string;
    dateOfBirth?: string | Date;
    height?: number;
    maritalStatus?: string;
    religion?: string;
    caste?: string;
    motherTongue?: string;
    manglik?: boolean;
    gothra?: string;
    country?: string;
    state?: string;
    city?: string;
    citizenship?: string;
    education?: string;
    college?: string;
    occupation?: string;
    income?: number;
    fatherOccupation?: string;
    motherOccupation?: string;
    siblings?: number;
    familyType?: string;
    diet?: string;
    smoking?: boolean;
    drinking?: boolean;
    hobbies?: string;
    partnerPreferences?: any;
    privacySettings?: any;
    aboutMe?: string;
    highlights?: any;
    latitude?: number;
    longitude?: number;
    contactPrivacyLevel?: string;
    photoPrivacyLevel?: string;
    isAnonymousViewing?: boolean;
}
export declare class UpdateProfileDto extends CreateProfileDto {
}
