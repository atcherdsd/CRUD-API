export enum StatusCodes {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500
}

export enum MethodsNames {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
}

export enum StatusMessages {
  ServerError = 'Internal server error. The requested action could not be performed',
  NotFound = 'The user with the requested id does not exist',
  BadRequest = 'Requested user id is not valid (not uuid)',
  NoRequeredData = 'Request does not contain required data',
  WrongEndpoint = 'The requested path does not exist',
}
