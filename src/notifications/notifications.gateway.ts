import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { NotificationGatewayService } from '../common/services/notification-gateway.service';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private notificationGatewayService: NotificationGatewayService,
  ) {
    // Set server reference when gateway is initialized
    setTimeout(() => {
      if (this.server) {
        this.notificationGatewayService.setServer(this.server);
      }
    }, 0);
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      const token = client.handshake.auth.token || 
                   client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // Store user socket connection
      this.notificationGatewayService.setUserSocket(userId, client.id);
      client.data.userId = userId;

      // Join user-specific room
      client.join(`user-${userId}`);

      console.log(`User ${userId} connected to notifications`);
    } catch (error) {
      console.error('Notification gateway connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.notificationGatewayService.removeUserSocket(userId);
      console.log(`User ${userId} disconnected from notifications`);
    }
  }
}

