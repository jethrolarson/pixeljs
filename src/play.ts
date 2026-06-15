import { Game } from './game'
import { LevelData } from './level'
import { getLevelById } from './store'

const fallback: LevelData = {
  title: 'Plus',
  x: 5,
  y: 5,
  game: '0100001110011100010000100',
  palette: ['#0000ff'],
  bgcolor: '#dddddd',
  par: 3,
}

async function init(): Promise<void> {
  const id = new URLSearchParams(location.search).get('id')
  const level: LevelData = (id ? await getLevelById(id) : null) ?? fallback

  const game = new Game()
  game.init()
  game.start(level)
}

init()
