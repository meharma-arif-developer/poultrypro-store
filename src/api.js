const KEY = 'pp_token'
export const getToken = () => { try { return localStorage.getItem(KEY) } catch { return null } }
export const setToken = (t) => { try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY) } catch { /* ignore */ } }

async function req(method, url, body) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  const t = getToken()
  if (t) headers.Authorization = 'Bearer ' + t
  let res
  try {
    res = await fetch('/api' + url, { method, headers, body: body ? JSON.stringify(body) : undefined })
  } catch {
    throw new Error('Cannot reach the server. Is it running?')
  }
  let data = null
  try { data = await res.json() } catch { /* no body */ }
  if (!res.ok) {
    const e = new Error(data?.error || 'Something went wrong. Please try again.')
    e.status = res.status
    throw e
  }
  return data
}

export const api = {
  get: (u) => req('GET', u),
  post: (u, b) => req('POST', u, b),
  patch: (u, b) => req('PATCH', u, b),
  put: (u, b) => req('PUT', u, b),
  del: (u) => req('DELETE', u),
}
