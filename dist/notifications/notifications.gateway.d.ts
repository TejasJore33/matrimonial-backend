import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { NotificationGatewayService } from '../common/services/notification-gateway.service';
export declare class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private notificationGatewayService;
    server: Server;
    constructor(jwtService: JwtService, notificationGatewayService: NotificationGatewayService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
}
