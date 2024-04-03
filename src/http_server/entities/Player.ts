export interface Player {
  id: string | number;
  name: string;
  password: string;
  wins?: number;
}

export class Players {
  players: Array<Player>;

  constructor() {
    this.players = [];
  }

  createPlayer(data: Player) {
    try {
      const player = this.players.find((player) => player.id == data.id);

      if (player) {
        return player;
      }

      const newPlayer: Player = { ...data, wins: 0 };

      this.players.push(newPlayer);

      return newPlayer;
    } catch (error) {
      return new Error('Error while creating player');
    }
  }

  deleteUser(id: string | number) {
    try {
      const index = this.players.findIndex((player) => player.id === id);

      if (!index) {
        throw new Error('User does not exist');
      }

      this.players.splice(index, 1);
    } catch (error) {
      return error as Error;
    }
  }

  showWinners() {
    return this.players.sort((a, b) => a.wins! + b.wins!);
  }

  getPlayerById(id: string | number) {
    try {
      const player = this.players.find((player) => player.id === id);

      if (!player) {
        throw new Error('Player does not exist');
      }

      return player;
    } catch (error) {
      return error as Error;
    }
  }

  incrementPlayerWin(id: string | number) {
    try {
      const player = this.getPlayerById(id);

      if (!player || player instanceof Error) {
        throw new Error('Player does not exist');
      }

      player.wins!++;
    } catch (error) {
      return error as Error;
    }
  }
}
