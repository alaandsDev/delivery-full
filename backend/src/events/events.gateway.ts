import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify } from 'jsonwebtoken';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/ws',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(private readonly config: ConfigService) {}

  handleConnection(client: Socket) {
    // Autenticar via token no handshake
    const token =
      (client.handshake.auth?.token as string) ||
      (client.handshake.headers?.authorization as string)?.replace('Bearer ', '');

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const secret = this.config.get<string>('JWT_SECRET') ?? 'dev-secret';
      const payload = verify(token, secret) as { id: string; email: string };
      (client as any).userId = payload.id;
      this.logger.log(`WS conectado: ${payload.email}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WS desconectado: ${client.id}`);
  }

  // Lojista entra no "room" da sua loja para receber eventos
  @SubscribeMessage('join_store')
  handleJoinStore(
    @MessageBody() storeId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`store:${storeId}`);
    this.logger.log(`Socket ${client.id} entrou no room store:${storeId}`);
    return { ok: true };
  }

  // Emite evento para todos conectados no room da loja
  notifyStore(storeId: string, event: string, data: unknown) {
    this.server.to(`store:${storeId}`).emit(event, data);
  }
}
