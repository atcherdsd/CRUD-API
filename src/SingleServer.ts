import http from 'http';
import { IUser, Methods } from "./types/interfaces";
import { MethodsNames, StatusCodes, StatusMessages } from './types/enums';
import { PORT, endpoint } from './utilities/utils';

export class SingleServer {
  public usersBase: IUser[] = [];
  public port = PORT;

  public server = http.createServer((request, response) => {
    try {
      switch (request.method as Methods) {
        case MethodsNames.GET:
          this.makeGet(request, response);
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

  public start() {
    this.server.listen(this.port);
  }

  public close() {
    this.usersBase = [];
    this.server.close();
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
        const requestedUser = this.usersBase.find((user) => user.id === userId);

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
          StatusMessages.BadRequest
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

  public makeGet(request: http.IncomingMessage, response: http.ServerResponse) {
    if (request.url === endpoint) {
      this.getSuccessResponse(
        response, 
        StatusCodes.OK, 
        JSON.stringify(this.usersBase)
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
}
