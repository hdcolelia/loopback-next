// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: @loopback/repository
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Options} from '../common-types';
import {Model} from '../model';
import {Repository} from './repository';

export interface SchemaMigrationOptions extends Options {
  /**
   * When set to true, schema migration will drop existing tables and recreate
   * them from scratch, removing any existing data along the way.
   */
  rebuild?: boolean;
}

/**
 * A repository capable of database schema migration (auto-update/auto-migrate).
 */
export interface MigrateableRepository<T extends Model> extends Repository<T> {
  /**
   * Update or recreate the database schema.
   *
   * **WARNING**: By default, `migrateSchema()` will attempt to preserve data
   * while updating the schema in your target database, but this is not
   * guaranteed to be safe.
   *
   * Please check the documentation for your specific connector(s) for
   * a detailed breakdown of behaviors for automigrate!
   *
   * @param options Migration options, e.g. whether to update tables
   * preserving data or rebuild everything from scratch.
   */
  migrateSchema(options?: SchemaMigrationOptions): Promise<void>;
}

/**
 * A type guard for detecting repositories implementing MigratableRepository
 * interface.
 *
 * @param repo The repository instance to check.
 */
export function isMigrateableRepository<T extends Model = Model>(
  // tslint:disable-next-line:no-any
  repo: any,
): repo is MigrateableRepository<T> {
  return typeof repo.migrateSchema === 'function';
}
