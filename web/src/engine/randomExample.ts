export function randomExample(id: 'array' | 'linked' | 'tree' | 'graph') {
  const values = Array.from({ length: 6 }, (_, i) => i)
  for (let i = values.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [values[i], values[j]] = [values[j], values[i]] }
  return { input: values.join(', '), edges: id === 'graph' ? '0-1, 0-2, 1-3, 1-4, 2-5' : undefined }
}
