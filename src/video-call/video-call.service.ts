import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class VideoCallService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
  ) {}

  async createInstantCall(userId: string, participantId: string, audioOnly: boolean = false) {
    // Check if users have accepted interest (not necessarily mutual)
    const interest = await this.prisma.interest.findFirst({
      where: {
        OR: [
          { fromUserId: userId, toUserId: participantId, status: 'ACCEPTED' },
          { fromUserId: participantId, toUserId: userId, status: 'ACCEPTED' },
        ],
      },
    });

    if (!interest) {
      throw new BadRequestException('Video calls are only available after interest is accepted');
    }

    // Check if user already has an active call (limit to 1 active call per user)
    const activeCall = await this.prisma.videoCall.findFirst({
      where: {
        OR: [
          { callerId: userId },
          { participantId: userId },
        ],
        status: { in: ['PENDING', 'SCHEDULED', 'IN_PROGRESS'] },
      },
    });

    if (activeCall) {
      throw new BadRequestException('You already have an active call. Please end the current call before starting a new one.');
    }

    // Check if participant already has an active call
    const participantActiveCall = await this.prisma.videoCall.findFirst({
      where: {
        OR: [
          { callerId: participantId },
          { participantId: participantId },
        ],
        status: { in: ['PENDING', 'SCHEDULED', 'IN_PROGRESS'] },
      },
    });

    if (participantActiveCall) {
      throw new BadRequestException('The other user is currently on a call. Please try again later.');
    }

    // Generate WebRTC room ID
    const roomId = `room_${userId}_${participantId}_${Date.now()}`;

    const videoCall = await this.prisma.videoCall.create({
      data: {
        callerId: userId,
        participantId,
        scheduledAt: new Date(),
        status: 'PENDING',
        roomId,
        notes: audioOnly ? JSON.stringify({ audioOnly: true }) : null, // Store audioOnly in notes
      },
      include: {
        caller: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        participant: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Send notification to participant
    await this.notificationsService.create(
      participantId,
      'VIDEO_CALL',
      audioOnly ? 'Incoming Voice Call' : 'Incoming Video Call',
      `${videoCall.caller.profile?.firstName || 'Someone'} wants to ${audioOnly ? 'voice' : 'video'} call you`,
      { videoCallId: videoCall.id, roomId, callerId: userId, audioOnly },
      { sendPush: true, sendRealTime: true },
    );

    // Emit socket event to notify participant in real-time
    try {
      const participantSocketId = this.chatGateway.connectedUsers?.get(participantId);
      
      if (participantSocketId && this.chatGateway.server) {
        this.chatGateway.server.to(participantSocketId).emit('incoming-video-call', {
          callId: videoCall.id,
          roomId,
          callerId: userId,
          audioOnly: audioOnly,
        });
        console.log(`✅ Incoming call socket event sent to participant ${participantId}`);
      } else {
        console.log(`⚠️ Participant ${participantId} not connected via socket`);
      }
    } catch (error) {
      console.error('Error sending socket notification for video call:', error);
      // Don't fail the call creation if socket emission fails
    }

    return {
      ...videoCall,
      roomId,
      audioOnly: audioOnly || false,
      webrtcConfig: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    };
  }

  async scheduleCall(userId: string, data: {
    participantId: string;
    scheduledAt: Date;
    duration?: number;
    notes?: string;
  }) {
    // Check if users have accepted interest
    const interest = await this.prisma.interest.findFirst({
      where: {
        OR: [
          { fromUserId: userId, toUserId: data.participantId, status: 'ACCEPTED' },
          { fromUserId: data.participantId, toUserId: userId, status: 'ACCEPTED' },
        ],
      },
    });

    if (!interest) {
      throw new BadRequestException('Video calls are only available after interest is accepted');
    }

    // Check if scheduled time is in the future
    if (data.scheduledAt <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    const videoCall = await this.prisma.videoCall.create({
      data: {
        callerId: userId,
        participantId: data.participantId,
        scheduledAt: data.scheduledAt,
        duration: data.duration || 30, // Default 30 minutes
        notes: data.notes,
        status: 'SCHEDULED',
      },
      include: {
        caller: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        participant: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Send notification to participant
    await this.notificationsService.create(
      data.participantId,
      'VIDEO_CALL',
      'Video Call Scheduled',
      `You have a video call scheduled for ${data.scheduledAt.toLocaleString()}`,
      { videoCallId: videoCall.id, callerId: userId },
      { sendEmail: true, sendPush: true, sendRealTime: true },
    );

    return videoCall;
  }

  async startCall(userId: string, callId: string) {
    const call = await this.prisma.videoCall.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Video call not found');
    }

    if (call.callerId !== userId && call.participantId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    if (call.status !== 'SCHEDULED' && call.status !== 'PENDING') {
      throw new BadRequestException('Call cannot be started');
    }

    // Generate WebRTC room ID
    const roomId = `room_${callId}_${Date.now()}`;

    const updatedCall = await this.prisma.videoCall.update({
      where: { id: callId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        roomId,
      },
    });

    // Notify other participant
    const otherUserId = call.callerId === userId ? call.participantId : call.callerId;
    await this.notificationsService.create(
      otherUserId,
      'VIDEO_CALL',
      'Video Call Started',
      'The video call has started',
      { videoCallId: callId, roomId },
      { sendPush: true, sendRealTime: true },
    );

    return {
      ...updatedCall,
      roomId,
      webrtcConfig: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    };
  }

  async endCall(userId: string, callId: string) {
    const call = await this.prisma.videoCall.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Video call not found');
    }

    if (call.callerId !== userId && call.participantId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    // Allow ending calls in PENDING, SCHEDULED, or IN_PROGRESS status
    if (!['PENDING', 'SCHEDULED', 'IN_PROGRESS'].includes(call.status)) {
      throw new BadRequestException('Call cannot be ended');
    }

    const duration = call.startedAt
      ? Math.floor((Date.now() - new Date(call.startedAt).getTime()) / 1000 / 60)
      : 0;

    const updatedCall = await this.prisma.videoCall.update({
      where: { id: callId },
      data: {
        status: 'CANCELLED',
        endedAt: new Date(),
        cancelledAt: new Date(),
        duration,
      },
    });

    // Notify the other participant that the call ended
    const otherUserId = call.callerId === userId ? call.participantId : call.callerId;
    try {
      const otherUserSocketId = this.chatGateway.connectedUsers?.get(otherUserId);
      if (otherUserSocketId && this.chatGateway.server) {
        this.chatGateway.server.to(otherUserSocketId).emit('video-call-ended', {
          callId: callId,
        });
      }
    } catch (error) {
      console.error('Error sending call ended notification:', error);
    }

    return updatedCall;
  }

  async cancelCall(userId: string, callId: string) {
    const call = await this.prisma.videoCall.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Video call not found');
    }

    if (call.callerId !== userId) {
      throw new BadRequestException('Only the caller can cancel the call');
    }

    if (call.status === 'COMPLETED' || call.status === 'CANCELLED') {
      throw new BadRequestException('Call cannot be cancelled');
    }

    const updatedCall = await this.prisma.videoCall.update({
      where: { id: callId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    // Notify participant
    await this.notificationsService.create(
      call.participantId,
      'VIDEO_CALL',
      'Video Call Cancelled',
      'The scheduled video call has been cancelled',
      { videoCallId: callId },
      { sendEmail: true, sendPush: true, sendRealTime: true },
    );

    return updatedCall;
  }

  async getCalls(userId: string, filters?: { status?: string; type?: 'upcoming' | 'past' }) {
    const where: any = {
      OR: [
        { callerId: userId },
        { participantId: userId },
      ],
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.type === 'upcoming') {
      where.scheduledAt = { gte: new Date() };
      where.status = { in: ['SCHEDULED', 'PENDING'] };
    } else if (filters?.type === 'past') {
      where.AND = [
        {
          OR: [
            { endedAt: { not: null } },
            { cancelledAt: { not: null } },
            { status: 'COMPLETED' },
            { status: 'CANCELLED' },
          ],
        },
      ];
    }

    return this.prisma.videoCall.findMany({
      where,
      include: {
        caller: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                photos: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        participant: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                photos: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async getCallById(userId: string, callId: string) {
    const call = await this.prisma.videoCall.findUnique({
      where: { id: callId },
      include: {
        caller: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                photos: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        participant: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                photos: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!call) {
      throw new NotFoundException('Video call not found');
    }

    if (call.callerId !== userId && call.participantId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    return call;
  }
}

