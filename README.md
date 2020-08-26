# MongoDB Transactions

A REST API to perform large operations on the mongodb database with flexibility to cancel the operation in between and revert the changes.

## Problem
Suppose a user uploads a huge CSV file that is parsed and inserted in mongodb. This upload can take a large amount of time. After initiating the upload, the user realizes that they uploaded the outdated file. Now there is no way to stop that ongoing upload with regular application flow.

## Implementation
To interrupt a huge operation safely(such as a large file upload) in mongodb, the application uses mongodb transactions. The transactions provice ACID functionality to the application.

- ### `server.js`
  The `server.js` file holds the main the backend logic. It is responsible to start the server on `port 3000` and has various endpoints to aid *flexibility*. The `server.js` starts its execution in the main thread and deploys a *worker thread* when it receives a csv upload request.

- ### `worker.js`<br>
  The `worker.js` contains the logic to insert csv data to mongodb database while listening for any interrupt. If the user sends a `cancel` message to the server, the worker stops the execution of the ongoing query and initiates a rollback operation.  

- ### `models/Employee.js`<br>
  This file contains Employee model used throughout the application to demostrate the functionality.

>Note: I've used employee data example as sample data for this application.

## Prerequisites
- git
- docker
- docker-compose

## Usage
- #### Clone the repo
    `git clone https://github.com/ayushjainrksh/mongodb-transactions.git`
- #### Go to the root directory
    `cd mongodb-transactions`
- #### Run docker compose
    `docker-compose up --build`

## Routes
- `GET '/ping'`: Test route
- `GET '/employee'`: To display all employee data
- `POST '/employee/createOne'`: To create a single entry in the application
- `POST '/employee/create'`: To create multiple employees by uploading a csv file of employee data
  
  ![upload csv](https://i.ibb.co/30Fc1ZP/emp-Create.png)
- `POST '/employee/create/cancel'`: To stop the ongoing upload
  
  ![upload cancel](https://i.ibb.co/JvkVXff/emp-Cancel.png)

## Tech stack
- MongoDB version: 4.4.0
- Node.js : 14.4.0
