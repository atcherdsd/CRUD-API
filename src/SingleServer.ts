import http from 'http';
import { v4 } from 'uuid';
import { IUser, Methods } from "./types/interfaces";
import { MethodsNames, StatusCodes, StatusMessages } from './types/enums';
import { PORT, endpoint } from './utilities/utils';

export class SingleServer {
  public usersDataBase: IUser[] = [];
  public port = process.env.id ? (PORT + Number(process.env.id)) : PORT;

  public server = http.createServer((request, response) => {
    try {

      switch (request.method as Methods) {
        case MethodsNames.GET:
          this.makeGet(request, response);
          break;
        case MethodsNames.POST:
          this.makePost(request, response);
          break;
        case MethodsNames.PUT:
          this.makePut(request, response);
          break;
        case MethodsNames.DELETE:
          this.makeDelete(request, response);
          break;
        default:
          throw new Error();
      }
    } catch {
      this.getErrorResponse(
        response, 
        StatusCodes.INTERNAL_SERVER_ERROR, 
        StatusMessages.ServerError
      );
    }
  });

  constructor(public processWorker?: NodeJS.Process) {}

  public start() {
    this.server.listen(this.port);
    console.log(`Server is running on ${this.port}`);
  }

  public close() {
    this.usersDataBase = [];
    this.server.close();
    process.exit();
  }

  private validateIdType(id: string) {
    return id.match(/^[\d\w]{8}-[\d\w]{4}-[\d\w]{4}-[\d\w]{4}-[\d\w]{12}$/);
  }

  private verifyEndpointExist(
    { url }: http.IncomingMessage,
    response: http.ServerResponse,
    cb: (requestedUser: IUser) => void
  ) {
    if (url?.startsWith(endpoint)) {
      const userId = url.split('/').slice(-1).toString();

      if (userId && this.validateIdType(userId)) {
        const requestedUser = this.usersDataBase.find((user) => user.id === userId);

        if (requestedUser) {
          cb(requestedUser);
        } else {
          this.getErrorResponse(
            response, 
            StatusCodes.NOT_FOUND, 
            StatusMessages.NotFound);
        }
        return;
      } else {
        this.getErrorResponse(
          response, 
          StatusCodes.BAD_REQUEST, 
          StatusMessages.WrongEndpoint,
        );
      }
      return;
    }

    this.getErrorResponse(
      response, 
      StatusCodes.NOT_FOUND, 
      StatusMessages.NotFound
    );
  }

  private verifyRequestData(
    data: Buffer[], 
    response: http.ServerResponse, 
    callback: (body: IUser) => void
  ) {
    try {
      const requestBody = JSON.parse(Buffer.concat(data).toString());
      if ('username' in requestBody 
        && 'age' in requestBody 
        && 'hobbies' in requestBody) {
        callback(requestBody);
        return;
      }
      this.getErrorResponse(
        response, 
        StatusCodes.BAD_REQUEST, 
        StatusMessages.NoRequeredData
      );
    } catch {
      this.getErrorResponse(
        response, StatusCodes.INTERNAL_SERVER_ERROR, 
        StatusMessages.ServerError
      );
    }
  }

  private getSuccessResponse(
    response: http.ServerResponse<http.IncomingMessage>, 
    statusCode: StatusCodes, 
    data?: string
    ) {
    response.setHeader('Content-Type', 'application/json');
    response.statusCode = statusCode;
    response.end(data);
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

  public makeGet(
    request: http.IncomingMessage, 
    response: http.ServerResponse
  ): void {
    if (request.url === endpoint) {
      this.getSuccessResponse(
        response, 
        StatusCodes.OK, 
        JSON.stringify(this.usersDataBase)
      );
      return;
    }
    this.verifyEndpointExist(request, response, (requestedUser?: IUser) =>
      this.getSuccessResponse(
        response, 
        StatusCodes.OK, 
        JSON.stringify(requestedUser)
      )
    );
  }

  public makePost(
    request: http.IncomingMessage, 
    response: http.ServerResponse
  ): void {
    if (request.url === endpoint) {
      const dataFromRequest: Buffer[] = [];

      request
        .on('data', (chunk: Buffer) => {
          dataFromRequest.push(chunk);
        })
        .on('end', () => {
          this.verifyRequestData(dataFromRequest, response, (body) => {
            const newUser = { ...body, id: v4() };
            this.getSuccessResponse(
              response, 
              StatusCodes.OK, 
              JSON.stringify(newUser)
            );
            this.usersDataBase.push(newUser);
          });
        });
      return;
    }
    this.getErrorResponse(
      response, 
      StatusCodes.NOT_FOUND, 
      StatusMessages.NotFound
    );
  }

  public makePut(
    request: http.IncomingMessage, 
    response: http.ServerResponse
  ): void {
    this.verifyEndpointExist(request, response, ({ id: userId }: IUser) => {
      const dataFromRequest: Buffer[] = [];
      request
        .on('data', (chunk: Buffer) => {
          dataFromRequest.push(chunk);
        })
        .on('end', () => {
          this.verifyRequestData(dataFromRequest, response, (body) => {
            const updatedUserData = { ...body, id: userId };
            this.usersDataBase = this.usersDataBase
              .map((user) => (user.id === userId ? updatedUserData : user));

            this.getSuccessResponse(
              response, 
              StatusCodes.OK, 
              JSON.stringify(updatedUserData)
            );
          });
        });
    });
  }

  public makeDelete(
    request: http.IncomingMessage,
    response: http.ServerResponse
  ): void {
    this.verifyEndpointExist(request, response, (requestedUser: IUser) => {
      this.usersDataBase = this.usersDataBase
        .filter((user) => user.id !== requestedUser.id);

      this.getSuccessResponse(
        response, 
        StatusCodes.NO_CONTENT
      );
    });
  }
}
