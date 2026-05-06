import { supabase } from './supabase'

// Save or update a character
export async function saveCharacter(character, userId) {
  const { data, error } = await supabase
    .from('characters')
    .upsert({
      owner_id: userId,
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

// Load all characters (GM only)
export async function loadAllCharacters() {
  const { data, error } = await supabase
    .from('characters')
    .select('*, profiles(username)')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error loading all characters:', error)
    return { error, characters: [] }
  }

  return { characters: data.map(row => ({ ...row.data, _owner: row.profiles?.username })) }
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

// Check if current user is GM
export async function isGM() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('profiles')
    .select('is_gm')
    .eq('id', user.id)
    .single()

  return data?.is_gm || false
}