import { Player } from './Players';
import { v4 as uuidv4 } from 'uuid';

interface Room {
  roomId: string;
  roomUsers: Array<Omit<Player, 'password' | 'wins'>>;
}

export class Rooms {
  rooms: Array<Room>;

  constructor() {
    this.rooms = [];
  }

  createRoom() {
    const room: Room = { roomId: uuidv4(), roomUsers: [] };

    this.rooms.push(room);

    return room;
  }

  addUserToRoom(player: Player, id: string) {
    const room = this.rooms.find((room) => room.roomId === id);

    if (room && room.roomUsers.length < 2) {
      room.roomUsers.push(player);
    } else {
      throw new Error('Room does not exist or has already 2 players');
    }
  }

  showAvailableRooms() {
    const rooms = this.rooms.filter((room) => room.roomUsers.length < 2);

    return rooms;
  }
}
