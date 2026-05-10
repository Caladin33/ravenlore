import { supabase } from './supabase'

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

// Load all characters in campaigns where user is GM
export async function loadCampaignCharacters(userId) {
  // Get campaigns where this user is GM
  const { data: campaigns, error: campError } = await supabase
    .from('campaigns')
    .select('id, name')
    .eq('gm_id', userId)

  if (campError || !campaigns?.length) return { campaigns: [], charactersByCampaign: {} }

  const campaignIds = campaigns.map(c => c.id)

  // Get all characters in those campaigns
  const { data: chars, error: charError } = await supabase
    .from('characters')
    .select('*, owner_id')
    .in('campaign_id', campaignIds)
    .order('updated_at', { ascending: false })

  if (charError) {
    console.error('Error loading campaign characters:', charError)
    return { campaigns, charactersByCampaign: {} }
  }

  // Group by campaign
  const charactersByCampaign = {}
  campaigns.forEach(c => { charactersByCampaign[c.id] = [] })
  chars.forEach(row => {
    const char = { ...row.data, _ownerId: row.owner_id, _rowId: row.id }
    const campaignId = row.campaign_id
    if (charactersByCampaign[campaignId]) {
      charactersByCampaign[campaignId].push(char)
    }
  })

  return { campaigns, charactersByCampaign }
}

// Check if user is GM of any campaign
export async function getUserCampaigns(userId) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, name')
    .eq('gm_id', userId)

  if (error) return []
  return data || []
}

// Save a character by owner (GM saving on behalf of player)
export async function saveCharacterByOwner(character, ownerId) {
  const { data, error } = await supabase
    .from('characters')
    .upsert({
      owner_id: ownerId,
      name: character.name,
      data: character,
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

// Legacy - keep for compatibility
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

export async function isGM() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const campaigns = await getUserCampaigns(user.id)
  return campaigns.length > 0
}
// Load all campaigns (for player campaign selection)
export async function loadAllCampaigns() {
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, name, gm_id')
    .order('name')

  if (error) return []
  return data || []
}
