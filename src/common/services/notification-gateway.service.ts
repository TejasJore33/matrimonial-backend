import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class NotificationGatewayService {
  private server: Server;
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  setServer(server: Server) {
    this.server = server;
  }

  setUserSocket(userId: string, socketId: string) {
    this.connectedUsers.set(userId, socketId);
  }

  removeUserSocket(userId: string) {
    this.connectedUsers.delete(userId);
  }

  getUserSocket(userId: string): string | undefined {
    return this.connectedUsers.get(userId);
  }

  sendNotificationToUser(userId: string, notification: any) {
    if (!this.server) return;
    
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('new-notification', notification);
    }
    
    // Also emit to user room
    this.server.to(`user-${userId}`).emit('new-notification', notification);
  }

  sendNotificationToAll(notification: any) {
    if (!this.server) return;
    this.server.emit('new-notification', notification);
  }
}

