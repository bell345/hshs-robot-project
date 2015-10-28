--
-- PostgreSQL database
--

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET client_min_messages = warning;

CREATE TABLE access_tokens (
    access_token text NOT NULL,
    user_id integer NOT NULL,
    expires timestamp without time zone NOT NULL
);

ALTER TABLE ONLY access_tokens
    ADD CONSTRAINT access_tokens_prim_key PRIMARY KEY (access_token);

CREATE TABLE users (
    id integer NOT NULL,
    username text NOT NULL,
    hash text NOT NULL
);

ALTER TABLE ONLY users
    ADD CONSTRAINT users_prim_key PRIMARY KEY (id);
