import { WebsocketCommandType, WebsocketMessage } from './types/types';

export const websocketMessage = (data: any, type: WebsocketCommandType) => {
  const message = {
    type,
    data: JSON.stringify(data as WebsocketMessage),
    id: 0,
  };

  return JSON.stringify(message);
};
