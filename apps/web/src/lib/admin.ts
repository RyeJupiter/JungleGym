export const ADMIN_EMAILS = ['rye.seekins@gmail.com', 'davis@earthpulse.dev']

/** Cookie name for the admin "preview all videos" override. */
export const ADMIN_PREVIEW_COOKIE = 'jg_admin_preview'

/** Returns true if the user is a JungleGym admin (hardcoded list or site_admins table). */
export async function checkIsAdmin(
  email: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<boolean> {
  if (ADMIN_EMAILS.includes(email)) return true
  try {
    const { data } = await supabase
      .from('site_admins')
      .select('email')
      .eq('email', email)
      .maybeSingle()
    return !!data
  } catch {
    return false
  }
}
