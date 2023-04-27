# Backend Task

## Documentation

- [Requirements](/docs/Requirements.md)
- [Development Plan](/docs/Development_Plan.md)
- [API](https://www.postman.com/joint-operations-administrator-8259820/workspace/public/collection/21698543-440806bd-d14f-4063-b9fd-365b87be4809?action=share&creator=21698543)

## Installation

```bash
  npm install
```

## Change file name

```string
.env.example -> .env
```

## Running the application

  ```bash
  # run containers
  npm run docker:up

  # run prisma migration
  npm run prisma:migrate
  ```

## Direct database manipulations

  ```bash
  # open prisma studio
  npm run prisma:studio
  ```

## Test

```bash
# unit tests
  npm run test

# e2e tests
  npm run test:e2e

# test coverage
  npm run test:cov
```
