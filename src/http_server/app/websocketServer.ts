import Websocket, { WebSocketServer } from 'ws';
import { Players, Player } from '../entities/Players';
import { Commands, ExtendedWebsocket, WebsocketCommandType } from '../helpers/types/types';
import { v4 as uuidv4 } from 'uuid';
import { jsonHandler } from '../helpers/deepStringify';
import { Rooms } from '../entities/Room';
import { Ships } from '../entities/Ships';
import { AttackRequest, Game } from '../entities/Game';

export class WebsocketServerClass {
  server: WebSocketServer;
  playersSockets: Map<string, { websocket: Websocket }>;
  players: Players;
  rooms: Rooms;
  ships: Ships;
  game: Game;

  constructor() {
    this.server = this.createWebsocketServer();
    this.playersSockets = new Map();
    this.players = new Players();
    this.rooms = new Rooms();
    this.ships = new Ships();
    this.game = new Game();
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

      console.log('data from front', data);

      this.handleResponse(data, socket);
    });
  }

  handleResponse(data: any, socket: ExtendedWebsocket) {
    const commands: Commands = {
      [WebsocketCommandType.REG]: this.reg.bind(this),
      [WebsocketCommandType.CREATE_ROOM]: this.createRoom.bind(this),
      [WebsocketCommandType.ADD_USER_TO_ROOM]: this.addUserToRoom.bind(this),
      [WebsocketCommandType.ADD_SHIPS]: this.addShips.bind(this),
      [WebsocketCommandType.ATTACK]: this.attack.bind(this),
      [WebsocketCommandType.RANDOM_ATTACK]: this.randomAttack.bind(this),
    };

    return commands[data.type as WebsocketCommandType]!(data, socket);
  }

  reg(data: any, socket: ExtendedWebsocket) {
    const newPlayer = this.players.createPlayer({
      ...JSON.parse(data.data),
      id: uuidv4(),
    }) as Player;

    socket.playerId = newPlayer?.id;

    socket.send(
      jsonHandler(
        {
          type: WebsocketCommandType.REG,
          data: { ...newPlayer, error: false, errorText: '' },
          id: 0,
        },
        'stringify',
      ),
    );

    const availableRooms = this.rooms.showAvailableRooms();

    this.server.clients.forEach((client) => {
      client.send(
        jsonHandler(
          {
            type: WebsocketCommandType.UPDATE_ROOM,
            data: availableRooms,
            id: 0,
          },
          'stringify',
        ),
      );
    });

    const winners = this.players.showWinners();

    this.server.clients.forEach((client) => {
      client.send(
        jsonHandler(
          {
            type: WebsocketCommandType.UPDATE_WINNERS,
            data: winners,
            id: 0,
          },
          'stringify',
        ),
      );
    });
  }

  createRoom(_: any, socket: ExtendedWebsocket) {
    if (!socket.playerId) {
      return;
    }

    const player = this.players.getPlayerById(socket.playerId);

    const newRoom = this.rooms.createRoom();

    if (!(player instanceof Error)) {
      this.rooms.addUserToRoom(player, newRoom.roomId);
    }

    const availableRooms = this.rooms.showAvailableRooms();

    this.server.clients.forEach((client) => {
      client.send(
        jsonHandler(
          {
            type: WebsocketCommandType.UPDATE_ROOM,
            data: availableRooms,
            id: 0,
          },
          'stringify',
        ),
      );
    });
  }

  addUserToRoom(data: any, socket: ExtendedWebsocket) {
    if (!socket.playerId) {
      return;
    }

    const roomIndex = JSON.parse(data.data).indexRoom as string;

    const user = this.players.getPlayerById(socket.playerId);

    if (!(user instanceof Error)) {
      this.rooms.addUserToRoom(user, roomIndex);
    }

    const availableRooms = this.rooms.showAvailableRooms();

    this.server.clients.forEach((client: ExtendedWebsocket) => {
      client.send(
        jsonHandler(
          {
            type: WebsocketCommandType.UPDATE_ROOM,
            data: availableRooms,
            id: 0,
          },
          'stringify',
        ),
      );
    });

    const playersId = this.rooms.showRoomMembers(roomIndex)?.map((user) => user.id);
    console.log(playersId, 'playersId');

    if (playersId?.length != 2) {
      return;
    }

    const game = this.rooms.createGame(roomIndex);
    console.log(game, 'game');

    this.server.clients.forEach((client: ExtendedWebsocket) => {
      if (playersId?.includes(client.playerId!) && game?.gameId) {
        client.send(
          jsonHandler(
            {
              type: WebsocketCommandType.CREATE_GAME,
              data: {
                idGame: game?.gameId,
                idPlayer: game.roomUsers.find((user) => user.id == client.playerId)?.idPlayer,
              },
              id: 0,
            },
            'stringify',
          ),
        );
      }
    });
  }

  addShips(data: any, socket: ExtendedWebsocket) {
    const gameIndex = JSON.parse(data.data).gameId;

    this.ships.setPlayersShips(JSON.parse(data.data));

    const ships = this.ships.getPlayersShipsByGameId(gameIndex);

    if (ships.length != 2) {
      return;
    }

    const roomPlayers = this.rooms.showRoomMembers(gameIndex);

    if (!roomPlayers) {
      return;
    }

    const roomPlayerslayersId = roomPlayers!.map((user) => user.id);

    this.server.clients.forEach((client: ExtendedWebsocket) => {
      if (roomPlayerslayersId.includes(client.playerId!)) {
        const playerGameId = roomPlayers?.find((player) => player.id == client.playerId)?.idPlayer;

        client.send(
          jsonHandler(
            {
              type: WebsocketCommandType.START_GAME,
              data: {
                ships: this.ships.findShipsByPlayersId(playerGameId as string),
                currentPlayerIndex: playerGameId,
              },
              id: 0,
            },
            'stringify',
          ),
        );
      }
    });

    const newGame = this.game.createNewGame(
      gameIndex,
      roomPlayers!.map((roomPlayer) => roomPlayer.idPlayer!),
    );

    const { turnId } = newGame;

    if (!turnId) {
      return;
    }

    this.server.clients.forEach((client: ExtendedWebsocket) => {
      if (roomPlayerslayersId.includes(client.playerId!)) {
        client.send(
          jsonHandler(
            {
              type: WebsocketCommandType.TURN,
              data: {
                currentPlayer: turnId,
              },
              id: 0,
            },
            'stringify',
          ),
        );
      }
    });
  }

  attack(data: any, socket: ExtendedWebsocket) {
    const attackData = JSON.parse(data.data) as AttackRequest;

    const roomPlayers = this.rooms.showRoomMembers(attackData.gameId);

    if (!roomPlayers) {
      return;
    }

    const game = this.game.getGameById(attackData.gameId);

    if (attackData.indexPlayer !== game?.turnId) {
      console.log('Не твоя очередь');
      return;
    }

    const enemiesShips = this.ships
      .getPlayersShipsByGameId(attackData.gameId)
      .find((player) => player.indexPlayer != attackData.indexPlayer)?.ships;

    if (!enemiesShips) {
      return;
    }

    const isCellAvailable = this.game.isCellAvailable(game.gameId, game.turnId, {
      x: attackData.x,
      y: attackData.y,
    });

    console.log(isCellAvailable, 'isCellAvailable');

    if (!isCellAvailable) {
      console.log('Клетка уже занята');
      return;
    }

    const attack = this.game.attack(attackData, enemiesShips);

    console.log('After attack', game?.status);

    const roomPlayerslayersId = roomPlayers!.map((user) => user.id);

    this.server.clients.forEach((client: ExtendedWebsocket) => {
      if (roomPlayerslayersId.includes(client.playerId!)) {
        attack?.forEach((attack) => {
          client.send(
            JSON.stringify({
              type: WebsocketCommandType.ATTACK,
              data: JSON.stringify({
                position: { ...attack?.position },
                currentPlayer: attack?.playerId,
                status: attack?.status,
              }),
              id: 0,
            }),
          );
        });

        client.send(
          jsonHandler(
            {
              type: WebsocketCommandType.TURN,
              data: {
                currentPlayer: game.turnId,
              },
              id: 0,
            },
            'stringify',
          ),
        );
      }
    });

    if (game.winPlayer) {
      const winnersId = roomPlayers.find((player) => player.idPlayer == game.winPlayer)?.id;
      this.players.incrementPlayerWin(winnersId!);
      const winners = this.players.showWinners();

      this.server.clients.forEach((client: ExtendedWebsocket) => {
        if (roomPlayerslayersId.includes(client.playerId!)) {
          client.send(
            jsonHandler(
              {
                type: WebsocketCommandType.FINISH,
                data: {
                  winPlayer: game.winPlayer,
                },
                id: 0,
              },
              'stringify',
            ),
          );
        }
        client.send(
          jsonHandler(
            {
              type: WebsocketCommandType.UPDATE_WINNERS,
              data: winners,
              id: 0,
            },
            'stringify',
          ),
        );
      });
    }

    if (game?.status === 'finish') {
      console.log('game has finished');
    }
  }

  randomAttack(data: any, socket: ExtendedWebsocket) {
    const { gameId, indexPlayer } = JSON.parse(data.data);

    const roomPlayers = this.rooms.showRoomMembers(gameId);

    if (!roomPlayers) {
      return;
    }

    const game = this.game.getGameById(gameId);

    const enemiesShips = this.ships
      .getPlayersShipsByGameId(gameId)
      .find((player) => player.indexPlayer != indexPlayer)?.ships;

    if (!enemiesShips) {
      return;
    }

    const cell = this.game.getRandomAvailableCell(gameId, indexPlayer);

    const isCellAvailable = this.game.isCellAvailable(gameId, indexPlayer, cell);

    console.log(isCellAvailable, 'indexPlayer');

    if (!isCellAvailable) {
      return;
    }

    const attack = this.game.attack({ gameId, indexPlayer, x: cell.x, y: cell.y }, enemiesShips);

    console.log('After attack', game?.status);

    const roomPlayerslayersId = roomPlayers!.map((user) => user.id);

    this.server.clients.forEach((client: ExtendedWebsocket) => {
      if (roomPlayerslayersId.includes(client.playerId!)) {
        attack?.forEach((attack) => {
          client.send(
            JSON.stringify({
              type: WebsocketCommandType.ATTACK,
              data: JSON.stringify({
                position: { ...attack?.position },
                currentPlayer: attack?.playerId,
                status: attack?.status,
              }),
              id: 0,
            }),
          );
        });

        client.send(
          jsonHandler(
            {
              type: WebsocketCommandType.TURN,
              data: {
                currentPlayer: game?.turnId,
              },
              id: 0,
            },
            'stringify',
          ),
        );
      }
    });
  }
}
