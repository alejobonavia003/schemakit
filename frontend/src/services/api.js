const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`La API respondió con el estado ${response.status}`)
  }

  return response.json()
}

export async function getExamples() {
  const result = await request('/examples')
  return result.data
}
