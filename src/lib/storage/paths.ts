export function sanitizeFilename(name: string): string {
  const base = name.replace(/[^A-Za-z0-9._-]+/g, '-')
  // prevent hidden files and collapse dashes
  return base.replace(/-+/g, '-').replace(/^[-.]+/, '').slice(0, 255)
}

export function buildWorldFilePath(
  worldId: string,
  filename: string,
  opts?: { kind?: string; prefix?: string }
): string {
  const kind = (opts?.kind || 'uploads').replace(/[^A-Za-z0-9._-]+/g, '-').toLowerCase()
  const safe = sanitizeFilename(filename || 'file')
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const rand = Math.random().toString(36).slice(2, 8)
  const prefix = opts?.prefix ? `${opts.prefix.replace(/[^A-Za-z0-9._-]+/g, '-')}/` : ''
  return `world/${worldId}/${kind}/${prefix}${ts}-${rand}-${safe}`
}

