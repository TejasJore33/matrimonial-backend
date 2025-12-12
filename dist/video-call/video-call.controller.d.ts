import { VideoCallService } from './video-call.service';
export declare class VideoCallController {
    private videoCallService;
    constructor(videoCallService: VideoCallService);
    createInstantCall(user: any, body: {
        participantId: string;
        audioOnly?: boolean;
    }): Promise<{
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
    scheduleCall(user: any, body: {
        participantId: string;
        scheduledAt: string;
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
    startCall(user: any, id: string): Promise<{
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
    endCall(user: any, id: string): Promise<{
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
    cancelCall(user: any, id: string): Promise<{
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
    getCalls(user: any, status?: string, type?: 'upcoming' | 'past'): Promise<({
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
    getCallById(user: any, id: string): Promise<{
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
