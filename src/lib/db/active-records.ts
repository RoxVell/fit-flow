/** Syncable entities use deletedAt for tombstones; hide them from UI reads. */
export function isActiveRecord<T extends { deletedAt?: string }>(
  entity: T | undefined | null
): entity is T {
  return entity != null && !entity.deletedAt;
}

export function withoutDeleted<T extends { deletedAt?: string }>(items: T[]): T[] {
  return items.filter(isActiveRecord);
}
