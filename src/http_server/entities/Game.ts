import { Ship } from './Ships';

export type AttackRequest = {
  gameId: number | string;
  x: number;
  y: number;
  indexPlayer: number | string;
};

type Position = {
  x: number;
  y: number;
};

type Attack = {
  playerId: number | string;
  status: 'miss' | 'killed' | 'shot';
  position?: Position;
};

interface GameStatus {
  gameId: number | string;
  status: 'start' | 'continue' | 'finish';
  turnId?: number | string;
  players: Array<string | number>;
  attacksStatus: Array<Attack>;
  winPlayer?: number | string;
}

export class Game {
  games: Array<GameStatus>;

  constructor() {
    this.games = [];
  }

  createNewGame(id: number | string, playersId: Array<string | number>) {
    const game: GameStatus = {
      gameId: id,
      status: 'start',
      attacksStatus: [],
      players: playersId,
    };

    game.turnId = this.setTurn(game.status, playersId, game.turnId);

    this.games.push(game);

    return game;
  }

  setTurn(
    status: 'start' | 'continue' | 'finish',
    playersId: Array<string | number>,
    activeTurn?: string | number,
  ) {
    console.log(status, 'status');

    if (status === 'start') {
      const index = Math.round(Math.random());

      return playersId[index];
    }

    switch (activeTurn) {
      case playersId[0]:
        return playersId[1];

      case playersId[1]:
        return playersId[0];
    }
  }

  attack(data: AttackRequest, ships: Array<Ship>) {
    let game = this.games.find((game) => game.gameId == data.gameId);

    if (!game) {
      return;
    }

    const attacks: Array<{
      playerId: string | number;
      status: 'miss' | 'killed' | 'shot';
      position: Position;
    }> = [];

    let status: 'miss' | 'killed' | 'shot' = 'miss';

    for (let index = 0; index < ships.length; index++) {
      let {
        direction,
        length,
        position: { x, y },
      } = ships[index];

      if (
        (direction && x == data.x && data.y >= y && data.y <= y + length - 1) ||
        (y == data.y && data.x >= x && data.x <= x + length)
      ) {
        ships[index].health! = ships[index].health! - 1;
        status = ships[index].health! > 0 ? 'shot' : 'killed';

        if (status === 'killed') {
          const cells = this.cellsArounsShip(ships[index]);

          ships.splice(index, 1);

          cells.forEach((cell) => {
            if (this.isCellAvailable(game?.gameId!, game?.turnId!, cell)) {
              game?.attacksStatus.push({
                playerId: data.indexPlayer,
                status: 'miss',
                position: cell,
              });

              attacks.push({
                playerId: data.indexPlayer,
                status: 'miss',
                position: cell,
              });
            }
          });
        }

        break;
      }
    }

    const attack = {
      playerId: data.indexPlayer,
      position: { x: data.x, y: data.y },
      status: status,
    };

    game.attacksStatus = [...game.attacksStatus, attack];

    const gameStatus =
      this.getNumberOfKilledShips(data.gameId, data.indexPlayer)?.length === 10
        ? 'finish'
        : 'continue';

    game.status = gameStatus;
    game.winPlayer = gameStatus === 'finish' ? data.indexPlayer : undefined;
    game.turnId =
      status == 'shot' || status == 'killed'
        ? data.indexPlayer
        : this.setTurn(game.status, game.players, data.indexPlayer);

    return [...attacks, attack];
  }

  cellsArounsShip(ship: Ship) {
    const positions: Array<Position> = [];

    const x = ship.position.x;
    const y = ship.position.y;
    const direction = ship.direction;
    const shipLength = ship.length;

    for (let i = 0; i <= 9; i++) {
      for (let j = 0; j <= 9; j++) {
        if (!direction) {
          if (i >= x - 1 && i <= x + shipLength && j >= y - 1 && j <= y + 1) {
            if (!(i >= x && i <= x + shipLength - 1 && y == j)) {
              positions.push({ x: i, y: j });
            }
          }
        } else {
          if (j >= y - 1 && j <= y + shipLength && i >= x - 1 && i <= x + 1) {
            if (!(j >= y && j <= y + shipLength - 1 && x == i)) {
              positions.push({ x: i, y: j });
            }
          }
        }
      }
    }

    return positions;
  }

  getNumberOfKilledShips(gameId: string | number, playerId: string | number) {
    return this.games
      .find((game) => game.gameId === gameId)
      ?.attacksStatus.filter((attackStatus) => {
        return attackStatus.playerId === playerId && attackStatus.status === 'killed';
      });
  }

  getGameById(id: string | number) {
    return this.games.find((game) => game.gameId === id);
  }

  isCellAvailable(gameId: string | number, playerId: string | number, position: Position) {
    const game = this.getGameById(gameId);

    if (!game) {
      return;
    }

    const cell = game.attacksStatus.find(
      (attackStatus) =>
        attackStatus.playerId === playerId &&
        attackStatus.position?.x === position.x &&
        attackStatus.position?.y === position.y,
    );

    return cell ? false : true;
  }

  // @ts-ignore
  getRandomAvailableCell(gameId: string | number, playerId: string | number): Position {
    const x = Math.round(Math.random() * 9);
    const y = Math.round(Math.random() * 9);

    if (this.isCellAvailable(gameId, playerId, { x, y })) {
      return { x, y } as Position;
    } else {
      return this.getRandomAvailableCell(gameId, playerId);
    }
  }
}
