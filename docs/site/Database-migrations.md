---
lang: en
title: 'Database Migrations'
keywords: LoopBack 4.0
sidebar: lb4_sidebar
permalink: /doc/en/lb4/Database-migrations.html
---

## Overview

In LoopBack, auto-migration helps the user create relational database schemas
based on definitions of their models. Auto-migration can facilitate the
synchronization of the backing database and models so that they match, such as
in cases where the database needs to be changed in order to match the models.
LoopBack offers two ways to do this:

- **Auto-migrate**: Drop schema objects if they already exist and re-create them
  based on model definitions. Existing data will be lost.

- **Auto-update**: Change database schema objects if there is a difference
  between the objects and model definitions. Existing data will be kept.

{% include warning.html content="Auto-update will attempt to preserve data while
updating the schema in your target database, but this is not guaranteed to be
safe.

Please check the documentation for your specific connector(s) for a detailed
breakdown of behaviors for automigrate! " %}

## Examples

LoopBack applications are typically using `RepositoryMixin` to enhance the core
`Application` class with additional repository-related APIs. One of such methods
is `migrateSchema`, which iterates over all registered repositories and asks
them to migrate their schema. Repositories that do not support schema migrations
are silently skipped.

### Auto-update database at start

To automatically update the database schema whenever the application is started,
modify your main script to execute `app.migrateSchema()` after the application
was bootstrapped (all repositories were registered) but before it is actually
started.

{% include code-caption.html content="src/index.ts" %}

```ts
export async function main(options: ApplicationConfig = {}) {
  const app = new TodoListApplication(options);
  await app.boot();
  await app.migrateSchema();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);

  return app;
}
```

### Auto-update the database explicitly

It's usually better to have more control about the database migration and
trigger the updates explicitly. To do so, you can implement a custom script as
shown below.

{% include code-caption.html content="src/migrate.ts" %}

```ts
import {TodoListApplication} from './application';

export async function migrate(args: string[]) {
  const rebuild = args.includes('--rebuild');
  console.log('Migrating schemas (%s)', rebuild ? 'rebuild' : 'update');

  const app = new TodoListApplication();
  await app.boot();
  await app.migrateSchema({rebuild});
}

migrate(process.argv).catch(err => {
  console.error('Cannot migrate database schema', err);
  process.exit(1);
});
```

After you have compiled your application via `npm run build`, you can update
your database by running `node dist/src/migrate` and rebuild it from scratch by
running `node dist/src/migrate --rebuild`. It is also possible to save this
commands as `npm` scripts in your `package.json` file.

In the future, we would like to provide finer-grained control of database schema
updates, learn more in the GitHub issue
[#487 Database Migration Management Framework](https://github.com/strongloop/loopback-next/issues/487)
