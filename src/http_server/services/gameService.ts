import { AttackRequest, Game } from '../entities/Game';
import { Player, Players } from '../entities/Player';
import { Rooms } from '../entities/Room';
import { Ships } from '../entities/Ship';
import { Commands, ExtendedWebsocket, WebsocketCommandType } from '../helpers/types/types';
import { v4 as uuidv4 } from 'uuid';
import { websocketMessage } from '../helpers/websocketMessage';
import { WebSocketServer } from 'ws';

export class GameService {
  players: Players;
  rooms: Rooms;
  ships: Ships;
  game: Game;

  constructor() {
    this.players = new Players();
    this.rooms = new Rooms();
    this.ships = new Ships();
    this.game = new Game();
  }

  handleResponse(data: any, socket: ExtendedWebsocket, server: WebSocketServer) {
    const commands: Commands = {
      [WebsocketCommandType.REG]: this.reg.bind(this),
      [WebsocketCommandType.CREATE_ROOM]: this.createRoom.bind(this),
      [WebsocketCommandType.ADD_USER_TO_ROOM]: this.addUserToRoom.bind(this),
      [WebsocketCommandType.ADD_SHIPS]: this.addShips.bind(this),
      [WebsocketCommandType.ATTACK]: this.attack.bind(this),
      [WebsocketCommandType.RANDOM_ATTACK]: this.randomAttack.bind(this),
    };

    return commands[data.type as WebsocketCommandType]!(data, socket, server);
  }

  reg(data: any, socket: ExtendedWebsocket, server: WebSocketServer) {
    const { name, password }: { name: string; password: string } = JSON.parse(data.data);

    const newPlayer = this.players.createPlayer({
      name,
      password,
      id: uuidv4(),
    }) as Player;

    socket.playerId = newPlayer?.id;

    const availableRooms = this.rooms.showAvailableRooms();

    const winners = this.players.showWinners();

    socket.send(
      websocketMessage(
        { name: newPlayer.name, index: newPlayer.id, error: false, errorText: '' },
        WebsocketCommandType.REG,
      ),
    );

    server.clients.forEach((client: ExtendedWebsocket) => {
      client.send(websocketMessage(availableRooms, WebsocketCommandType.UPDATE_ROOM));
      client.send(websocketMessage(winners, WebsocketCommandType.UPDATE_WINNERS));
    });
  }

  createRoom(data: any, socket: ExtendedWebsocket, server: WebSocketServer) {
    if (!socket.playerId) {
      return;
    }

    const player = this.players.getPlayerById(socket.playerId);

    const newRoom = this.rooms.createRoom();

    if (player instanceof Error) {
      return;
    }

    this.rooms.addUserToRoom(player, newRoom.roomId);

    const availableRooms = this.rooms.showAvailableRooms();

    server.clients.forEach((client) => {
      client.send(websocketMessage(availableRooms, WebsocketCommandType.UPDATE_ROOM));
    });
  }

  addUserToRoom(data: any, socket: ExtendedWebsocket, server: WebSocketServer) {
    if (!socket.playerId) {
      return;
    }

    const { indexRoom }: { indexRoom: string } = JSON.parse(data.data);

    const user = this.players.getPlayerById(socket.playerId);

    if (user instanceof Error) {
      return;
    }

    this.rooms.addUserToRoom(user, indexRoom);

    const availableRooms = this.rooms.showAvailableRooms();

    server.clients.forEach((client: ExtendedWebsocket) => {
      client.send(websocketMessage(availableRooms, WebsocketCommandType.UPDATE_ROOM));
    });

    const playersId = this.rooms.showRoomMembers(indexRoom).map((user) => user.id);

    if (playersId?.length != 2) {
      return;
    }

    const game = this.rooms.createGame(indexRoom);

    server.clients.forEach((client: ExtendedWebsocket) => {
      if (client.playerId && playersId?.includes(client.playerId) && game?.gameId) {
        client.send(
          websocketMessage(
            {
              idGame: game.gameId,
              idPlayer: game.roomUsers.find((user) => user.id == client.playerId)?.idPlayer,
            },
            WebsocketCommandType.CREATE_GAME,
          ),
        );
      }
    });
  }

  addShips(data: any, socket: ExtendedWebsocket, server: WebSocketServer) {
    const { gameId }: { gameId: string } = JSON.parse(data.data);

    const roomPlayers = this.rooms.showRoomMembers(gameId);

    if (!roomPlayers) {
      return;
    }

    this.ships.setPlayersShips(JSON.parse(data.data));

    const ships = this.ships.getPlayersShips(gameId);

    if (ships.length != 2) {
      return;
    }

    const roomPlayerslayersId = roomPlayers.map((user) => user.id);

    const playersId = roomPlayers!.map((roomPlayer) => roomPlayer.idPlayer!);

    const newGame = this.game.createNewGame(gameId, playersId);

    const { turnId } = newGame;

    server.clients.forEach((client: ExtendedWebsocket) => {
      if (client.playerId && roomPlayerslayersId.includes(client.playerId)) {
        const playerGameId = roomPlayers.find((player) => player.id == client.playerId)?.idPlayer;
        const playersShips = this.ships.findShipsByPlayersId(playerGameId as string);

        client.send(
          websocketMessage(
            {
              ships: playersShips,
              currentPlayerIndex: playerGameId,
            },
            WebsocketCommandType.START_GAME,
          ),
        );
        client.send(websocketMessage({ currentPlayer: turnId }, WebsocketCommandType.TURN));
      }
    });
  }

