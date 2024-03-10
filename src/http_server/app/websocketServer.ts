import Websocket, { WebSocketServer } from 'ws';
import { Players } from '../entities/Players';
import { Commands, WebsocketCommandType } from '../helpers/types/types';
import { v4 as uuidv4 } from 'uuid';

export class WebsocketServerClass {
  server: WebSocketServer;
  playersSockets: Record<string, Websocket> = {};
  players: Players;

  constructor() {
    this.server = this.createWebsocketServer();
    this.players = new Players();
    this.server.on('connection', this.handleConnection.bind(this));
    this.server.on('close', () => {
      console.log('Server closed');
    });
  }

  createWebsocketServer() {
    return new WebSocketServer({ port: 3000 }, () => {
      console.log(this.server.address(), 'Websocket parameters');
    });
  }

  closeWebsocketConnection() {
    this.server.close();
  }

  handleConnection(socket: Websocket) {
    socket.on('message', (message) => {
      const data = JSON.parse(message.toLocaleString());

      console.log('data', data);

      return this.handleResponse(data);
    });
  }

  handleResponse(data: any): void {
    const commands: Commands = {
      [WebsocketCommandType.REG]: this.handleRegistration.bind(this),
    };

    if (data.type in commands) {
      return commands[data.type as WebsocketCommandType]!(data.data) as void;
    }
  }

  handleRegistration(data: any) {
    const newPlayer = this.players.createPlayer({ ...JSON.parse(data), id: uuidv4() });
    console.log('Player created', newPlayer);
    console.log(this.players);
  }
}
