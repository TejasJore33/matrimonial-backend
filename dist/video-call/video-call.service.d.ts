import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatGateway } from '../chat/chat.gateway';
export declare class VideoCallService {
    private prisma;
    private notificationsService;
    private chatGateway;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, chatGateway: ChatGateway);
    createInstantCall(userId: string, participantId: string, audioOnly?: boolean): Promise<{
        roomId: string;
        audioOnly: boolean;
        webrtcConfig: {
            iceServers: {
                urls: string;
            }[];
        };
        caller: {
            profile: {
                firstName: string;
                lastName: string;
            };
            email: string;
            id: string;
        };
        participant: {
            profile: {
                firstName: string;
                lastName: string;
            };
            email: string;
            id: string;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        notes: string | null;
        duration: number | null;
        callerId: string;
        participantId: string;
        scheduledAt: Date | null;
        startedAt: Date | null;
        endedAt: Date | null;
        cancelledAt: Date | null;
    }>;
    scheduleCall(userId: string, data: {
        participantId: string;
        scheduledAt: Date;
        duration?: number;
        notes?: string;
    }): Promise<{
        caller: {
            profile: {
                firstName: string;
                lastName: string;
            };
            email: string;
            id: string;
        };
        participant: {
            profile: {
                firstName: string;
                lastName: string;
            };
            email: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        notes: string | null;
        duration: number | null;
        callerId: string;
        participantId: string;
        scheduledAt: Date | null;
        startedAt: Date | null;
        endedAt: Date | null;
        cancelledAt: Date | null;
        roomId: string | null;
    }>;
    startCall(userId: string, callId: string): Promise<{
        roomId: string;
        webrtcConfig: {
            iceServers: {
                urls: string;
            }[];
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        notes: string | null;
        duration: number | null;
        callerId: string;
        participantId: string;
        scheduledAt: Date | null;
        startedAt: Date | null;
        endedAt: Date | null;
        cancelledAt: Date | null;
    }>;
    endCall(userId: string, callId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        notes: string | null;
        duration: number | null;
        callerId: string;
        participantId: string;
        scheduledAt: Date | null;
        startedAt: Date | null;
        endedAt: Date | null;
        cancelledAt: Date | null;
        roomId: string | null;
    }>;
    cancelCall(userId: string, callId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        notes: string | null;
        duration: number | null;
        callerId: string;
        participantId: string;
        scheduledAt: Date | null;
        startedAt: Date | null;
        endedAt: Date | null;
        cancelledAt: Date | null;
        roomId: string | null;
    }>;
    getCalls(userId: string, filters?: {
        status?: string;
        type?: 'upcoming' | 'past';
    }): Promise<({
        caller: {
            profile: {
                firstName: string;
                lastName: string;
                photos: {
                    url: string;
                    id: string;
                    createdAt: Date;
                    profileId: string;
                    cloudinaryId: string | null;
                    isPrimary: boolean;
                    isBlurred: boolean;
                    isApproved: boolean;
                    order: number;
                    albumName: string | null;
                    caption: string | null;
                }[];
            };
            email: string;
            id: string;
        };
        participant: {
            profile: {
                firstName: string;
                lastName: string;
                photos: {
                    url: string;
                    id: string;
                    createdAt: Date;
                    profileId: string;
                    cloudinaryId: string | null;
                    isPrimary: boolean;
                    isBlurred: boolean;
                    isApproved: boolean;
                    order: number;
                    albumName: string | null;
                    caption: string | null;
                }[];
            };
            email: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        notes: string | null;
        duration: number | null;
        callerId: string;
        participantId: string;
        scheduledAt: Date | null;
        startedAt: Date | null;
        endedAt: Date | null;
        cancelledAt: Date | null;
        roomId: string | null;
    })[]>;
    getCallById(userId: string, callId: string): Promise<{
        caller: {
            profile: {
                firstName: string;
                lastName: string;
                photos: {
                    url: string;
                    id: string;
                    createdAt: Date;
                    profileId: string;
                    cloudinaryId: string | null;
                    isPrimary: boolean;
                    isBlurred: boolean;
                    isApproved: boolean;
                    order: number;
                    albumName: string | null;
                    caption: string | null;
                }[];
            };
            email: string;
            id: string;
        };
        participant: {
            profile: {
                firstName: string;
                lastName: string;
                photos: {
                    url: string;
                    id: string;
                    createdAt: Date;
                    profileId: string;
                    cloudinaryId: string | null;
                    isPrimary: boolean;
                    isBlurred: boolean;
                    isApproved: boolean;
                    order: number;
                    albumName: string | null;
                    caption: string | null;
                }[];
            };
            email: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        notes: string | null;
        duration: number | null;
        callerId: string;
        participantId: string;
        scheduledAt: Date | null;
        startedAt: Date | null;
        endedAt: Date | null;
        cancelledAt: Date | null;
        roomId: string | null;
    }>;
}
