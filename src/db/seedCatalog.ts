import { catalog, CATALOG_VERSION } from '../data/catalog';
import { db } from './database';

export async function seedCatalog(): Promise<void> {
  const version = await db.settings.get('catalogVersion');
  if (version?.value === CATALOG_VERSION) return;

  await db.transaction('rw', db.problems, db.settings, async () => {
    await db.problems.bulkPut(catalog);
    await db.settings.put({ key: 'catalogVersion', value: CATALOG_VERSION });
  });
}
