import { Server } from 'socket.io';
export declare class NotificationGatewayService {
    private server;
    private connectedUsers;
    setServer(server: Server): void;
    setUserSocket(userId: string, socketId: string): void;
    removeUserSocket(userId: string): void;
    getUserSocket(userId: string): string | undefined;
    sendNotificationToUser(userId: string, notification: any): void;
    sendNotificationToAll(notification: any): void;
}
