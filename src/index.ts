import http from 'http';
import { StatusCodes } from './types/enums';
import { PORT } from './utilities/utils';

const server = http.createServer((request, response) => {

  response.statusCode = StatusCodes.OK;
  if(request.url === '/') {
    response.setHeader("Content-Type", "application/json");
    const message = 'From the server';
    response.write(message);
  }
  
  response.end();
});

server.listen(PORT, () => console.log(`Server is running on ${PORT}`));
