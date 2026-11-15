import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'
import { AURORA } from './scene-aurora.js'
import { CIELO } from './scene-cielo.js'
import { THEME } from './theme.js'

type Fondo = 'cielo' | 'aurora'

const FONDOS: Record<Fondo, { nombre: string; look: ThemeSetArgs }> = {
  cielo: {
    nombre: 'Cielo de Boedo',
    look: { colors: THEME, backdrop: { scene: 'cielo-boedo', glass: { blur: 14, opacity: 0.55 } } },
  },
  aurora: {
    nombre: 'Aurora azulgrana',
    look: { colors: THEME, backdrop: { scene: 'aurora', glass: { blur: 10, opacity: 0.5 } } },
  },
}

const ESCENAS: Record<string, { source: string; alt: string }> = {
  'cielo-boedo': {
    source: CIELO,
    alt: 'Cielo de noche azul con resplandor grana sobre techos de barrio, estrellas, luna y cuervos que cruzan lento',
  },
  aurora: {
    source: AURORA,
    alt: 'Manchas de luz azul, violeta y grana que flotan y se mezclan despacio sobre un fondo oscuro',
  },
}

function esFondo(valor: unknown): valor is Fondo {
  return valor === 'cielo' || valor === 'aurora'
}

async function fondoGuardado($: EngineInterface): Promise<Fondo> {
  const guardado = await $.store.get('fondo')
  return esFondo(guardado) ? guardado : 'cielo'
}

async function apply($: EngineInterface, fondo: Fondo): Promise<string> {
  const set = await $.theme.set(FONDOS[fondo].look)
  const drawn = set.isDrawn ? 'se está dibujando' : `no se dibuja (${set.reason})`
  return `${FONDOS[fondo].nombre}, ${drawn}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'azulgrana',
      description: 'Cambia el fondo: /azulgrana cielo, /azulgrana aurora, o solo /azulgrana para alternar',
    })
    await apply($, await fondoGuardado($))
    return next(e)
  })

  on('command.run', { command: 'azulgrana' }, async ($, e) => {
    const pedido = (e.args ?? '').trim().toLowerCase()
    const actual = await fondoGuardado($)
    let fondo: Fondo
    if (pedido === '') {
      fondo = actual === 'cielo' ? 'aurora' : 'cielo'
    } else if (pedido.startsWith('cielo') || pedido.startsWith('boedo')) {
      fondo = 'cielo'
    } else if (pedido.startsWith('aurora')) {
      fondo = 'aurora'
    } else {
      return { text: 'Azulgrana: no conozco ese fondo. Probá /azulgrana cielo o /azulgrana aurora.' }
    }
    await $.store.set('fondo', fondo)
    return { text: `Azulgrana: ${await apply($, fondo)}` }
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    const escena = typeof e.props.scene === 'string' ? ESCENAS[e.props.scene] : undefined
    if (!escena) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    return <Svg source={escena.source} alt={escena.alt} isInteractive />
  })
}
