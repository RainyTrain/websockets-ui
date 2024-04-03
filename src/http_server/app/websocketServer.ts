import Websocket, { WebSocketServer } from 'ws';
import { ExtendedWebsocket } from '../helpers/types/types';
import { v4 as uuidv4 } from 'uuid';

import { GameService } from '../services/gameService';

export class WebsocketServerClass {
  server: WebSocketServer;
  playersSockets: Map<string, { websocket: Websocket }>;
  gameService: GameService;

  constructor() {
    this.server = this.createWebsocketServer();
    this.playersSockets = new Map();
    this.gameService = new GameService();
    this.server.on('connection', this.handleConnection.bind(this));
  }

  createWebsocketServer() {
    return new WebSocketServer({ port: 3000 }, () => {
      console.log(this.server.address(), 'Websocket parameters');
    });
  }

  closeWebsocketConnection() {
    this.server.close();
  }

  handleConnection(socket: ExtendedWebsocket) {
    const id = uuidv4();

    this.playersSockets.set(id, { websocket: socket });

    socket.on('message', (message) => {
      const data = JSON.parse(message.toLocaleString());

      this.gameService.handleResponse(data, socket, this.server);
    });

    socket.on('close', () => {
      console.log('Closing websocket connection');
    });
  }
}
