"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FamilyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let FamilyService = class FamilyService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async addFamilyMember(userId, data) {
        const validRelations = ['FATHER', 'MOTHER', 'SIBLING', 'GUARDIAN', 'OTHER'];
        if (!validRelations.includes(data.relation)) {
            throw new common_1.BadRequestException('Invalid relation');
        }
        if (data.email) {
            const existing = await this.prisma.familyMember.findUnique({
                where: { email: data.email },
            });
            if (existing) {
                throw new common_1.BadRequestException('Email already registered');
            }
        }
        if (data.mobile) {
            const existing = await this.prisma.familyMember.findUnique({
                where: { mobile: data.mobile },
            });
            if (existing) {
                throw new common_1.BadRequestException('Mobile already registered');
            }
        }
        let hashedPassword;
        if (data.password) {
            hashedPassword = await bcrypt.hash(data.password, 10);
        }
        return this.prisma.familyMember.create({
            data: {
                userId,
                name: data.name,
                relation: data.relation,
                email: data.email,
                mobile: data.mobile,
                password: hashedPassword,
                canViewMatches: data.canViewMatches ?? true,
                canSendInterests: data.canSendInterests ?? true,
                canChat: data.canChat ?? false,
            },
        });
    }
    async getFamilyMembers(userId) {
        return this.prisma.familyMember.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async updateFamilyMember(userId, memberId, data) {
        const member = await this.prisma.familyMember.findFirst({
            where: {
                id: memberId,
                userId,
            },
        });
        if (!member) {
            throw new common_1.NotFoundException('Family member not found');
        }
        return this.prisma.familyMember.update({
            where: { id: memberId },
            data,
        });
    }
    async deleteFamilyMember(userId, memberId) {
        const member = await this.prisma.familyMember.findFirst({
            where: {
                id: memberId,
                userId,
            },
        });
        if (!member) {
            throw new common_1.NotFoundException('Family member not found');
        }
        await this.prisma.familyMember.delete({
            where: { id: memberId },
        });
        return { message: 'Family member deleted' };
    }
    async loginFamilyMember(emailOrMobile, password) {
        const member = await this.prisma.familyMember.findFirst({
            where: {
                OR: [
                    { email: emailOrMobile },
                    { mobile: emailOrMobile },
                ],
            },
            include: {
                user: {
                    include: {
                        profile: true,
                    },
                },
            },
        });
        if (!member) {
            throw new common_1.NotFoundException('Family member not found');
        }
        if (!member.password) {
            throw new common_1.BadRequestException('Password not set for this family member');
        }
        const isValid = await bcrypt.compare(password, member.password);
        if (!isValid) {
            throw new common_1.BadRequestException('Invalid password');
        }
        return {
            member,
            user: member.user,
        };
    }
};
exports.FamilyService = FamilyService;
exports.FamilyService = FamilyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FamilyService);
//# sourceMappingURL=family.service.js.map