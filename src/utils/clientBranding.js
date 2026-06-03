const brandingPresets = {
  ALPHA: {
    logoText: 'A',
    tag: 'Metalurgia de campo',
    gradient: 'from-cyan-400 via-sky-500 to-blue-700',
    glow: 'shadow-[0_20px_60px_rgba(14,165,233,0.18)]',
  },
  BETA: {
    logoText: 'B',
    tag: 'Linha critica industrial',
    gradient: 'from-emerald-400 via-teal-500 to-cyan-700',
    glow: 'shadow-[0_20px_60px_rgba(16,185,129,0.18)]',
  },
}

export function getClientBranding(client) {
  const preset = brandingPresets[client.code] || {}
  const initials = client.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return {
    logoDataUrl: client.logoDataUrl || '',
    logoText: preset.logoText || initials || 'CL',
    tag: preset.tag || 'Conta operacional',
    gradient: preset.gradient || 'from-violet-400 via-fuchsia-500 to-indigo-700',
    glow: preset.glow || 'shadow-[0_20px_60px_rgba(129,140,248,0.18)]',
  }
}
