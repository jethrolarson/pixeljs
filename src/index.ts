import { mount } from '@fun-land/fun-web'
import { Home } from './Views/Home'
import './theme.css'

mount(Home, {}, document.getElementById('root')!)

if (import.meta.env.DEV) import('./dev/seed').catch(err => console.error('[seed] load failed', err))
