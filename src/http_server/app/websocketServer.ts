import Websocket, { WebSocketServer } from 'ws';
import { Players } from '../entities/Players';
import { Commands, ExtendedWebsocket, WebsocketCommandType } from '../helpers/types/types';
import { v4 as uuidv4 } from 'uuid';
import { deepStringify } from '../helpers/deepStringify';
import { Rooms } from '../entities/Room';

export class WebsocketServerClass {
  server: WebSocketServer;
  playersSockets: Map<
    string,
    { websocket: Websocket; callSequence: Array<(...args: any[]) => unknown> }
  >;
  players: Players;
  rooms: Rooms;

  constructor() {
    this.server = this.createWebsocketServer();
    this.playersSockets = new Map();
    this.players = new Players();
    this.rooms = new Rooms();
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

    this.playersSockets.set(id, { websocket: socket, callSequence: [] });

    socket.on('message', (message) => {
      const data = JSON.parse(message.toLocaleString());

      console.log('data', data);

      this.handleResponse(data, socket);

      console.log(this.players.players, 'all players');
    });
  }

  handleResponse(data: any, socket: ExtendedWebsocket) {
    const commands: Commands = {
      [WebsocketCommandType.REG]: this.reg.bind(this),
      [WebsocketCommandType.CREATE_ROOM]: this.createRoom.bind(this),
    };

    return commands[data.type as WebsocketCommandType]!(data, socket);
  }

  reg(data: any, socket: ExtendedWebsocket) {
    const newPlayer = this.players.createPlayer({ ...JSON.parse(data.data), id: uuidv4() });

    socket.playerId = newPlayer?.id;

    console.log('Player created', newPlayer);

    socket.send(
      deepStringify({
        type: WebsocketCommandType.REG,
        data: { ...newPlayer, error: false, errorText: '' },
        id: 0,
      }),
    );

    const availableRooms = this.rooms.showAvailableRooms();

    console.log('Available rooms:', availableRooms);

    this.server.clients.forEach((client) => {
      client.send(
        deepStringify({
          type: WebsocketCommandType.UPDATE_ROOM,
          data: availableRooms,
          id: 0,
        }),
      );
    });

    const winners = this.players.showWinners();

    this.server.clients.forEach((client) => {
      client.send(
        deepStringify({
          type: WebsocketCommandType.UPDATE_WINNERS,
          data: winners,
          id: 0,
        }),
      );
    });
  }

  createRoom(_: any, socket: ExtendedWebsocket) {
    const newRoom = this.rooms.createRoom();

    if (socket.playerId) {
      const player = this.players.getPlayerById(socket.playerId);

      console.log('Player jus created', player);

      this.rooms.addUserToRoom(player!, newRoom.roomId);
    }

    console.log(newRoom, 'Created new room');

    const availableRooms = this.rooms.showAvailableRooms();

    console.log('Available rooms:', availableRooms);

    this.server.clients.forEach((client) => {
      client.send(
        deepStringify({
          type: WebsocketCommandType.UPDATE_ROOM,
          data: availableRooms,
          id: 0,
        }),
      );
    });
  }
}
