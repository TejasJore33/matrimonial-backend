import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: '/',
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? (process.env.FRONTEND_URL || 'http://localhost:3000')
      : true, // Allow all origins in development for mobile access
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  public connectedUsers = new Map<string, string>(); // userId -> socketId (made public for access from other services)

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
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

      let payload: any;
      try {
        payload = this.jwtService.verify(token);
        console.log('✅ Token verified successfully:', { userId: payload.sub || payload.id || payload.userId });
      } catch (error) {
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

      // Check if user already has a connection
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

      // Notify user is online
      client.broadcast.emit('user-online', { userId });

      console.log(`✅ User ${userId} connected successfully with socket ${client.id}`);
    } catch (error) {
      console.error('❌ Socket connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      // Only remove if this is the current connection for the user
      const currentSocketId = this.connectedUsers.get(userId);
      if (currentSocketId === client.id) {
        this.connectedUsers.delete(userId);
        client.broadcast.emit('user-offline', { userId });
        console.log(`👋 User ${userId} disconnected (socket ${client.id})`);
      } else {
        console.log(`⚠️ User ${userId} disconnected but had different socket (${currentSocketId} vs ${client.id})`);
      }
    } else {
      console.log(`⚠️ Socket ${client.id} disconnected without userId`);
    }
  }

  @SubscribeMessage('join-chat')
  async handleJoinChat(@ConnectedSocket() client: Socket, @MessageBody() data: { chatId: string }) {
    const userId = client.data.userId;
    client.join(`chat-${data.chatId}`);
    console.log(`✅ User ${userId} joined chat room: chat-${data.chatId}`);
  }

  @SubscribeMessage('leave-chat')
  async handleLeaveChat(@ConnectedSocket() client: Socket, @MessageBody() data: { chatId: string }) {
    client.leave(`chat-${data.chatId}`);
  }

  @SubscribeMessage('send-message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      chatId: string;
      content?: string;
      imageUrl?: string;
      videoUrl?: string;
      audioUrl?: string;
      fileUrl?: string;
      fileName?: string;
      messageType?: string;
    },
  ) {
    const userId = client.data.userId;
    if (!userId) {
      console.warn('⚠️ send-message: No userId found');
      return { success: false, error: 'Unauthorized' };
    }

    try {
      console.log('📨 Received message via socket:', { userId, chatId: data.chatId, content: data.content });
      const message = await this.chatService.sendMessage(userId, data.chatId, data);

      // Emit to all users in the chat room (including sender)
      this.server.to(`chat-${data.chatId}`).emit('new-message', message);
      console.log('✅ Message broadcasted to chat room:', data.chatId);

      return { success: true, message };
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      client.emit('message-error', { error: error.message || 'Failed to send message' });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; isTyping: boolean },
  ) {
    const userId = client.data.userId;
    if (!userId) {
      console.warn('⚠️ Typing event: No userId found');
      return;
    }

    console.log('📝 Typing event received:', { userId, chatId: data.chatId, isTyping: data.isTyping });
    
    // Get all sockets in the chat room
    const room = `chat-${data.chatId}`;
    const socketsInRoom = await this.server.in(room).fetchSockets();
    console.log(`📊 Room ${room} has ${socketsInRoom.length} socket(s)`);
    
    // Broadcast to all users in the chat room except the sender
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

  @SubscribeMessage('mark-read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; messageIds: string[] },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    await this.chatService.markAsRead(userId, data.chatId, data.messageIds);

    this.server.to(`chat-${data.chatId}`).emit('messages-read', {
      chatId: data.chatId,
      messageIds: data.messageIds,
    });
  }

  // Video Call Signaling Handlers
  @SubscribeMessage('join-video-call')
  async handleJoinVideoCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; roomId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    const room = `video-call-${data.callId}`;
    client.join(room);
    console.log(`✅ User ${userId} joined video call room: ${room}`);

    // Notify other participants
    client.to(room).emit('user-joined-call', { userId, callId: data.callId });
  }

  @SubscribeMessage('video-call-offer')
  async handleVideoCallOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; offer: RTCSessionDescriptionInit },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    const room = `video-call-${data.callId}`;
    console.log(`📤 User ${userId} sent video call offer for call ${data.callId}`);

    // Forward offer to other participants in the call
    client.to(room).emit('video-call-offer', {
      callId: data.callId,
      offer: data.offer,
      fromUserId: userId,
    });
  }

  @SubscribeMessage('video-call-answer')
  async handleVideoCallAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; answer: RTCSessionDescriptionInit },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    const room = `video-call-${data.callId}`;
    console.log(`📥 User ${userId} sent video call answer for call ${data.callId}`);

    // Forward answer to other participants in the call
    client.to(room).emit('video-call-answer', {
      callId: data.callId,
      answer: data.answer,
      fromUserId: userId,
    });
  }

  @SubscribeMessage('video-call-ice-candidate')
  async handleVideoCallIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; candidate: RTCIceCandidateInit },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    const room = `video-call-${data.callId}`;

    // Forward ICE candidate to other participants in the call
    client.to(room).emit('video-call-ice-candidate', {
      callId: data.callId,
      candidate: data.candidate,
      fromUserId: userId,
    });
  }

  @SubscribeMessage('incoming-video-call')
  async handleIncomingVideoCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; roomId: string; callerId: string; audioOnly: boolean; participantId?: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    // The participantId is the one being called (not the caller)
    const participantId = data.participantId || (data.callerId === userId ? userId : data.callerId);
    
    console.log(`📞 Incoming call from ${data.callerId} to participant ${participantId}`);

    // Get the participant's socket ID
    const participantSocketId = this.connectedUsers.get(participantId);

    if (participantSocketId) {
      // Send to the participant
      this.server.to(participantSocketId).emit('incoming-video-call', {
        callId: data.callId,
        roomId: data.roomId,
        callerId: data.callerId,
        audioOnly: data.audioOnly,
      });
      console.log(`✅ Incoming call notification sent to user ${participantId}`);
    } else {
      console.log(`⚠️ Participant ${participantId} not connected, cannot send call notification`);
    }
  }
}

