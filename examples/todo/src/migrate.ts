// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: @loopback/example-todo
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {TodoListApplication} from './application';

export async function migrate(args: string[]) {
  const dropExistingSchema = args.includes('--rebuild');
  console.log(
    'Migrating schemas (%s)',
    dropExistingSchema ? 'rebuild' : 'update',
  );

  const app = new TodoListApplication();
  await app.boot();
  await app.migrateSchema({dropExistingSchema});

  // Connectors usually keep a pool of opened connections,
  // this keeps the process running even after all works is done.
  // We need to exit explicitly.
  process.exit(0);
}

migrate(process.argv).catch(err => {
  console.error('Cannot migrate database schema', err);
  process.exit(1);
});
