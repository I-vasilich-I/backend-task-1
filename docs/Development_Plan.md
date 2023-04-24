# Development Plan

## Base Project setup

| Component | Technologies|
|---|:---|
|Programming language | Typescript |
|Database | Postgresql |
|Backend API Docs | Postman |
|Backend | NestJS, Prisma ORM |
|Container tool | Docker |
|Testing | Jest |

**Deadline: `24.04.2022`**

---

## Mailer module

- Service to send mail

**Deadline: `25.04.2022`**

---

## User module

- `GET /api/v1/users` - get all users;
- `GET /api/v1/users/{id}` - get user by id;
- `PUT /api/v1/users/{id}` - update user by id;
- `DELETE /api/v1/users/{id}` - delete user by id;
- `POST /api/v1/users/generate` - generate `PDF` and store it in user;

  *Create user route moved to auth module as sign up*

**Deadline: `26.04.2022`**

---

## Auth module

- `POST /api/v1/auth/signup` - register user and get pair of tokens(at, rt), set refreshToken cookie;
- `POST /api/v1/auth/signin` - authorize user and get pair of tokens(at, rt), set refreshToken cookie;
- `GET /api/v1/auth/refresh` - get new pair of tokens(at, rt) from rt, set refreshToken cookie;
- `PUT /api/v1/auth/reset` - generate code, store code in user entity, send email to user with the link to reset password form containing generated code;
- `PUT /api/v1/auth/update/{code}` - update user password;
- `GET /api/v1/auth/logout` - set refreshToken to `null`, clear refreshToken cookie;

**Deadline: `28.04.2022`**

**NOTE:**

- the final app might differ from the planned features
