import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private chatService;
    private jwtService;
    server: Server;
    connectedUsers: Map<string, string>;
    constructor(chatService: ChatService, jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinChat(client: Socket, data: {
        chatId: string;
    }): Promise<void>;
    handleLeaveChat(client: Socket, data: {
        chatId: string;
    }): Promise<void>;
    handleMessage(client: Socket, data: {
        chatId: string;
        content?: string;
        imageUrl?: string;
        videoUrl?: string;
        audioUrl?: string;
        fileUrl?: string;
        fileName?: string;
        messageType?: string;
    }): Promise<{
        success: boolean;
        message: {
            sender: {
                profile: {
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
                } & {
                    gender: import(".prisma/client").$Enums.Gender | null;
                    religion: string | null;
                    motherTongue: string | null;
                    dateOfBirth: Date | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    status: import(".prisma/client").$Enums.ProfileStatus;
                    firstName: string | null;
                    lastName: string | null;
                    height: number | null;
                    maritalStatus: import(".prisma/client").$Enums.MaritalStatus | null;
                    caste: string | null;
                    manglik: boolean | null;
                    gothra: string | null;
                    country: string | null;
                    state: string | null;
                    city: string | null;
                    citizenship: string | null;
                    education: string | null;
                    college: string | null;
                    occupation: string | null;
                    income: number | null;
                    incomeCurrency: string | null;
                    fatherOccupation: string | null;
                    motherOccupation: string | null;
                    siblings: number | null;
                    familyType: import(".prisma/client").$Enums.FamilyType | null;
                    diet: import(".prisma/client").$Enums.Diet | null;
                    smoking: boolean | null;
                    drinking: boolean | null;
                    hobbies: string | null;
                    partnerPreferences: import("@prisma/client/runtime/library").JsonValue | null;
                    videoIntroUrl: string | null;
                    biodataUrl: string | null;
                    aboutMe: string | null;
                    highlights: import("@prisma/client/runtime/library").JsonValue | null;
                    latitude: number | null;
                    longitude: number | null;
                    privacySettings: import("@prisma/client/runtime/library").JsonValue | null;
                    isHiddenFromSearch: boolean;
                    isAnonymousViewing: boolean;
                    contactPrivacyLevel: string | null;
                    photoPrivacyLevel: string | null;
                    isVerified: boolean;
                    verifiedAt: Date | null;
                    trustScore: number;
                    completenessScore: number;
                    isHighlighted: boolean;
                    slug: string | null;
                    userId: string;
                };
                id: string;
            };
        } & {
            id: string;
            createdAt: Date;
            isRead: boolean;
            chatId: string;
            senderId: string;
            content: string | null;
            imageUrl: string | null;
            videoUrl: string | null;
            audioUrl: string | null;
            fileUrl: string | null;
            fileName: string | null;
            messageType: string;
            isDeleted: boolean;
            deletedBy: string[];
            isReported: boolean;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    handleTyping(client: Socket, data: {
        chatId: string;
        isTyping: boolean;
    }): Promise<void>;
    handleMarkRead(client: Socket, data: {
        chatId: string;
        messageIds: string[];
    }): Promise<void>;
    handleJoinVideoCall(client: Socket, data: {
        callId: string;
        roomId: string;
    }): Promise<void>;
    handleVideoCallOffer(client: Socket, data: {
        callId: string;
        offer: RTCSessionDescriptionInit;
    }): Promise<void>;
    handleVideoCallAnswer(client: Socket, data: {
        callId: string;
        answer: RTCSessionDescriptionInit;
    }): Promise<void>;
    handleVideoCallIceCandidate(client: Socket, data: {
        callId: string;
        candidate: RTCIceCandidateInit;
    }): Promise<void>;
    handleIncomingVideoCall(client: Socket, data: {
        callId: string;
        roomId: string;
        callerId: string;
        audioOnly: boolean;
        participantId?: string;
    }): Promise<void>;
}
