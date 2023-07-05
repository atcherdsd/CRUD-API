import http from 'http';
import cluster, { Worker } from 'cluster';
import { cpus } from 'os';
import { IUser } from './types/interfaces';
import { PORT } from './utilities/utils';
import { MethodsNames, StatusCodes, StatusMessages } from './types/enums';
import { SingleServer } from './SingleServer';

export class LoadBalancer {
  public usersDataBase: IUser[] = [];

  private workers: Worker[] = [];
  private amountOfCPUs = cpus().length;
  private workerNumber = 1;

  public balancer = http.createServer((request, response) => {
    try {
      let url = 
        `http://localhost:${PORT + this.workerNumber}${request.url}`;

      const clientRequest = http.request(
        url, 
        { method: request.method, headers: request.headers }, 
        (serverResponse) => {
        if (serverResponse.statusCode) {
          response.writeHead(
            serverResponse.statusCode, 
            serverResponse.statusMessage, 
            serverResponse.headers
          );
        }
        serverResponse.pipe(response);
      });

      request.pipe(clientRequest);

      this.workerNumber = (this.workerNumber === this.amountOfCPUs) 
      ? 1 
      : (this.workerNumber + 1);

    } catch {
      this.getErrorResponse(
        response, 
        StatusCodes.INTERNAL_SERVER_ERROR, 
        StatusMessages.ServerError
      );
    }
  });

  public start() {
    if (cluster.isPrimary) {
      this.balancer.listen(PORT);

      for (let i = 0; i < this.amountOfCPUs; i++) {
        const worker = cluster.fork({ id: i + 1 });
        worker.on('message', (message) => {
          this.updateUsersDataBase(message);
        });
        this.workers.push(worker);
      }
    } else {
      const server = new SingleServer(process);
      server.start();

      process.on('message', (usersDataBase: IUser[]) => {
        server.usersDataBase = [...usersDataBase];
      });
    }
  }

  public close() {
    this.usersDataBase = [];
    this.balancer.close();
    process.exit();
  }

  private getErrorResponse(
    response: http.ServerResponse<http.IncomingMessage>, 
    statusCode: StatusCodes,
    errorMessage: string
    ) {
    response.statusCode = statusCode;
    response.statusMessage = errorMessage;
    response.end();
  }

  private updateUsersDataBase(
    { method, data }: { method: string; data: IUser }
  ) {  
    switch(method) {
      case MethodsNames.POST:
        this.usersDataBase.push(data);
        break;
      case MethodsNames.PUT:
        this.usersDataBase = 
          this.usersDataBase
            .map((user) => (user.id === data.id ? data : user));
        break;
      case MethodsNames.DELETE:
        this.usersDataBase = 
          this.usersDataBase
            .filter((user) => user.id !== data.id);
        break;
    }

    this.workers
      .forEach((worker) => worker.send(this.usersDataBase));
  }
}
