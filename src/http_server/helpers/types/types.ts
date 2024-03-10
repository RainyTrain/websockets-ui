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
}

export type Commands = {
  [T in WebsocketCommandType]?: (...args: any[]) => unknown;
};

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
