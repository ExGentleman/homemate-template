import { requireSupabase } from '../lib/supabase.js'

async function loadProfile(authUser) {
  const { data, error } = await requireSupabase()
    .from('profiles')
    .select('id, first_name, last_name, email, phone, role, account_type, business_name')
    .eq('id', authUser.id)
    .single()

  if (error) throw new Error(`Unable to load your account profile: ${error.message}`)
  const profile = {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    phone: data.phone,
    role: data.role,
    accountType: data.account_type,
    businessName: data.business_name
  }
  profile.displayName = profile.accountType === 'business' && profile.businessName
    ? profile.businessName
    : `${profile.firstName} ${profile.lastName}`.trim()
  return profile
}

export const authStore = {
  user: null,
  async initialize() {
    const client = requireSupabase()
    const { data, error } = await client.auth.getSession()
    if (error) throw new Error(`Unable to restore your session: ${error.message}`)

    this.user = data.session ? await loadProfile(data.session.user) : null
    client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        this.user = null
        window.dispatchEvent(new Event('auth-state-changed'))
      }
    })
  },
  async login(email, password) {
    const { data, error } = await requireSupabase().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    })
    if (error) throw new Error(error.message)
    if (!data.user) throw new Error('Sign-in did not return a user.')

    this.user = await loadProfile(data.user)
    return this.user
  },
  async signup({ accountType, businessName, firstName, lastName, email, phone, password }) {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const normalizedBusinessName = String(businessName || '').trim()
    const normalizedFirstName = String(firstName || '').trim()
    const normalizedLastName = String(lastName || '').trim()
    const normalizedPhone = String(phone || '').trim()
    if (!['individual', 'business'].includes(accountType)) {
      throw new Error('Choose an individual or business account.')
    }
    if (accountType === 'individual' && (!normalizedFirstName || !normalizedLastName)) {
      throw new Error('Enter your first and last name.')
    }
    if (accountType === 'business' && !normalizedBusinessName) {
      throw new Error('Enter your business name.')
    }
    if (!normalizedEmail) throw new Error(accountType === 'business' ? 'Enter your business email.' : 'Enter your email.')
    if (!normalizedPhone) throw new Error(accountType === 'business' ? 'Enter a business contact number.' : 'Enter a contact number.')
    if (typeof password !== 'string' || password.length < 8) {
      throw new Error('Your password must be at least 8 characters.')
    }

    const { data, error } = await requireSupabase().auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          first_name: accountType === 'individual' ? normalizedFirstName : '',
          last_name: accountType === 'individual' ? normalizedLastName : '',
          phone: normalizedPhone,
          account_type: accountType,
          business_name: accountType === 'business' ? normalizedBusinessName : ''
        }
      }
    })
    if (error) throw new Error(error.message)
    if (!data.user) {
      throw new Error('Supabase did not return a user after signup. Check the Auth logs and signup configuration.')
    }
    if (data.user.identities?.length === 0) {
      throw new Error('An account with this email may already exist. Sign in or reset your password.')
    }
    if (!data.session) return null

    this.user = await loadProfile(data.user)
    return this.user
  },
  async updateProfile({ accountType, businessName, firstName, lastName, email, phone }) {
    if (!this.user) throw new Error('Sign in to update your profile.')
    if (!['individual', 'business'].includes(accountType)) {
      throw new Error('Choose an individual or business account.')
    }
    const normalizedBusinessName = String(businessName || '').trim()
    const normalizedFirstName = String(firstName || '').trim()
    const normalizedLastName = String(lastName || '').trim()
    const normalizedPhone = String(phone || '').trim()
    if (accountType === 'individual' && (!normalizedFirstName || !normalizedLastName)) {
      throw new Error('Enter your first and last name.')
    }
    if (accountType === 'business' && !normalizedBusinessName) {
      throw new Error('Enter your business name.')
    }
    if (!normalizedPhone) throw new Error(accountType === 'business' ? 'Enter a business contact number.' : 'Enter a contact number.')

    const client = requireSupabase()
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!normalizedEmail) throw new Error(accountType === 'business' ? 'Enter your business email.' : 'Enter your email.')
    let emailChangePending = false
    if (normalizedEmail !== this.user.email.toLowerCase()) {
      const { data, error } = await client.auth.updateUser({ email: normalizedEmail })
      if (error) throw new Error(error.message)
      emailChangePending = data.user?.email?.toLowerCase() !== normalizedEmail
    }

    const { error } = await client
      .from('profiles')
      .update({
        first_name: accountType === 'individual' ? normalizedFirstName : '',
        last_name: accountType === 'individual' ? normalizedLastName : '',
        phone: normalizedPhone,
        account_type: accountType,
        business_name: accountType === 'business' ? normalizedBusinessName : ''
      })
      .eq('id', this.user.id)
    if (error) throw new Error(error.message)

    const { data: authData, error: authError } = await client.auth.getUser()
    if (authError) throw new Error(authError.message)
    this.user = await loadProfile(authData.user)
    return { user: this.user, emailChangePending }
  },
  async updatePassword({ newPassword }) {
    if (!this.user) throw new Error('Sign in to update your password.')
    const { error } = await requireSupabase().auth.updateUser({ password: newPassword })
    if (error) throw new Error(error.message)
  },
  async logout() {
    const { error } = await requireSupabase().auth.signOut()
    if (error) throw new Error(error.message)
    this.user = null
  }
}
