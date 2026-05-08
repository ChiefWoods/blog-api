# Blog API

![Preview](preview.png)

Blog site for [The Odin Project](https://www.theodinproject.com/).

[Source Repository](https://github.com/ChiefWoods/blog-api)

## Features

- View published posts
- Leave user comments
- Manage posts as an admin

## Built With

### Tech Stack

- [![Next.js](https://img.shields.io/badge/Nextjs-383936?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
- [![Prisma](https://img.shields.io/badge/Prisma-383936?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
- [![Shadcn](https://img.shields.io/badge/Shadcn-383936?style=for-the-badge&logo=shadcnui)](https://ui.shadcn.com/)
- [![Vitest](https://img.shields.io/badge/Vitest-383936?style=for-the-badge&logo=vitest)](https://vitest.dev)
- [![Playwright](https://img.shields.io/badge/Playwright-383936?style=for-the-badge&logo=playwright)](https://playwright.dev/)
- [![Docker](https://img.shields.io/badge/Docker-383936?style=for-the-badge&logo=docker)](https://www.docker.com/)

## Getting Started

### Prerequisites

Update your Bun toolkit to the latest version.Respo

```bash
bun upgrade
```

### Setup

1. Clone the repository

```bash
git clone https://github.com/ChiefWoods/blog-api.git
```

2. Install all dependencies

```bash
bun install
```

3. Create env file

```bash
cp .env.example .env.development
```

4. Start local Postgres (dev)

```bash
bun run docker:db:up
```

5. Apply migrations

```bash
bun run db:migrate
```

6. Generate Prisma client

```bash
bun run db:generate
```

7. Start development server

```bash
bun run dev
```

8. Build project

```bash
bun run build
```

9. Preview build

```bash
bun run start
```

### Testing

1. Create env file

```bash
cp .env.example .env.test
```

2. Setup Playwright

```bash
bun run test:e2e:install
```

2. Start local Postgres (test)

```bash
bun run docker:test-db:up
```

3. Test project

```bash
bun run test:unit
bun run test:dom
bun run test:e2e
```

## Issues

View the [open issues](https://github.com/ChiefWoods/blog-api/issues) for a full list of proposed features and known bugs.

## Acknowledgements

### Resources

- [Shields.io](https://shields.io/)
- [Lucide](https://lucide.dev/)

## Contact

[chii.yuen@hotmail.com](mailto:chii.yuen@hotmail.com)
