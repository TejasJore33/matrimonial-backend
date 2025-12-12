import { LocalizationService } from './localization.service';
export declare class LocalizationController {
    private localizationService;
    constructor(localizationService: LocalizationService);
    getSupportedLanguages(): Promise<{
        code: string;
        name: string;
        nativeName: string;
    }[]>;
    getTranslations(lang?: string): Promise<{
        [key: string]: string;
    }>;
    translate(key: string, lang?: string): Promise<{
        key: string;
        translation: string;
    }>;
    convertCurrency(amount: string, from: string, to: string): Promise<{
        amount: number;
        from: string;
        to: string;
        converted: number;
    }>;
    getUserLanguage(user: any): Promise<{
        language: string;
    }>;
    setUserLanguage(user: any, body: {
        language: string;
    }): Promise<{
        message: string;
    }>;
}
