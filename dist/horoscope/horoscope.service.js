"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoroscopeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const upload_service_1 = require("../upload/upload.service");
let HoroscopeService = class HoroscopeService {
    constructor(prisma, uploadService) {
        this.prisma = prisma;
        this.uploadService = uploadService;
    }
    async uploadHoroscope(userId, file, data) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        const uploadResult = await this.uploadService.uploadDocument(file, 'horoscopes');
        const existing = await this.prisma.horoscope.findUnique({
            where: { userId },
        });
        if (existing) {
            return this.prisma.horoscope.update({
                where: { userId },
                data: {
                    horoscopeUrl: uploadResult.url,
                    birthTime: data.birthTime,
                    birthPlace: data.birthPlace,
                    rashi: data.rashi,
                    nakshatra: data.nakshatra,
                    mangalDosha: data.mangalDosha,
                },
            });
        }
        return this.prisma.horoscope.create({
            data: {
                userId,
                profileId: profile.id,
                horoscopeUrl: uploadResult.url,
                birthTime: data.birthTime,
                birthPlace: data.birthPlace,
                rashi: data.rashi,
                nakshatra: data.nakshatra,
                mangalDosha: data.mangalDosha || false,
            },
        });
    }
    async getHoroscope(userId) {
        const horoscope = await this.prisma.horoscope.findUnique({
            where: { userId },
        });
        if (!horoscope) {
            throw new common_1.NotFoundException('Horoscope not found');
        }
        return horoscope;
    }
    async matchHoroscopes(user1Id, user2Id) {
        const horoscope1 = await this.prisma.horoscope.findUnique({
            where: { userId: user1Id },
        });
        const horoscope2 = await this.prisma.horoscope.findUnique({
            where: { userId: user2Id },
        });
        if (!horoscope1 || !horoscope2) {
            throw new common_1.BadRequestException('Both users must have uploaded horoscopes');
        }
        const existingMatch = await this.prisma.horoscopeMatch.findFirst({
            where: {
                OR: [
                    { user1Id, user2Id },
                    { user1Id: user2Id, user2Id: user1Id },
                ],
            },
        });
        if (existingMatch) {
            return existingMatch;
        }
        const matchDetails = this.calculateCompatibility(horoscope1, horoscope2);
        return this.prisma.horoscopeMatch.create({
            data: {
                user1Id,
                user2Id,
                horoscope1Id: horoscope1.id,
                horoscope2Id: horoscope2.id,
                ashtakootScore: matchDetails.ashtakootScore,
                mangalDoshaMatch: matchDetails.mangalDoshaMatch,
                overallScore: matchDetails.overallScore,
                matchDetails: matchDetails,
            },
        });
    }
    async getHoroscopeMatch(user1Id, user2Id) {
        const match = await this.prisma.horoscopeMatch.findFirst({
            where: {
                OR: [
                    { user1Id, user2Id },
                    { user1Id: user2Id, user2Id: user1Id },
                ],
            },
            include: {
                horoscope1: true,
                horoscope2: true,
            },
        });
        if (!match) {
            throw new common_1.NotFoundException('Horoscope match not found');
        }
        return match;
    }
    calculateCompatibility(horoscope1, horoscope2) {
        let ashtakootScore = 0;
        const maxAshtakoot = 36;
        if (horoscope1.rashi && horoscope2.rashi) {
            const compatibleRashis = {
                'Aries': ['Leo', 'Sagittarius'],
                'Taurus': ['Virgo', 'Capricorn'],
                'Gemini': ['Libra', 'Aquarius'],
                'Cancer': ['Scorpio', 'Pisces'],
                'Leo': ['Aries', 'Sagittarius'],
                'Virgo': ['Taurus', 'Capricorn'],
                'Libra': ['Gemini', 'Aquarius'],
                'Scorpio': ['Cancer', 'Pisces'],
                'Sagittarius': ['Aries', 'Leo'],
                'Capricorn': ['Taurus', 'Virgo'],
                'Aquarius': ['Gemini', 'Libra'],
                'Pisces': ['Cancer', 'Scorpio'],
            };
            if (compatibleRashis[horoscope1.rashi]?.includes(horoscope2.rashi)) {
                ashtakootScore += 8;
            }
            else {
                ashtakootScore += 4;
            }
        }
        if (horoscope1.nakshatra && horoscope2.nakshatra) {
            if (horoscope1.nakshatra === horoscope2.nakshatra) {
                ashtakootScore += 4;
            }
            else {
                ashtakootScore += 2;
            }
        }
        const mangalDoshaMatch = !(horoscope1.mangalDosha && horoscope2.mangalDosha);
        const ashtakootPercentage = (ashtakootScore / maxAshtakoot) * 100;
        let overallScore = ashtakootPercentage;
        if (!mangalDoshaMatch) {
            overallScore -= 10;
        }
        overallScore = Math.max(0, Math.min(100, overallScore));
        return {
            ashtakootScore,
            maxAshtakoot,
            ashtakootPercentage: Math.round(ashtakootPercentage),
            mangalDoshaMatch,
            overallScore: Math.round(overallScore),
            compatibility: overallScore >= 70 ? 'Excellent' : overallScore >= 50 ? 'Good' : overallScore >= 30 ? 'Moderate' : 'Low',
            details: {
                rashiCompatibility: horoscope1.rashi && horoscope2.rashi ? 'Compatible' : 'Unknown',
                nakshatraCompatibility: horoscope1.nakshatra && horoscope2.nakshatra ? 'Compatible' : 'Unknown',
            },
        };
    }
};
exports.HoroscopeService = HoroscopeService;
exports.HoroscopeService = HoroscopeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        upload_service_1.UploadService])
], HoroscopeService);
//# sourceMappingURL=horoscope.service.js.map