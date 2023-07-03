# CRUD-API
This is a simple CRUD API using in-memory database underneath.

The API endpoints are:

GET api/users returns all users
GET api/users/{userId} returns a user with corresponding userId
POST api/users create a record about new user and store it in database
PUT api/users/{userId} update an existing user
DELETE api/users/{userId} delete an existing user from the database

# Start app

**1. Clone repository**

`git clone https://github.com/atcherdsd/CRUD-API.git`

**2. Change directory and branch**

`cd CRUD-API`

`git checkout dev`

**3. Install deps**

`npm i`

**4. You can use these scripts for run**

- `npm run start:dev` (run in development mode)
- `npm run start:prod` (run in production mode)
- `npm run start:multi` (run with load balancer)
- `npm run test` (run tests)

## How to use

Send your requests to the
`http://localhost:4000/api/users`

**POST** request should include body with JSON object with

- `username` - user's name (string, **required**)
- `age` - user's age (number, **required**)
- `hobbies` - user's hobbies (array of strings or empty array, **required**)

