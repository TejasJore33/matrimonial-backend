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
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const upload_service_1 = require("../upload/upload.service");
let AiService = class AiService {
    constructor(prisma, uploadService) {
        this.prisma = prisma;
        this.uploadService = uploadService;
    }
    async analyzePhotoQuality(photoUrl) {
        const issues = [];
        const suggestions = [];
        let score = 100;
        const hasFace = true;
        const isClear = true;
        const isAppropriate = true;
        if (!hasFace) {
            issues.push('No face detected in photo');
            score -= 30;
            suggestions.push('Upload a clear photo with your face visible');
        }
        if (!isClear) {
            issues.push('Photo appears blurry');
            score -= 20;
            suggestions.push('Upload a high-resolution, clear photo');
        }
        if (!isAppropriate) {
            issues.push('Photo may contain inappropriate content');
            score -= 50;
            suggestions.push('Upload an appropriate profile photo');
        }
        return {
            score: Math.max(0, score),
            issues,
            suggestions,
        };
    }
    async autoTagProfile(profileId) {
        const profile = await this.prisma.profile.findUnique({
            where: { id: profileId },
            include: {
                photos: true,
            },
        });
        if (!profile) {
            return [];
        }
        const tags = [];
        if (profile.education) {
            tags.push(`Education: ${profile.education}`);
        }
        if (profile.occupation) {
            tags.push(`Occupation: ${profile.occupation}`);
        }
        if (profile.city && profile.state) {
            tags.push(`Location: ${profile.city}, ${profile.state}`);
        }
        if (profile.religion) {
            tags.push(`Religion: ${profile.religion}`);
        }
        if (profile.hobbies) {
            const hobbies = typeof profile.hobbies === 'string'
                ? profile.hobbies.split(',').map(h => h.trim())
                : [];
            hobbies.forEach(hobby => tags.push(`Hobby: ${hobby}`));
        }
        return tags;
    }
    async detectFraudulentProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: {
                    include: {
                        photos: true,
                    },
                },
                payments: true,
                interests: true,
                receivedInterests: true,
            },
        });
        if (!user || !user.profile) {
            return {
                isFraudulent: false,
                riskScore: 0,
                reasons: [],
            };
        }
        const reasons = [];
        let riskScore = 0;
        if (user.profile.completenessScore < 30) {
            riskScore += 20;
            reasons.push('Very low profile completeness');
        }
        if (!user.profile.photos || user.profile.photos.length === 0) {
            riskScore += 15;
            reasons.push('No photos uploaded');
        }
        if (!user.profile.isVerified && !user.isEmailVerified && !user.isMobileVerified) {
            riskScore += 25;
            reasons.push('Unverified profile');
        }
        const interestsSent = user.interests?.length || 0;
        const interestsReceived = user.receivedInterests?.length || 0;
        if (interestsSent > 100 && interestsReceived < 5) {
            riskScore += 30;
            reasons.push('Suspicious interest pattern');
        }
        const accountAge = Date.now() - new Date(user.createdAt).getTime();
        const daysOld = accountAge / (1000 * 60 * 60 * 24);
        if (daysOld < 1 && interestsSent > 20) {
            riskScore += 25;
            reasons.push('Suspicious activity for new account');
        }
        const failedPayments = user.payments?.filter(p => p.status === 'FAILED').length || 0;
        if (failedPayments > 5) {
            riskScore += 20;
            reasons.push('Multiple failed payment attempts');
        }
        return {
            isFraudulent: riskScore >= 70,
            riskScore: Math.min(100, riskScore),
            reasons,
        };
    }
    async getProfileRecommendations(userId) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });
        if (!profile) {
            return {
                recommendations: ['Create your profile to get started'],
                priority: 'high',
            };
        }
        const recommendations = [];
        let priority = 'low';
        if (profile.completenessScore < 50) {
            recommendations.push('Complete your profile to increase visibility');
            priority = 'high';
        }
        else if (profile.completenessScore < 80) {
            recommendations.push('Add more details to your profile');
            priority = 'medium';
        }
        if (!profile.isVerified) {
            recommendations.push('Verify your profile to build trust');
            priority = 'high';
        }
        const photoCount = await this.prisma.photo.count({
            where: {
                profileId: profile.id,
                isApproved: true,
            },
        });
        if (photoCount === 0) {
            recommendations.push('Upload at least one photo');
            priority = 'high';
        }
        else if (photoCount < 3) {
            recommendations.push('Add more photos to your profile');
            priority = 'medium';
        }
        const interestsSent = await this.prisma.interest.count({
            where: { fromUserId: userId },
        });
        if (interestsSent === 0) {
            recommendations.push('Start sending interests to find matches');
            priority = 'medium';
        }
        return {
            recommendations,
            priority,
        };
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        upload_service_1.UploadService])
], AiService);
//# sourceMappingURL=ai.service.js.map