  attack(data: any, socket: ExtendedWebsocket, server: WebSocketServer) {
    const attackData = JSON.parse(data.data) as AttackRequest;

    const { gameId, indexPlayer, x, y } = attackData;

    const roomPlayers = this.rooms.showRoomMembers(gameId);

    const game = this.game.getGameById(gameId);

    if (!roomPlayers || !game || indexPlayer !== game.turnId) {
      return;
    }

    const enemiesShips = this.ships.getEnemiesShipsByGameId(gameId, indexPlayer);

    if (!enemiesShips) {
      return;
    }

    const isCellAvailable = this.game.isCellAvailable(game.gameId, game.turnId, { x, y });

    if (!isCellAvailable) {
      return;
    }

    const attack = this.game.attack(attackData, enemiesShips);

    const roomPlayerslayersId = roomPlayers.map((user) => user.id);

    server.clients.forEach((client: ExtendedWebsocket) => {
      if (roomPlayerslayersId.includes(client.playerId!)) {
        attack?.forEach((attack) => {
          client.send(
            websocketMessage(
              {
                position: { ...attack?.position },
                currentPlayer: attack?.playerId,
                status: attack?.status,
              },
              WebsocketCommandType.ATTACK,
            ),
          );
        });

        client.send(
          websocketMessage(
            {
              currentPlayer: game.turnId,
            },
            WebsocketCommandType.TURN,
          ),
        );
      }
    });

    if (game.winPlayer) {
      const winnersId = roomPlayers.find((player) => player.idPlayer == game.winPlayer)?.id;

      this.players.incrementPlayerWin(winnersId!);

      const winners = this.players.showWinners();

      server.clients.forEach((client: ExtendedWebsocket) => {
        if (client.playerId && roomPlayerslayersId.includes(client.playerId)) {
          client.send(
            websocketMessage(
              {
                winPlayer: game.winPlayer,
              },
              WebsocketCommandType.FINISH,
            ),
          );
        }
        client.send(websocketMessage(winners, WebsocketCommandType.UPDATE_WINNERS));
      });
    }
  }

  randomAttack(data: any, socket: ExtendedWebsocket, server: WebSocketServer) {
    const { gameId, indexPlayer } = JSON.parse(data.data);

    const roomPlayers = this.rooms.showRoomMembers(gameId);

    if (!roomPlayers) {
      return;
    }

    const game = this.game.getGameById(gameId);

    const enemiesShips = this.ships.getEnemiesShipsByGameId(gameId, indexPlayer);

    if (!enemiesShips) {
      return;
    }

    const cell = this.game.getRandomAvailableCell(gameId, indexPlayer);

    const isCellAvailable = this.game.isCellAvailable(gameId, indexPlayer, cell);

    if (!isCellAvailable) {
      return;
    }

    const attack = this.game.attack({ gameId, indexPlayer, x: cell.x, y: cell.y }, enemiesShips);

    const roomPlayerslayersId = roomPlayers.map((user) => user.id);

    server.clients.forEach((client: ExtendedWebsocket) => {
      if (roomPlayerslayersId.includes(client.playerId!)) {
        attack?.forEach((attack) => {
          client.send(
            websocketMessage(
              {
                position: { ...attack?.position },
                currentPlayer: attack?.playerId,
                status: attack?.status,
              },
              WebsocketCommandType.ATTACK,
            ),
          );
        });

        client.send(
          websocketMessage(
            {
              currentPlayer: game?.turnId,
            },
            WebsocketCommandType.TURN,
          ),
        );
      }
    });

    if (game?.winPlayer) {
      const winnersId = roomPlayers.find((player) => player.idPlayer == game.winPlayer)?.id;

      this.players.incrementPlayerWin(winnersId!);

      const winners = this.players.showWinners();

      server.clients.forEach((client: ExtendedWebsocket) => {
        if (client.playerId && roomPlayerslayersId.includes(client.playerId)) {
          client.send(
            websocketMessage(
              {
                winPlayer: game.winPlayer,
              },
              WebsocketCommandType.FINISH,
            ),
          );
        }
        client.send(websocketMessage(winners, WebsocketCommandType.UPDATE_WINNERS));
      });
    }
  }
}
