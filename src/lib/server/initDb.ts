// src/lib/initDb.js

import pool from "./db";


export async function initDb() {
    const client = await pool.connect();
    try {
        console.log('Initialisierung der Datenbank...');

        // ========================
        // Optional: alte Tabellen löschen (nur für Dev)
        // ========================
        await client.query(`
            DROP TABLE IF EXISTS comment_mentions, comment_likes, comments, posts, users CASCADE;
        `);

        // ========================
        // Erweiterung für UUIDs aktivieren
        // ========================
        await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

        // ========================
        // USERS
        // ========================
        await client.query(`
            CREATE TABLE users (
                user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                username VARCHAR(50) UNIQUE NOT NULL,
                full_name VARCHAR(100),
                email VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        // ========================
        // POSTS
        // ========================
        await client.query(`
            CREATE TABLE posts (
                post_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                caption TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                CONSTRAINT fk_post_user FOREIGN KEY (user_id)
                    REFERENCES users(user_id) ON DELETE CASCADE
            );
        `);
        await client.query(`CREATE INDEX idx_posts_user ON posts(user_id);`);

        // ========================
        // COMMENTS
        // ========================
        await client.query(`
            CREATE TABLE comments (
                comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                post_id UUID NOT NULL,
                user_id UUID NOT NULL,
                parent_comment_id UUID NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                CONSTRAINT fk_comment_post FOREIGN KEY (post_id)
                    REFERENCES posts(post_id) ON DELETE CASCADE,
                CONSTRAINT fk_comment_user FOREIGN KEY (user_id)
                    REFERENCES users(user_id) ON DELETE CASCADE,
                CONSTRAINT fk_parent_comment FOREIGN KEY (parent_comment_id)
                    REFERENCES comments(comment_id) ON DELETE CASCADE
            );
        `);
        await client.query(`CREATE INDEX idx_comments_post ON comments(post_id);`);
        await client.query(`CREATE INDEX idx_comments_user ON comments(user_id);`);
        await client.query(`CREATE INDEX idx_comments_parent ON comments(parent_comment_id);`);

        // ========================
        // COMMENT LIKES
        // ========================
        await client.query(`
            CREATE TABLE comment_likes (
                comment_id UUID NOT NULL,
                user_id UUID NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (comment_id, user_id),
                CONSTRAINT fk_like_comment FOREIGN KEY (comment_id)
                    REFERENCES comments(comment_id) ON DELETE CASCADE,
                CONSTRAINT fk_like_user FOREIGN KEY (user_id)
                    REFERENCES users(user_id) ON DELETE CASCADE
            );
        `);
        await client.query(`CREATE INDEX idx_comment_likes_user ON comment_likes(user_id);`);

        // ========================
        // COMMENT MENTIONS
        // ========================
        await client.query(`
            CREATE TABLE comment_mentions (
                mention_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                comment_id UUID NOT NULL,
                mentioned_user_id UUID NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                CONSTRAINT fk_mention_comment FOREIGN KEY (comment_id)
                    REFERENCES comments(comment_id) ON DELETE CASCADE,
                CONSTRAINT fk_mention_user FOREIGN KEY (mentioned_user_id)
                    REFERENCES users(user_id) ON DELETE CASCADE
            );
        `);
        await client.query(`CREATE INDEX idx_comment_mentions_comment ON comment_mentions(comment_id);`);
        await client.query(`CREATE INDEX idx_comment_mentions_user ON comment_mentions(mentioned_user_id);`);

        console.log('Datenbank erfolgreich initialisiert (UUIDs).');
    } catch (err) {
        console.error('Fehler bei der Initialisierung der DB:', err);
    } finally {
        client.release();
    }
}
