import Websocket from 'ws';

export enum WebsocketCommandType {
  REG = 'reg',
  CREATE_GAME = 'create_game',
  START_GAME = 'start_game',
  CREATE_ROOM = 'create_room',
  TURN = 'turn',
  ATTACK = 'attack',
  FINISH = 'finish',
  UPDATE_ROOM = 'update_room',
  UPDATE_WINNERS = 'update_winners',
  ADD_USER_TO_ROOM = 'add_user_to_room',
  ADD_SHIPS = 'add_ships',
  RANDOM_ATTACK = 'randomAttack',
}

export type Commands = {
  [T in WebsocketCommandType]?: (...args: any[]) => unknown;
};

export type ExtendedWebsocket = Websocket & { playerId?: string | number };

export interface PlayerResponse {
  type: WebsocketCommandType.REG;
  data: {
    name: string;
    index: number | string;
    error: boolean;
    errorText: string;
  };
  id: 0;
}

export interface UpdateRoomResponse {
  type: WebsocketCommandType.UPDATE_ROOM;
  data: Array<{
    roomId: number | string;
    roomUsers: Array<{ name: string; index: number | string }>;
  }>;
  id: 0;
}
