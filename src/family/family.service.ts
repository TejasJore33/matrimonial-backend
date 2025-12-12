import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class FamilyService {
  constructor(private prisma: PrismaService) {}

  async addFamilyMember(userId: string, data: {
    name: string;
    relation: string;
    email?: string;
    mobile?: string;
    password?: string;
    canViewMatches?: boolean;
    canSendInterests?: boolean;
    canChat?: boolean;
  }) {
    // Validate relation
    const validRelations = ['FATHER', 'MOTHER', 'SIBLING', 'GUARDIAN', 'OTHER'];
    if (!validRelations.includes(data.relation)) {
      throw new BadRequestException('Invalid relation');
    }

    // Check if email/mobile already exists
    if (data.email) {
      const existing = await this.prisma.familyMember.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        throw new BadRequestException('Email already registered');
      }
    }

    if (data.mobile) {
      const existing = await this.prisma.familyMember.findUnique({
        where: { mobile: data.mobile },
      });
      if (existing) {
        throw new BadRequestException('Mobile already registered');
      }
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
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

  async getFamilyMembers(userId: string) {
    return this.prisma.familyMember.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateFamilyMember(userId: string, memberId: string, data: {
    name?: string;
    canViewMatches?: boolean;
    canSendInterests?: boolean;
    canChat?: boolean;
  }) {
    const member = await this.prisma.familyMember.findFirst({
      where: {
        id: memberId,
        userId,
      },
    });

    if (!member) {
      throw new NotFoundException('Family member not found');
    }

    return this.prisma.familyMember.update({
      where: { id: memberId },
      data,
    });
  }

  async deleteFamilyMember(userId: string, memberId: string) {
    const member = await this.prisma.familyMember.findFirst({
      where: {
        id: memberId,
        userId,
      },
    });

    if (!member) {
      throw new NotFoundException('Family member not found');
    }

    await this.prisma.familyMember.delete({
      where: { id: memberId },
    });

    return { message: 'Family member deleted' };
  }

  async loginFamilyMember(emailOrMobile: string, password: string) {
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
      throw new NotFoundException('Family member not found');
    }

    if (!member.password) {
      throw new BadRequestException('Password not set for this family member');
    }

    const isValid = await bcrypt.compare(password, member.password);
    if (!isValid) {
      throw new BadRequestException('Invalid password');
    }

    return {
      member,
      user: member.user,
    };
  }
}

