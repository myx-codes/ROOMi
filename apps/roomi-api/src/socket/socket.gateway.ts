import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Member } from '../libs/dto/member/member';
import { AuthService } from '../components/auth/auth.service';

enum RoomiEvents {
  INFO = 'info',
  MESSAGE = 'message',
  PROPERTY_BOOKED = 'propertyBooked',
  NEW_BOOKING_ALERT = 'newBookingAlert',
  GET_MESSAGES = 'getMessages',
}

interface MessagePayload {
  event: RoomiEvents;
  text?: string;
  memberData?: Member;
  propertyId?: string;
  data?: any;
}

interface InfoPayload {
  event: RoomiEvents.INFO;
  totalClients: number;
  memberData: Member | null;
  action: 'joined' | 'left';
}

@WebSocketGateway({
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  cors: {
    origin: true,
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger('RoomiSocketGateway');
  private summaryClient = 0;
  private clientsAuthMap = new Map<string, Member | null>();
  private messagesList: MessagePayload[] = [];

  constructor(private authService: AuthService) {}

  @WebSocketServer()
  server?: Server;

  afterInit() {
    this.logger.verbose(`ROOMi Socket.IO Server Initialized`);
  }

  private async retrieveAuth(client: Socket): Promise<Member | null> {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.query?.token;

      if (!token) return null;

      return await this.authService.verifyToken(token as string);
    } catch {
      return null;
    }
  }

  async handleConnection(client: Socket) {
    const authMember = await this.retrieveAuth(client);

    this.summaryClient++;
    this.clientsAuthMap.set(client.id, authMember);

    const clientNick = authMember?.memberNick ?? 'Guest';
    this.logger.log(`Connected: ${clientNick} | Total: [${this.summaryClient}]`);

    const infoMsg: InfoPayload = {
      event: RoomiEvents.INFO,
      totalClients: this.summaryClient,
      memberData: authMember,
      action: 'joined',
    };

    this.server?.emit(RoomiEvents.INFO, infoMsg);

    client.emit(RoomiEvents.GET_MESSAGES, {
      event: RoomiEvents.GET_MESSAGES,
      list: this.messagesList,
    });
  }

  handleDisconnect(client: Socket) {
    const authMember = this.clientsAuthMap.get(client.id);

    this.summaryClient = Math.max(this.summaryClient - 1, 0);
    this.clientsAuthMap.delete(client.id);

    const clientNick = authMember?.memberNick ?? 'Guest';
    this.logger.warn(`Disconnected: [${clientNick}] | Total: [${this.summaryClient}]`);

    const infoMsg: InfoPayload = {
      event: RoomiEvents.INFO,
      totalClients: this.summaryClient,
      memberData: authMember ?? null,
      action: 'left',
    };

    this.server?.emit(RoomiEvents.INFO, infoMsg);
  }

  @SubscribeMessage(RoomiEvents.MESSAGE)
  async handleMessage(client: Socket, payload: string): Promise<void> {
    const authMember = this.clientsAuthMap.get(client.id);

    const newMessage: MessagePayload = {
      event: RoomiEvents.MESSAGE,
      text: payload,
      memberData: authMember || undefined,
    };

    this.logger.verbose(`MSG from [${authMember?.memberNick ?? 'Guest'}]: ${payload}`);

    this.messagesList.push(newMessage);
    if (this.messagesList.length > 20) this.messagesList.shift();

    this.server?.emit(RoomiEvents.MESSAGE, newMessage);
  }

  public sendPropertyUpdate(propertyId: string, bookedDates: string[]) {
    this.server?.emit(RoomiEvents.PROPERTY_BOOKED, {
      event: RoomiEvents.PROPERTY_BOOKED,
      propertyId,
      data: { bookedDates },
    });
  }

  public sendNotificationToMember(memberId: string, notification: any) {
    this.clientsAuthMap.forEach((member, socketId) => {
      if (member?._id.toString() === memberId.toString()) {
        this.server?.to(socketId).emit(RoomiEvents.NEW_BOOKING_ALERT, {
          event: RoomiEvents.NEW_BOOKING_ALERT,
          data: notification,
        });
      }
    });
  }
}