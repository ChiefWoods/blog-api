FROM oven/bun:1.3.13 AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN bun ci

FROM oven/bun:1.3.13 AS production-dependencies-env
COPY ./package.json bun.lock /app/
WORKDIR /app
RUN bun ci --production --ignore-scripts

FROM oven/bun:1.3.13 AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
# Prisma generate only needs a syntactically valid URL at build time.
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
RUN bun run db:generate
RUN bun run build

FROM oven/bun:1.3.13
COPY ./package.json bun.lock /app/
COPY ./next.config.mjs /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/.next /app/.next
COPY --from=build-env /app/public /app/public
WORKDIR /app
CMD ["sh", "-c", "bun run start -- -p ${PORT:-4000}"]
