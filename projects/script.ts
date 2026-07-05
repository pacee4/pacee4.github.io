interface ProjectDirectoryEntry {
    name: string,
    src: string,
    thumb_src?: string,
    date_published: string,
    date_updated?: string,

    details?: {
        description?: string,
        how_to_play?: string, // обратная поддержка для game_directory.json
        how_to_use?: string,
        credits?: string
    }
}
