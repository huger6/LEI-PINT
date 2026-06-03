// This is the edge function used in supabase to delete all files from /temp folder after 24 hours
/*

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('URL_SUPABASE') ?? '',
    Deno.env.get('SERVICE_ROLE_KEY_SUPABASE') ?? ''
  )

  const bucketName = 'public-assets'
  const folderPath = 'temp'

  // List files in /temp folder
  const { data: files, error: listError } = await supabase.storage
    .from(bucketName)
    .list(folderPath)

  if (listError) return new Response(JSON.stringify({ error: listError.message }), { status: 500 })

  const now = Date.now()
  const twentyFourHoursInMs = 24 * 60 * 60 * 1000
  const filesToDelete: string[] = []

  // Filter files with 24h+
  files.forEach((file) => {
    const fileAge = now - new Date(file.created_at).getTime()
    if (fileAge > twentyFourHoursInMs) {
      filesToDelete.push(`${folderPath}/${file.name}`)
    }
  })

  // Delete old files
  if (filesToDelete.length > 0) {
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove(filesToDelete)
      
    if (deleteError) return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ deleted: filesToDelete.length }), { status: 200 })
})

*/