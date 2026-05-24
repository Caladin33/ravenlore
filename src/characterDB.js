import { supabase } from './supabase'

// ── CHARACTERS ────────────────────────────────────────────────────────────────

// Save or update a character
export async function saveCharacter(character, userId) {
  const { data, error } = await supabase
    .from('characters')
    .upsert({
      owner_id: userId,
      name: character.name,
      data: character,
      campaign_id: character.campaignId || null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'owner_id,name'
    })
    .select()

  if (error) {
    console.error('Error saving character:', error)
    return { error }
  }
  return { data }
}

// Load all characters for a user
export async function loadCharacters(userId) {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error loading characters:', error)
    return { error, characters: [] }
  }

  return { characters: data.map(row => row.data) }
}

// Save a character by owner (GM saving on behalf of player)
export async function saveCharacterByOwner(character, ownerId) {
  // Strip internal GM-view tracking fields before saving to DB
  const { _ownerId, _rowId, ...cleanChar } = character

  const { error } = await supabase.rpc('gm_save_character', {
    p_owner_id:    ownerId,
    p_name:        cleanChar.name,
    p_data:        cleanChar,
    p_campaign_id: cleanChar.campaignId || null,
  })

  if (error) {
    console.error('Error saving character as GM:', error)
    return { error }
  }

  return { success: true }
}

// Delete a character
export async function deleteCharacter(characterName, userId) {
  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('owner_id', userId)
    .eq('name', characterName)

  if (error) {
    console.error('Error deleting character:', error)
    return { error }
  }
  return { success: true }
}

// ── CAMPAIGNS ─────────────────────────────────────────────────────────────────

// Load all campaigns (for player campaign selection dropdown)
export async function loadAllCampaigns() {
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, name, gm_id')
    .order('name')

  if (error) return []
  return data || []
}

// Get campaigns where this user is GM
export async function getUserCampaigns(userId) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, name')
    .eq('gm_id', userId)

  if (error) return []
  return data || []
}

// Load characters in campaigns where this user is GM (regular GM view)
export async function loadCampaignCharacters(userId) {
  const { data: campaigns, error: campError } = await supabase
    .from('campaigns')
    .select('id, name, gm_id')
    .eq('gm_id', userId)

  if (campError || !campaigns?.length) return { campaigns: [], charactersByCampaign: {} }

  const campaignIds = campaigns.map(c => c.id)

  const { data: chars, error: charError } = await supabase
    .from('characters')
    .select('*, owner_id')
    .in('campaign_id', campaignIds)
    .order('updated_at', { ascending: false })

  if (charError) {
    console.error('Error loading campaign characters:', charError)
    return { campaigns, charactersByCampaign: {} }
  }

  const charactersByCampaign = {}
  campaigns.forEach(c => { charactersByCampaign[c.id] = [] })
  chars.forEach(row => {
    const char = { ...row.data, _ownerId: row.owner_id, _rowId: row.id }
    if (charactersByCampaign[row.campaign_id]) {
      charactersByCampaign[row.campaign_id].push(char)
    }
  })

  return { campaigns, charactersByCampaign }
}

// Load ALL campaigns and ALL characters — superuser only.
// Returns { myCampaigns, otherCampaigns, noCampaignChars }
// where myCampaigns and otherCampaigns are arrays of { campaign, characters[] }
export async function loadAllCampaignCharacters(userId) {
  // Fetch all campaigns
  const { data: allCampaigns, error: campError } = await supabase
    .from('campaigns')
    .select('id, name, gm_id')
    .order('name')

  if (campError) {
    console.error('Error loading all campaigns:', campError)
    return { myCampaigns: [], otherCampaigns: [], noCampaignChars: [] }
  }

  // Fetch all characters
  const { data: allChars, error: charError } = await supabase
    .from('characters')
    .select('*, owner_id')
    .order('updated_at', { ascending: false })

  if (charError) {
    console.error('Error loading all characters:', charError)
    return { myCampaigns: [], otherCampaigns: [], noCampaignChars: [] }
  }

  // Build campaign lookup and bucket characters
  const campaignMap = {}
  allCampaigns.forEach(c => { campaignMap[c.id] = { campaign: c, characters: [] } })

  const noCampaignChars = []

  allChars.forEach(row => {
    const char = { ...row.data, _ownerId: row.owner_id, _rowId: row.id }
    if (row.campaign_id && campaignMap[row.campaign_id]) {
      campaignMap[row.campaign_id].characters.push(char)
    } else {
      noCampaignChars.push(char)
    }
  })

  const myCampaigns = []
  const otherCampaigns = []

  allCampaigns.forEach(c => {
    const bucket = campaignMap[c.id]
    if (c.gm_id === userId) {
      myCampaigns.push(bucket)
    } else {
      otherCampaigns.push(bucket)
    }
  })

  return { myCampaigns, otherCampaigns, noCampaignChars }
}

// ── USER ROLE ─────────────────────────────────────────────────────────────────

// Returns 'superuser' | 'gm' | 'player'
// Superuser is detected via the profiles table role column,
// with a fallback to VITE_SUPERUSER_ID env var for bootstrapping.
export async function getUserRole(userId) {
  // Env-var fallback — set VITE_SUPERUSER_ID in your .env for the initial superuser
  if (import.meta.env.VITE_SUPERUSER_ID && userId === import.meta.env.VITE_SUPERUSER_ID) {
    return 'superuser'
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data) {
    // Fall back to GM check
    const campaigns = await getUserCampaigns(userId)
    return campaigns.length > 0 ? 'gm' : 'player'
  }

  if (data.role === 'superuser') return 'superuser'
  if (data.role === 'gm') return 'gm'

  // profiles row exists but role isn't set — fall back to campaign check
  const campaigns = await getUserCampaigns(userId)
  return campaigns.length > 0 ? 'gm' : 'player'
}

// Legacy — keep for compatibility
export async function isGM() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const campaigns = await getUserCampaigns(user.id)
  return campaigns.length > 0
}

export async function loadAllCharacters() {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error loading all characters:', error)
    return { error, characters: [] }
  }

  return { characters: data.map(row => row.data) }
}
