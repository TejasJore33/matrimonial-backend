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
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const chat_service_1 = require("./chat.service");
const jwt_1 = require("@nestjs/jwt");
let ChatGateway = class ChatGateway {
    constructor(chatService, jwtService) {
        this.chatService = chatService;
        this.jwtService = jwtService;
        this.connectedUsers = new Map();
    }
    async handleConnection(client) {
        try {
            console.log('🔌 New socket connection attempt:', {
                id: client.id,
                auth: client.handshake.auth,
                headers: client.handshake.headers.authorization ? 'present' : 'missing',
            });
            const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                console.warn('❌ Socket connection rejected: No token provided');
                client.disconnect();
                return;
            }
            let payload;
            try {
                payload = this.jwtService.verify(token);
                console.log('✅ Token verified successfully:', { userId: payload.sub || payload.id || payload.userId });
            }
            catch (error) {
                console.warn('❌ Socket connection rejected: Invalid token', error);
                client.disconnect();
                return;
            }
            const userId = payload.sub || payload.id || payload.userId;
            if (!userId) {
                console.warn('❌ Socket connection rejected: No user ID in token', payload);
                client.disconnect();
                return;
            }
            const existingSocketId = this.connectedUsers.get(userId);
            if (existingSocketId && existingSocketId !== client.id) {
                console.log(`🔄 User ${userId} already connected with socket ${existingSocketId}, disconnecting old connection`);
                const oldSocket = this.server.sockets.sockets.get(existingSocketId);
                if (oldSocket) {
                    oldSocket.disconnect();
                }
            }
            this.connectedUsers.set(userId, client.id);
            client.data.userId = userId;
            client.broadcast.emit('user-online', { userId });
            console.log(`✅ User ${userId} connected successfully with socket ${client.id}`);
        }
        catch (error) {
            console.error('❌ Socket connection error:', error);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const userId = client.data.userId;
        if (userId) {
            const currentSocketId = this.connectedUsers.get(userId);
            if (currentSocketId === client.id) {
                this.connectedUsers.delete(userId);
                client.broadcast.emit('user-offline', { userId });
                console.log(`👋 User ${userId} disconnected (socket ${client.id})`);
            }
            else {
                console.log(`⚠️ User ${userId} disconnected but had different socket (${currentSocketId} vs ${client.id})`);
            }
        }
        else {
            console.log(`⚠️ Socket ${client.id} disconnected without userId`);
        }
    }
    async handleJoinChat(client, data) {
        const userId = client.data.userId;
        client.join(`chat-${data.chatId}`);
        console.log(`✅ User ${userId} joined chat room: chat-${data.chatId}`);
    }
    async handleLeaveChat(client, data) {
        client.leave(`chat-${data.chatId}`);
    }
    async handleMessage(client, data) {
        const userId = client.data.userId;
        if (!userId) {
            console.warn('⚠️ send-message: No userId found');
            return { success: false, error: 'Unauthorized' };
        }
        try {
            console.log('📨 Received message via socket:', { userId, chatId: data.chatId, content: data.content });
            const message = await this.chatService.sendMessage(userId, data.chatId, data);
            this.server.to(`chat-${data.chatId}`).emit('new-message', message);
            console.log('✅ Message broadcasted to chat room:', data.chatId);
            return { success: true, message };
        }
        catch (error) {
            console.error('❌ Error sending message:', error);
            client.emit('message-error', { error: error.message || 'Failed to send message' });
            return { success: false, error: error.message };
        }
    }
    async handleTyping(client, data) {
        const userId = client.data.userId;
        if (!userId) {
            console.warn('⚠️ Typing event: No userId found');
            return;
        }
        console.log('📝 Typing event received:', { userId, chatId: data.chatId, isTyping: data.isTyping });
        const room = `chat-${data.chatId}`;
        const socketsInRoom = await this.server.in(room).fetchSockets();
        console.log(`📊 Room ${room} has ${socketsInRoom.length} socket(s)`);
        client.to(room).emit('user-typing', {
            userId,
            chatId: data.chatId,
            isTyping: data.isTyping,
        });
        console.log('✅ Typing event broadcasted to chat room:', room, {
            senderId: userId,
            isTyping: data.isTyping,
            roomSize: socketsInRoom.length
        });
    }
    async handleMarkRead(client, data) {
        const userId = client.data.userId;
        if (!userId)
            return;
        await this.chatService.markAsRead(userId, data.chatId, data.messageIds);
        this.server.to(`chat-${data.chatId}`).emit('messages-read', {
            chatId: data.chatId,
            messageIds: data.messageIds,
        });
    }
    async handleJoinVideoCall(client, data) {
        const userId = client.data.userId;
        if (!userId)
            return;
        const room = `video-call-${data.callId}`;
        client.join(room);
        console.log(`✅ User ${userId} joined video call room: ${room}`);
        client.to(room).emit('user-joined-call', { userId, callId: data.callId });
    }
    async handleVideoCallOffer(client, data) {
        const userId = client.data.userId;
        if (!userId)
            return;
        const room = `video-call-${data.callId}`;
        console.log(`📤 User ${userId} sent video call offer for call ${data.callId}`);
        client.to(room).emit('video-call-offer', {
            callId: data.callId,
            offer: data.offer,
            fromUserId: userId,
        });
    }
    async handleVideoCallAnswer(client, data) {
        const userId = client.data.userId;
        if (!userId)
            return;
        const room = `video-call-${data.callId}`;
        console.log(`📥 User ${userId} sent video call answer for call ${data.callId}`);
        client.to(room).emit('video-call-answer', {
            callId: data.callId,
            answer: data.answer,
            fromUserId: userId,
        });
    }
    async handleVideoCallIceCandidate(client, data) {
        const userId = client.data.userId;
        if (!userId)
            return;
        const room = `video-call-${data.callId}`;
        client.to(room).emit('video-call-ice-candidate', {
            callId: data.callId,
            candidate: data.candidate,
            fromUserId: userId,
        });
    }
    async handleIncomingVideoCall(client, data) {
        const userId = client.data.userId;
        if (!userId)
            return;
        const participantId = data.participantId || (data.callerId === userId ? userId : data.callerId);
        console.log(`📞 Incoming call from ${data.callerId} to participant ${participantId}`);
        const participantSocketId = this.connectedUsers.get(participantId);
        if (participantSocketId) {
            this.server.to(participantSocketId).emit('incoming-video-call', {
                callId: data.callId,
                roomId: data.roomId,
                callerId: data.callerId,
                audioOnly: data.audioOnly,
            });
            console.log(`✅ Incoming call notification sent to user ${participantId}`);
        }
        else {
            console.log(`⚠️ Participant ${participantId} not connected, cannot send call notification`);
        }
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-chat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave-chat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleLeaveChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send-message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('mark-read'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMarkRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-video-call'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinVideoCall", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('video-call-offer'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleVideoCallOffer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('video-call-answer'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleVideoCallAnswer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('video-call-ice-candidate'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleVideoCallIceCandidate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('incoming-video-call'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleIncomingVideoCall", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/',
        cors: {
            origin: process.env.NODE_ENV === 'production'
                ? (process.env.FRONTEND_URL || 'http://localhost:3000')
                : true,
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        jwt_1.JwtService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map