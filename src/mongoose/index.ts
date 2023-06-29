/* eslint-disable no-restricted-syntax, no-await-in-loop */
import type { ConnectOptions } from 'mongoose';
import fs from 'fs';
import type { DatabaseAdapter, Migration } from '../database/types';
import { connect } from './connect';
import { init } from './init';
import { webpack } from './webpack';
import { CollectionModel } from '../collections/config/types';
import { queryDrafts } from './queryDrafts';
import { GlobalModel } from '../globals/config/types';
import { find } from './find';
import { create } from './create';
import { findVersions } from './findVersions';
import { findGlobalVersions } from './findGlobalVersions';
import type { Payload } from '../index';
import { migrate } from '../database/migrations/migrate';
import { migrateDown } from '../database/migrations/migrateDown';
import { migrateRefresh } from '../database/migrations/migrateRefresh';
import { migrateReset } from '../database/migrations/migrateReset';
import { migrateStatus } from '../database/migrations/migrateStatus';
import { migrationTemplate } from '../database/migrations/migrationTemplate';


export interface Args {
  payload: Payload;
  /** The URL to connect to MongoDB */
  url: string;
  connectOptions?: ConnectOptions & {
    /** Set false to disable $facet aggregation in non-supporting databases, Defaults to true */
    useFacet?: boolean;
  };
}

export type MongooseAdapter = DatabaseAdapter &
  Args & {
    mongoMemoryServer: any;
    collections: {
      [slug: string]: CollectionModel;
    };
    globals: GlobalModel;
    versions: {
      [slug: string]: CollectionModel;
    };
  };

export function mongooseAdapter({
  payload,
  url,
  connectOptions,
}: Args): MongooseAdapter {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return {
    payload,
    url,
    connectOptions: connectOptions || {},
    collections: {},
    versions: {},
    connect,
    init,
    webpack,
    migrate,
    migrateStatus,
    migrateDown,
    migrateRefresh,
    migrateReset,
    migrateFresh: async () => null,
    migrationDir: '.migrations',
    async createMigration(adapter, migrationName) {
      const migrationDir = adapter.migrationDir || '.migrations'; // TODO: Verify path after linking
      if (!fs.existsSync(migrationDir)) {
        fs.mkdirSync(migrationDir);
      }

      const [yyymmdd, hhmmss] = new Date().toISOString().split('T');
      const formattedDate = yyymmdd.replace(/\D/g, '');
      const formattedTime = hhmmss.split('.')[0].replace(/\D/g, '');

      const timestamp = `${formattedDate}_${formattedTime}`;

      const formattedName = migrationName.replace(/\W/g, '_');
      const fileName = `${timestamp}_${formattedName}.ts`;
      const filePath = `${migrationDir}/${fileName}`;
      fs.writeFileSync(
        filePath,
        migrationTemplate,
      );
      payload.logger.info({ msg: `Migration created at ${filePath}` });
    },
    transaction: async () => true,
    beginTransaction: async () => true,
    rollbackTransaction: async () => true,
    commitTransaction: async () => true,
    queryDrafts,
    find,
    findVersions,
    findGlobalVersions,
    create,
  };
}
