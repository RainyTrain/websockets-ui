export interface Player {
  id: string | number;
  name: string;
  password: string;
  wins: number;
}

export class Players {
  players: Array<Player>;

  constructor() {
    this.players = [];
  }

  createPlayer(data: Player) {
    if (!this.players.some((player) => player.id === data.id)) {
      const player: Player = { ...data };
      this.players.push(player);

      return player;
    }
  }

  deleteUser(id: string | number) {
    const index = this.players.findIndex((player) => player.id === id);
    if (index) {
      this.players.splice(index, 1);
    }
  }

  showWinners() {
    return this.players.sort((a, b) => a.wins + b.wins);
  }

  getPlayerById(id: string | number) {
    const player = this.players.find((player) => player.id === id);

    return player;
  }
}
