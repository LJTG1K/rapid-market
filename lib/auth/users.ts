/**
 * Supabase data helpers for accounts + wishlist. Server-only (imports the
 * service-role client). Shared by the auth and wishlist API routes.
 */
import { getSupabase } from '../supabase';

export interface DbUser {
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
  sugargoo_user_id: string | null;
  created_at: string;
}

/** Public-safe user shape (never includes password_hash). */
export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
}

export interface WishlistRow {
  product_id: string;
  category: string;
}

export function toPublicUser(u: DbUser): PublicUser {
  return { id: u.id, email: u.email, name: u.name };
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const { data, error } = await getSupabase()
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error) throw error;
  return (data as DbUser) ?? null;
}

export async function findUserById(id: string): Promise<DbUser | null> {
  const { data, error } = await getSupabase()
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return (data as DbUser) ?? null;
}

/**
 * Creates (or updates, on email conflict) a user row and returns it. Upsert so a
 * pre-existing Sugargoo email — e.g. re-registering, or a facebook-lead that
 * already has a row — doesn't error.
 */
export async function createUser(params: {
  email: string;
  passwordHash: string;
  name?: string | null;
  sugargooUserId?: string | null;
}): Promise<DbUser> {
  const { data, error } = await getSupabase()
    .from('users')
    .upsert(
      {
        email: params.email.toLowerCase(),
        password_hash: params.passwordHash,
        name: params.name ?? null,
        sugargoo_user_id: params.sugargooUserId ?? null,
      },
      { onConflict: 'email' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as DbUser;
}

export async function getWishlist(userId: string): Promise<WishlistRow[]> {
  const { data, error } = await getSupabase()
    .from('wishlist_items')
    .select('product_id, category')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as WishlistRow[]) ?? [];
}

export async function addWishlistItem(
  userId: string,
  productId: string,
  category: string
): Promise<void> {
  const { error } = await getSupabase()
    .from('wishlist_items')
    .upsert(
      { user_id: userId, product_id: productId, category },
      { onConflict: 'user_id,product_id,category', ignoreDuplicates: true }
    );

  if (error) throw error;
}

export async function removeWishlistItem(
  userId: string,
  productId: string,
  category: string
): Promise<void> {
  const { error } = await getSupabase()
    .from('wishlist_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)
    .eq('category', category);

  if (error) throw error;
}
