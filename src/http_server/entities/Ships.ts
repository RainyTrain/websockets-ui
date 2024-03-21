type ShipDirection = 'horizontal' | 'vertical';

type ShipType = 'small' | 'medium' | 'large' | 'huge';

interface Ship {
  position: { x: number; y: number };
  direction: ShipDirection;
  length: number;
  type: ShipType;
}

interface PlayersShips {
  indexPlayer: string | number;
  gameId: string | number;
  ships: Array<Ship>;
}

export class Ships {
  ships: Array<PlayersShips>;

  constructor() {
    this.ships = [];
  }

  setPlayersShips(playersShips: PlayersShips) {
    this.ships.push(playersShips);
  }

  findShipsByPlayersId(id: string) {
    return this.ships.find((ship) => ship.indexPlayer === id)?.ships;
  }

  getPlayersShipsByGameId(id: string | number) {
    const ships = this.ships.filter((ship) => ship.gameId === id);

    return ships;
  }
}
