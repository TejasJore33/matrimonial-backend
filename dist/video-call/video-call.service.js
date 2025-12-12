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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoCallService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const chat_gateway_1 = require("../chat/chat.gateway");
let VideoCallService = class VideoCallService {
    constructor(prisma, notificationsService, chatGateway) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.chatGateway = chatGateway;
    }
    async createInstantCall(userId, participantId, audioOnly = false) {
        const interest = await this.prisma.interest.findFirst({
            where: {
                OR: [
                    { fromUserId: userId, toUserId: participantId, status: 'ACCEPTED' },
                    { fromUserId: participantId, toUserId: userId, status: 'ACCEPTED' },
                ],
            },
        });
        if (!interest) {
            throw new common_1.BadRequestException('Video calls are only available after interest is accepted');
        }
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
            throw new common_1.BadRequestException('You already have an active call. Please end the current call before starting a new one.');
        }
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
            throw new common_1.BadRequestException('The other user is currently on a call. Please try again later.');
        }
        const roomId = `room_${userId}_${participantId}_${Date.now()}`;
        const videoCall = await this.prisma.videoCall.create({
            data: {
                callerId: userId,
                participantId,
                scheduledAt: new Date(),
                status: 'PENDING',
                roomId,
                notes: audioOnly ? JSON.stringify({ audioOnly: true }) : null,
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
        await this.notificationsService.create(participantId, 'VIDEO_CALL', audioOnly ? 'Incoming Voice Call' : 'Incoming Video Call', `${videoCall.caller.profile?.firstName || 'Someone'} wants to ${audioOnly ? 'voice' : 'video'} call you`, { videoCallId: videoCall.id, roomId, callerId: userId, audioOnly }, { sendPush: true, sendRealTime: true });
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
            }
            else {
                console.log(`⚠️ Participant ${participantId} not connected via socket`);
            }
        }
        catch (error) {
            console.error('Error sending socket notification for video call:', error);
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
    async scheduleCall(userId, data) {
        const interest = await this.prisma.interest.findFirst({
            where: {
                OR: [
                    { fromUserId: userId, toUserId: data.participantId, status: 'ACCEPTED' },
                    { fromUserId: data.participantId, toUserId: userId, status: 'ACCEPTED' },
                ],
            },
        });
        if (!interest) {
            throw new common_1.BadRequestException('Video calls are only available after interest is accepted');
        }
        if (data.scheduledAt <= new Date()) {
            throw new common_1.BadRequestException('Scheduled time must be in the future');
        }
        const videoCall = await this.prisma.videoCall.create({
            data: {
                callerId: userId,
                participantId: data.participantId,
                scheduledAt: data.scheduledAt,
                duration: data.duration || 30,
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
        await this.notificationsService.create(data.participantId, 'VIDEO_CALL', 'Video Call Scheduled', `You have a video call scheduled for ${data.scheduledAt.toLocaleString()}`, { videoCallId: videoCall.id, callerId: userId }, { sendEmail: true, sendPush: true, sendRealTime: true });
        return videoCall;
    }
    async startCall(userId, callId) {
        const call = await this.prisma.videoCall.findUnique({
            where: { id: callId },
        });
        if (!call) {
            throw new common_1.NotFoundException('Video call not found');
        }
        if (call.callerId !== userId && call.participantId !== userId) {
            throw new common_1.BadRequestException('Unauthorized');
        }
        if (call.status !== 'SCHEDULED' && call.status !== 'PENDING') {
            throw new common_1.BadRequestException('Call cannot be started');
        }
        const roomId = `room_${callId}_${Date.now()}`;
        const updatedCall = await this.prisma.videoCall.update({
            where: { id: callId },
            data: {
                status: 'IN_PROGRESS',
                startedAt: new Date(),
                roomId,
            },
        });
        const otherUserId = call.callerId === userId ? call.participantId : call.callerId;
        await this.notificationsService.create(otherUserId, 'VIDEO_CALL', 'Video Call Started', 'The video call has started', { videoCallId: callId, roomId }, { sendPush: true, sendRealTime: true });
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
    async endCall(userId, callId) {
        const call = await this.prisma.videoCall.findUnique({
            where: { id: callId },
        });
        if (!call) {
            throw new common_1.NotFoundException('Video call not found');
        }
        if (call.callerId !== userId && call.participantId !== userId) {
            throw new common_1.BadRequestException('Unauthorized');
        }
        if (!['PENDING', 'SCHEDULED', 'IN_PROGRESS'].includes(call.status)) {
            throw new common_1.BadRequestException('Call cannot be ended');
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
        const otherUserId = call.callerId === userId ? call.participantId : call.callerId;
        try {
            const otherUserSocketId = this.chatGateway.connectedUsers?.get(otherUserId);
            if (otherUserSocketId && this.chatGateway.server) {
                this.chatGateway.server.to(otherUserSocketId).emit('video-call-ended', {
                    callId: callId,
                });
            }
        }
        catch (error) {
            console.error('Error sending call ended notification:', error);
        }
        return updatedCall;
    }
    async cancelCall(userId, callId) {
        const call = await this.prisma.videoCall.findUnique({
            where: { id: callId },
        });
        if (!call) {
            throw new common_1.NotFoundException('Video call not found');
        }
        if (call.callerId !== userId) {
            throw new common_1.BadRequestException('Only the caller can cancel the call');
        }
        if (call.status === 'COMPLETED' || call.status === 'CANCELLED') {
            throw new common_1.BadRequestException('Call cannot be cancelled');
        }
        const updatedCall = await this.prisma.videoCall.update({
            where: { id: callId },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
            },
        });
        await this.notificationsService.create(call.participantId, 'VIDEO_CALL', 'Video Call Cancelled', 'The scheduled video call has been cancelled', { videoCallId: callId }, { sendEmail: true, sendPush: true, sendRealTime: true });
        return updatedCall;
    }
    async getCalls(userId, filters) {
        const where = {
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
        }
        else if (filters?.type === 'past') {
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
    async getCallById(userId, callId) {
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
            throw new common_1.NotFoundException('Video call not found');
        }
        if (call.callerId !== userId && call.participantId !== userId) {
            throw new common_1.BadRequestException('Unauthorized');
        }
        return call;
    }
};
exports.VideoCallService = VideoCallService;
exports.VideoCallService = VideoCallService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => chat_gateway_1.ChatGateway))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        chat_gateway_1.ChatGateway])
], VideoCallService);
//# sourceMappingURL=video-call.service.js.map