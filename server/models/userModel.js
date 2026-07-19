import pool from "../database.js";

export async function getAllUsers() {
  const result = await pool.query(
    `
    SELECT
      id,
      username
    FROM users
    ORDER BY username ASC
    `
  );

  return result.rows;
}

export async function findUserByEmail(email) {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  return result.rows[0];
}

export async function findUserById(id) {
  const result = await pool.query(
    `
    SELECT
      id,
      username,
      email,
      created_at,
      updated_at
    FROM users
    WHERE id = $1
    `,
    [id]
  );

  return result.rows[0];
}

export async function createUser(username, email, passwordHash) {
  const result = await pool.query(
    `
    INSERT INTO users (username, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING
      id,
      username,
      email,
      created_at,
      updated_at
    `,
    [username, email, passwordHash]
  );

  return result.rows[0];
}

export async function updateUserById(id, username, email) {
  const result = await pool.query(
    `
    UPDATE users
    SET
      username = $1,
      email = $2,
      updated_at = NOW()
    WHERE id = $3
    RETURNING
      id,
      username,
      email,
      created_at,
      updated_at
    `,
    [username, email, id]
  );

  return result.rows[0];
}

export async function updateUserPasswordById(
  id,
  passwordHash
) {
  const result = await pool.query(
    `
    UPDATE users
    SET
      password_hash = $1,
      updated_at = NOW()
    WHERE id = $2
    RETURNING
      id,
      username,
      email,
      created_at,
      updated_at
    `,
    [passwordHash, id]
  );

  return result.rows[0];
}

export async function deleteUserById(id) {
  const result = await pool.query(
    `
    DELETE FROM users
    WHERE id = $1
    RETURNING
      id,
      username,
      email
    `,
    [id]
  );

  return result.rows[0];
}