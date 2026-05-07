import { randomUUID } from "node:crypto";
import { Pool } from "pg";

type CreateUserInput = {
  email: string;
  username: string;
  name: string;
  isAdmin?: boolean;
};

type CreatePostInput = {
  authorId: string;
  title: string;
  slug: string;
  published: boolean;
  excerpt?: string | null;
};

let pool: Pool | null = null;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required for Playwright E2E tests.");
}

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
    });
  }

  return pool;
}

function lexicalContent(text: string) {
  return {
    root: {
      type: "root",
      version: 1,
      format: "",
      indent: 0,
      direction: null,
      children: [
        {
          type: "paragraph",
          version: 1,
          format: "",
          indent: 0,
          direction: null,
          textFormat: 0,
          textStyle: "",
          children: [
            {
              type: "text",
              version: 1,
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text,
            },
          ],
        },
      ],
    },
  };
}

export async function resetDatabase() {
  const client = await getPool().connect();
  try {
    await client.query(
      'TRUNCATE TABLE "Comment", "Post", "session", "account", "verification", "user" RESTART IDENTITY CASCADE',
    );
  } finally {
    client.release();
  }
}

export async function createUser({ email, username, name, isAdmin = false }: CreateUserInput) {
  const client = await getPool().connect();
  const now = new Date();

  try {
    const result = await client.query<{ id: string }>(
      `INSERT INTO "user" ("id", "name", "username", "displayUsername", "email", "emailVerified", "isAdmin", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING "id"`,
      [randomUUID(), name, username, username, email, true, isAdmin, now, now],
    );

    return result.rows[0].id;
  } finally {
    client.release();
  }
}

export async function createPost({
  authorId,
  title,
  slug,
  published,
  excerpt = null,
}: CreatePostInput) {
  const client = await getPool().connect();
  const now = new Date();

  try {
    const result = await client.query<{ id: string }>(
      `INSERT INTO "Post" (
        "id", "title", "slug", "excerpt", "contentJson", "published", "publishedAt", "createdAt", "updatedAt", "authorId"
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10)
      RETURNING "id"`,
      [
        randomUUID(),
        title,
        slug,
        excerpt,
        JSON.stringify(lexicalContent(`${title} body`)),
        published,
        published ? now : null,
        now,
        now,
        authorId,
      ],
    );

    return result.rows[0].id;
  } finally {
    client.release();
  }
}

export async function setUserAdminByEmail(email: string, isAdmin = true) {
  const client = await getPool().connect();
  try {
    await client.query(`UPDATE "user" SET "isAdmin" = $1, "updatedAt" = $2 WHERE "email" = $3`, [
      isAdmin,
      new Date(),
      email,
    ]);
  } finally {
    client.release();
  }
}

export async function getUserIdByEmail(email: string) {
  const client = await getPool().connect();

  try {
    const result = await client.query<{ id: string }>(
      `SELECT "id" FROM "user" WHERE "email" = $1 LIMIT 1`,
      [email],
    );

    return result.rows[0]?.id ?? null;
  } finally {
    client.release();
  }
}

export async function seedPublicPosts() {
  const authorId = await createUser({
    email: "seed-author@example.com",
    username: "seed_author",
    name: "Seed Author",
    isAdmin: true,
  });

  await createPost({
    authorId,
    title: "Published E2E Post",
    slug: "published-e2e-post",
    published: true,
    excerpt: "Published excerpt",
  });

  await createPost({
    authorId,
    title: "Draft E2E Post",
    slug: "draft-e2e-post",
    published: false,
    excerpt: "Draft excerpt",
  });
}
