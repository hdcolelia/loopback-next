// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: @loopback/example-todo
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

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
