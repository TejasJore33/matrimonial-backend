import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class HoroscopeService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async uploadHoroscope(userId: string, file: Express.Multer.File, data: {
    birthTime?: string;
    birthPlace?: string;
    rashi?: string;
    nakshatra?: string;
    mangalDosha?: boolean;
  }) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Upload horoscope file
    const uploadResult = await this.uploadService.uploadDocument(file, 'horoscopes') as { url: string; publicId: string };

    // Check if horoscope already exists
    const existing = await this.prisma.horoscope.findUnique({
      where: { userId },
    });

    if (existing) {
      // Update existing
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

    // Create new
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

  async getHoroscope(userId: string) {
    const horoscope = await this.prisma.horoscope.findUnique({
      where: { userId },
    });

    if (!horoscope) {
      throw new NotFoundException('Horoscope not found');
    }

    return horoscope;
  }

  async matchHoroscopes(user1Id: string, user2Id: string) {
    const horoscope1 = await this.prisma.horoscope.findUnique({
      where: { userId: user1Id },
    });

    const horoscope2 = await this.prisma.horoscope.findUnique({
      where: { userId: user2Id },
    });

    if (!horoscope1 || !horoscope2) {
      throw new BadRequestException('Both users must have uploaded horoscopes');
    }

    // Check if match already exists
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

    // Calculate compatibility (simplified algorithm)
    const matchDetails = this.calculateCompatibility(horoscope1, horoscope2);

    // Create match record
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

  async getHoroscopeMatch(user1Id: string, user2Id: string) {
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
      throw new NotFoundException('Horoscope match not found');
    }

    return match;
  }

  private calculateCompatibility(horoscope1: any, horoscope2: any) {
    // Simplified compatibility calculation
    // In production, this would use proper astrological calculations

    let ashtakootScore = 0;
    const maxAshtakoot = 36;

    // Basic compatibility checks
    if (horoscope1.rashi && horoscope2.rashi) {
      // Simple rashi compatibility (simplified)
      const compatibleRashis: { [key: string]: string[] } = {
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
      } else {
        ashtakootScore += 4;
      }
    }

    // Nakshatra compatibility (simplified)
    if (horoscope1.nakshatra && horoscope2.nakshatra) {
      if (horoscope1.nakshatra === horoscope2.nakshatra) {
        ashtakootScore += 4;
      } else {
        ashtakootScore += 2;
      }
    }

    // Mangal Dosha check
    const mangalDoshaMatch = !(horoscope1.mangalDosha && horoscope2.mangalDosha);

    // Calculate overall score (0-100)
    const ashtakootPercentage = (ashtakootScore / maxAshtakoot) * 100;
    let overallScore = ashtakootPercentage;

    // Adjust for Mangal Dosha
    if (!mangalDoshaMatch) {
      overallScore -= 10;
    }

    // Ensure score is between 0-100
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
}

