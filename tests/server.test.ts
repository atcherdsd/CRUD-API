import * as dotenv from 'dotenv';
dotenv.config();
import request from 'supertest';
import { SingleServer } from '../src/SingleServer';
import assert from 'assert';

const endpoint = `/api/users`;
const mockedId = '8888888a-444a-a444-4a44-55555555555q';
const wrongId = 'wrong id';
const mockedUserData = {
  id: mockedId,
  username: 'Tom',
  age: '26',
  hobbies: [],
};
const mockedUpdatedUserData = {
  id: mockedId,
  username: 'Tomas',
  age: '26',
  hobbies: ['running'],
};

const serverInstance = new SingleServer();
jest.mock('uuid', () => ({ v4: () => mockedId }));

describe('should get, create, update and delete user data', () => {
  afterAll((done) => {
    serverInstance.close();
    done();
  });

  it('should get data of all users', async () => {
    await request(serverInstance.server)
      .get(endpoint)
      .expect(200)
      .expect('Content-Type', 'application/json')
      .expect([]);
  });
  it('should create user', async () => {
    await request(serverInstance.server)
      .post(endpoint)
      .send(mockedUserData)
      .expect(201)
      .expect((res) => {
        assert(res.body.hasOwnProperty('username'));
        assert(res.body.hasOwnProperty('age'));
        assert(res.body.hasOwnProperty('hobbies'));
      });
  });
  it('should get user data', async () => {
    await request(serverInstance.server)
      .get(endpoint + `/${mockedId}`)
      .expect(200)
      .expect(mockedUserData);
  });
  it('should update user data', async () => {
    await request(serverInstance.server)
      .put(endpoint + `/${mockedId}`)
      .send(mockedUpdatedUserData)
      .expect(200)
      .expect(mockedUpdatedUserData);
  });
  it('should delete user data', async () => {
    await request(serverInstance.server)
      .delete(endpoint + `/${mockedId}`)
      .send(mockedUpdatedUserData)
      .expect(204);
  });
});

describe('should throw client errors', () => {
  afterAll((done) => {
    serverInstance.close();
    done();
  });

  it("should throw an error with code 400 when request doesn't contain required data", async () => {
    await request(serverInstance.server)
      .post(endpoint)
      .send({
        username: 'Paul',
        hobbies: ['drawing'],
      })
      .expect(400);
  });

  it('should throw an error with code 400 when userId is incorrect', async () => {
    await request(serverInstance.server)
      .delete(endpoint + `/${wrongId}`)
      .send(mockedUpdatedUserData)
      .expect(400);
  });
});

describe('should throw server errors', () => {
  afterAll((done) => {
    serverInstance.close();
    done();
  });

  it('should return 500', async () => {
    const mockGetData = jest.spyOn(serverInstance, 'makePost').mockImplementation(() => {
      throw new Error('Errors on the server side');
    });

    await request(serverInstance.server).post(endpoint).send(mockedUserData).expect(500);
    mockGetData.mockClear();
  });
});
