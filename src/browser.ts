import { getLevels, deleteLevel } from './store'
import { levelToDataURL } from './util'
import { signIn, signOut_, onAuth, currentUser } from './auth'
import { LevelData } from './level'

function card(level: LevelData, uid: string | null): string {
  const thumb = levelToDataURL(level)
  const title = level.title ?? 'Untitled'
  const canEdit = uid !== null
  return `
    <div class="level-card">
      <a href="/play.html?id=${level.id}" class="thumb-link">
        <img src="${thumb}" alt="${title}" class="thumb"/>
      </a>
      <div class="card-info">
        <span class="card-title">${title}</span>
        <div class="card-actions">
          <a href="/play.html?id=${level.id}" class="btn">Play</a>
          ${canEdit ? `<a href="/edit.html?id=${level.id}" class="btn">Edit</a>` : ''}
          ${canEdit ? `<button class="btn btn-delete" data-id="${level.id}">Delete</button>` : ''}
        </div>
      </div>
    </div>`
}

async function render(uid: string | null): Promise<void> {
  const container = document.getElementById('levels')!
  container.innerHTML = '<p class="empty">Loading…</p>'
  const levels = await getLevels()
  if (levels.length === 0) {
    container.innerHTML = '<p class="empty">No levels yet. <a href="/edit.html">Create one!</a></p>'
    return
  }
  container.innerHTML = levels.map(l => card(l, uid)).join('')
  container.querySelectorAll<HTMLButtonElement>('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const titleEl = btn.closest('.level-card')?.querySelector('.card-title')
      if (confirm(`Delete "${titleEl?.textContent}"?`)) {
        await deleteLevel(btn.dataset.id!)
        render(uid)
      }
    })
  })
}

function updateAuthUI(uid: string | null): void {
  const authBtn = document.getElementById('auth-btn')!
  const newBtn = document.getElementById('new-btn')!
  if (uid) {
    authBtn.textContent = 'Sign out'
    authBtn.onclick = () => signOut_()
    newBtn.style.display = ''
  } else {
    authBtn.textContent = 'Sign in'
    authBtn.onclick = () => signIn()
    newBtn.style.display = 'none'
  }
}

onAuth(user => {
  const uid = user?.uid ?? null
  updateAuthUI(uid)
  render(uid)
})
