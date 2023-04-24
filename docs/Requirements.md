# Requirements

## Technologies Stack

| Component | Technologies|
|---|:---|
|Programming language | TypeScript |
|Database | Relational database |
|Backend | Node.js Framework + ORM |
|Container tool | Docker |

## Database. User table (required fields)

- email,
- firstName,
- lastName,
- image(string),
- pdf(binary),

## Authentication

The App should include authentication.

## User module

- Image upload
- `CRUD` operations
- `POST` request(contains email in the body) to generate `PDF` and store it into database (User table). Should return result as a `boolean` field(true/false) in `JSON`

## General

- The App(Database & Backend) should run inside of a `Docker` container
- Source code should be stored on the `GitHub`
