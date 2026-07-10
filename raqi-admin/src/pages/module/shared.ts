export function getId(entity: { _id?: string; id?: string }) {
  return entity._id ?? entity.id ?? '';
}

export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? '';
