# mongodb-transactions

A REST API to perform large operations on the mongodb database. The endpoints support uploading large data through transactions and optional rollbacks in case of failure.

## Implementation
The server.js file holds all the backend logic. The server is started on port 3000 and has various endpoints to provide flexible functionality. I am using an organization with employee data as an example.


- GET '/': Test route
- GET '/employees': To display all employee data
- POST '/employee/create': To insert employee data(upload data)
- POST '/employee/abort': To stop the current upload

## Tech stack
MongoDB version: 4.4.0
Node.js : 14.4.0