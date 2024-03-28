type ShipType = 'small' | 'medium' | 'large' | 'huge';

export interface Ship {
  position: { x: number; y: number };
  direction: boolean;
  length: number;
  health?: number;
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
    playersShips.ships.forEach((ship) => (ship.health = ship.length));

    this.ships.push(playersShips);
  }

  findShipsByPlayersId(id: string | number) {
    return this.ships.find((ship) => ship.indexPlayer === id)?.ships;
  }

  getPlayersShipsByGameId(id: string | number) {
    const ships = this.ships.filter((ship) => ship.gameId === id);

    return ships;
  }
}
