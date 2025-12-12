import { PrismaService } from '../prisma/prisma.service';
export declare class LocalizationService {
    private prisma;
    private translations;
    constructor(prisma: PrismaService);
    getTranslations(language?: string): Promise<{
        [key: string]: string;
    }>;
    translate(key: string, language?: string): Promise<string>;
    getSupportedLanguages(): Promise<Array<{
        code: string;
        name: string;
        nativeName: string;
    }>>;
    convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number>;
    getUserLanguage(userId: string): Promise<string>;
    setUserLanguage(userId: string, language: string): Promise<void>;
}
