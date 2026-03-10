import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Member } from '../libs/dto/member/member'; // O'z yo'lingizga moslang
import { AuthService } from '../components/auth/auth.service';
import * as url from 'url';

// ROOMi uchun maxsus event turlari
enum RoomiEvents {
  INFO = 'info',
  MESSAGE = 'message',
  PROPERTY_BOOKED = 'propertyBooked', // Kalendar yangilanishi uchun
  NEW_BOOKING_ALERT = 'newBookingAlert', // Manager uchun bildirishnoma
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

@WebSocketGateway({ transports: ['websocket'], secure: false })
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private logger: Logger = new Logger('RoomiSocketGateway');
  private summaryClient: number = 0;
  private clientsAuthMap = new Map<WebSocket, Member | null>();
  private messagesList: MessagePayload[] = [];

  constructor(private authService: AuthService) {}

  @WebSocketServer()
  server: Server;

  public afterInit(server: Server) {
    this.logger.verbose(`ROOMi WebSocket Server Initialized. Total clients: [${this.summaryClient}]`);
  }

  /** AUTHENTICATION: Token orqali memberni aniqlash **/
  private async retrieveAuth(req: any): Promise<Member | null> {
    try {
      const parseUrl = url.parse(req.url, true);
      const { token } = parseUrl.query;
      if (!token) return null;
      return await this.authService.verifyToken(token as string);
    } catch (err) {
      return null;
    }
  }

  /** CONNECTION HANDLE **/
  public async handleConnection(client: WebSocket, req: any) {
    const authMember = await this.retrieveAuth(req);
    this.summaryClient++;
    this.clientsAuthMap.set(client, authMember);

    const clientNick: string = authMember?.memberNick ?? 'Guest';
    this.logger.log(`Connected: ${clientNick} | Total: [${this.summaryClient}]`);

    // Hamma mijozlarga yangi foydalanuvchi qo'shilgani haqida xabar
    const infoMsg: InfoPayload = {
      event: RoomiEvents.INFO,
      totalClients: this.summaryClient,
      memberData: authMember,
      action: 'joined',
    };
    this.emitMessage(infoMsg);

    // Yangi ulanishga chat tarixini yuborish
    client.send(JSON.stringify({ event: RoomiEvents.GET_MESSAGES, list: this.messagesList }));
  }

  /** DISCONNECT HANDLE **/
  public handleDisconnect(client: WebSocket) {
    const authMember = this.clientsAuthMap.get(client);
    this.summaryClient--;
    this.clientsAuthMap.delete(client);

    const clientNick: string = authMember?.memberNick ?? 'Guest';
    this.logger.warn(`Disconnected: [${clientNick}] | Total: [${this.summaryClient}]`);

    const infoMsg: InfoPayload = {
      event: RoomiEvents.INFO,
      totalClients: this.summaryClient,
      memberData: authMember ?? null,
      action: 'left',
    };
    this.broadcastMessage(client, infoMsg);
  }

  /** CHAT MESSAGE HANDLER **/
  @SubscribeMessage('message')
  public async handleMessage(client: WebSocket, payload: string): Promise<void> {
    const authMember = this.clientsAuthMap.get(client);
    const newMessage: MessagePayload = { 
        event: RoomiEvents.MESSAGE, 
        text: payload, 
        memberData: authMember || undefined 
    };

    this.logger.verbose(`MSG from [${authMember?.memberNick ?? 'Guest'}]: ${payload}`);

    this.messagesList.push(newMessage);
    if (this.messagesList.length >= 20) this.messagesList.shift(); // Oxirgi 20 ta xabarni saqlash

    this.emitMessage(newMessage);
  }

  /** * ROOMi EXCLUSIVE: Property band bo'lganda kalendarni yangilash 
   * Bu funksiya PropertyService ichidan chaqiriladi
   **/
  public sendPropertyUpdate(propertyId: string, bookedDates: string[]) {
    const updatePayload: MessagePayload = {
      event: RoomiEvents.PROPERTY_BOOKED,
      propertyId,
      data: { bookedDates },
    };
    this.emitMessage(updatePayload);
  }

  /** * ROOMi EXCLUSIVE: Faqat Managerga bildirishnoma yuborish 
   **/
  public sendNotificationToMember(memberId: string, notification: any) {
    this.clientsAuthMap.forEach((member, client) => {
      if (member?._id.toString() === memberId.toString() && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          event: RoomiEvents.NEW_BOOKING_ALERT,
          data: notification
        }));
      }
    });
  }

  /** YUBORISH USULLARI **/

  // 1. Emit: Hammaga yuborish
  private emitMessage(message: any) {
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // 2. Broadcast: O'zidan tashqari hammaga yuborish
  private broadcastMessage(sender: WebSocket, message: any) {
    this.server.clients.forEach((client) => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}