export declare class RegisterDto {
    email?: string;
    mobile?: string;
    password: string;
    role?: string;
    gender?: string;
    religion?: string;
    motherTongue?: string;
    dateOfBirth?: string;
}
export declare class LoginDto {
    email?: string;
    mobile?: string;
    password: string;
}
export declare class VerifyOtpDto {
    identifier: string;
    code: string;
    type: 'EMAIL' | 'MOBILE';
}
export declare class ResetPasswordDto {
    identifier: string;
    code: string;
    newPassword: string;
}
