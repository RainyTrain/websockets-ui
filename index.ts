import { httpServer } from './src/http_server/index';
import { WebsocketServerClass } from './src/http_server/app/websocketServer';

const HTTP_PORT = 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

const App = new WebsocketServerClass();
