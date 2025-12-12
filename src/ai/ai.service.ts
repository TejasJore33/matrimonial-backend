import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async analyzePhotoQuality(photoUrl: string): Promise<{
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    // In production, this would use ML models (TensorFlow, PyTorch, etc.)
    // For now, basic validation based on common photo quality metrics

    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Basic checks (in production, use image processing libraries)
    // - Check image dimensions
    // - Check brightness/contrast
    // - Check if face is detected
    // - Check if image is clear (not blurry)
    // - Check if image is appropriate

    // Simulated analysis
    const hasFace = true; // Would use face detection API
    const isClear = true; // Would use blur detection
    const isAppropriate = true; // Would use content moderation API

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

  async autoTagProfile(profileId: string): Promise<string[]> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        photos: true,
      },
    });

    if (!profile) {
      return [];
    }

    const tags: string[] = [];

    // Auto-generate tags based on profile data
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

    // In production, use NLP to extract more meaningful tags
    return tags;
  }

  async detectFraudulentProfile(userId: string): Promise<{
    isFraudulent: boolean;
    riskScore: number;
    reasons: string[];
  }> {
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

    const reasons: string[] = [];
    let riskScore = 0;

    // Check 1: Profile completeness
    if (user.profile.completenessScore < 30) {
      riskScore += 20;
      reasons.push('Very low profile completeness');
    }

    // Check 2: No photos
    if (!user.profile.photos || user.profile.photos.length === 0) {
      riskScore += 15;
      reasons.push('No photos uploaded');
    }

    // Check 3: Unverified profile
    if (!user.profile.isVerified && !user.isEmailVerified && !user.isMobileVerified) {
      riskScore += 25;
      reasons.push('Unverified profile');
    }

    // Check 4: Suspicious activity patterns
    const interestsSent = user.interests?.length || 0;
    const interestsReceived = user.receivedInterests?.length || 0;

    if (interestsSent > 100 && interestsReceived < 5) {
      riskScore += 30;
      reasons.push('Suspicious interest pattern');
    }

    // Check 5: Recent account creation with high activity
    const accountAge = Date.now() - new Date(user.createdAt).getTime();
    const daysOld = accountAge / (1000 * 60 * 60 * 24);

    if (daysOld < 1 && interestsSent > 20) {
      riskScore += 25;
      reasons.push('Suspicious activity for new account');
    }

    // Check 6: Payment patterns (fraudulent payment attempts)
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

  async getProfileRecommendations(userId: string): Promise<{
    recommendations: string[];
    priority: 'high' | 'medium' | 'low';
  }> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return {
        recommendations: ['Create your profile to get started'],
        priority: 'high',
      };
    }

    const recommendations: string[] = [];
    let priority: 'high' | 'medium' | 'low' = 'low';

    // Profile completeness
    if (profile.completenessScore < 50) {
      recommendations.push('Complete your profile to increase visibility');
      priority = 'high';
    } else if (profile.completenessScore < 80) {
      recommendations.push('Add more details to your profile');
      priority = 'medium';
    }

    // Verification
    if (!profile.isVerified) {
      recommendations.push('Verify your profile to build trust');
      priority = 'high';
    }

    // Photos
    const photoCount = await this.prisma.photo.count({
      where: {
        profileId: profile.id,
        isApproved: true,
      },
    });

    if (photoCount === 0) {
      recommendations.push('Upload at least one photo');
      priority = 'high';
    } else if (photoCount < 3) {
      recommendations.push('Add more photos to your profile');
      priority = 'medium';
    }

    // Activity
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
}

