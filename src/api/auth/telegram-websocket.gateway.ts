import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, restrict this to your frontend domain
    credentials: true,
  },
})
export class TelegramWebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TelegramWebsocketGateway.name);
  private sessions: Map<string, string> = new Map(); // sessionToken -> socketId

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove session mapping when client disconnects
    for (const [sessionToken, socketId] of this.sessions.entries()) {
      if (socketId === client.id) {
        this.sessions.delete(sessionToken);
        break;
      }
    }
  }

  @SubscribeMessage('join_session')
  handleJoinSession(client: Socket, sessionToken: string): void {
    this.logger.log(`Client ${client.id} joined session ${sessionToken}`);
    this.sessions.set(sessionToken, client.id);
    client.join(sessionToken);
    client.emit('session_joined', { success: true });
  }

  /**
   * Send authentication result to the frontend
   * @param sessionToken
   * @param jwt
   */
  sendAuthResult(sessionToken: string, jwt: string): void {
    const socketId = this.sessions.get(sessionToken);
    if (socketId) {
      this.server.to(socketId).emit('auth_result', { status: 'success', jwt });
      this.sessions.delete(sessionToken);
    } else {
      this.logger.warn(`No socket found for session ${sessionToken}`);
    }
  }

  /**
   * Send authentication error to the frontend
   * @param sessionToken
   * @param error
   */
  sendAuthError(sessionToken: string, error: string): void {
    const socketId = this.sessions.get(sessionToken);
    if (socketId) {
      this.server.to(socketId).emit('auth_result', { status: 'error', error });
      this.sessions.delete(sessionToken);
    } else {
      this.logger.warn(`No socket found for session ${sessionToken}`);
    }
  }
}
