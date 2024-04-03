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

export interface RegResponse {
  data: {
    name: string;
    index: string | number;
    error: boolean;
    errorText: string;
  };
}

export interface UpdateWinnersResponse {
  data: Array<{ name: string; wins: number }>;
}

export interface CreateGameResponse {
  data: { idGame: string | number; idPlayer: string | number };
}

export interface UpdateRoomResponse {
  data: Array<{
    roomId: number | string;
    roomUsers: Array<{ name: string; index: number | string }>;
  }>;
}

export interface StartGameResponse {
  data: {
    ships: Array<{
      position: { x: number; y: number };
      direction: boolean;
      length: number;
      type: 'small' | 'medium' | 'large' | 'huge';
    }>;
  };
}

export interface AttackResponse {
  data: {
    ships: Array<{
      position: { x: number; y: number };
      direction: boolean;
      length: number;
      type: 'small' | 'medium' | 'large' | 'huge';
    }>;
  };
}

export interface TurnResponse {
  data: { currentPlayer: string | number };
}

export interface FinishResponse {
  data: { winPlayer: string | number };
}

export type WebsocketMessage =
  | RegResponse
  | UpdateWinnersResponse
  | CreateGameResponse
  | UpdateRoomResponse
  | StartGameResponse
  | AttackResponse
  | TurnResponse
  | FinishResponse;
