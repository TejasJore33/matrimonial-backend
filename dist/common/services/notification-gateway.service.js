"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationGatewayService = void 0;
const common_1 = require("@nestjs/common");
let NotificationGatewayService = class NotificationGatewayService {
    constructor() {
        this.connectedUsers = new Map();
    }
    setServer(server) {
        this.server = server;
    }
    setUserSocket(userId, socketId) {
        this.connectedUsers.set(userId, socketId);
    }
    removeUserSocket(userId) {
        this.connectedUsers.delete(userId);
    }
    getUserSocket(userId) {
        return this.connectedUsers.get(userId);
    }
    sendNotificationToUser(userId, notification) {
        if (!this.server)
            return;
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.server.to(socketId).emit('new-notification', notification);
        }
        this.server.to(`user-${userId}`).emit('new-notification', notification);
    }
    sendNotificationToAll(notification) {
        if (!this.server)
            return;
        this.server.emit('new-notification', notification);
    }
};
exports.NotificationGatewayService = NotificationGatewayService;
exports.NotificationGatewayService = NotificationGatewayService = __decorate([
    (0, common_1.Injectable)()
], NotificationGatewayService);
//# sourceMappingURL=notification-gateway.service.js.map