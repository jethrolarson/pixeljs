import { Game } from './game'
import { LevelData } from './level'
import { getLevelById, saveLevel } from './store'
import { onAuth, signIn, currentUser } from './auth'

const defaultLevel: LevelData = {
  title: 'New Level',
  x: 10,
  y: 10,
  game: '0'.repeat(100),
  palette: ['#0000ff'],
  bgcolor: '#dddddd',
  par: 3,
}

async function init(): Promise<void> {
  const params = new URLSearchParams(location.search)
  let currentId: string | null = params.get('id')
  const returnPackId: string | null = params.get('pack')
  const initialLevel: LevelData = (currentId ? await getLevelById(currentId) : null) ?? defaultLevel

  if (returnPackId) {
    const back = document.getElementById('back-link')
    if (back) {
      back.setAttribute('href', `/pack-edit.html?id=${returnPackId}`)
      back.textContent = '← Back to pack'
    }
  }

  const game = new Game()
  game.init()
  game.edit()
  game.start(initialLevel)

  const saveBtn = document.getElementById('save-btn')!

  onAuth(user => {
    saveBtn.style.display = user ? '' : 'none'
    document.getElementById('signin-msg')?.style.setProperty('display', user ? 'none' : '')
  })

  saveBtn.addEventListener('click', async () => {
    const user = currentUser()
    if (!user) { signIn(); return }
    const saved = await saveLevel({ ...game.getLevelData(), id: currentId ?? undefined }, user.uid)
    currentId = saved.id!
    document.title = saved.title ?? 'Edit Level'
    if (returnPackId) {
      // Came from the pack editor — hand the new level back and return.
      location.href = `/pack-edit.html?id=${returnPackId}&add=${currentId}`
      return
    }
    history.replaceState(null, '', `?id=${currentId}`)
  })
}

init()
