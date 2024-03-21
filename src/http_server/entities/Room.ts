import { Player } from './Players';
import { v4 as uuidv4 } from 'uuid';

type RoomUser = Omit<Player, 'password' | 'wins'> & { idPlayer?: number | string };

export interface Room {
  roomId: number | string;
  gameId?: number | string;
  roomUsers: Array<RoomUser>;
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

  addUserToRoom(player: Player, id: string | number) {
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

  showRoomMembers(id: string | number) {
    const room = this.rooms.find((room) => room.roomId === id || room.gameId === id);

    if (!room) {
      return;
    }

    return room.roomUsers;
  }

  createGame(id: string | number) {
    const room = this.rooms.find((room) => room.roomId === id);

    if (room?.roomUsers.length == 2) {
      room.gameId = uuidv4();
      room.roomUsers.forEach((user) => (user.idPlayer = uuidv4()));

      return room;
    }
  }
}
