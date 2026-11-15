import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'
import { SCENE } from './scene.js'
import { THEME } from './theme.js'

const LOOK: ThemeSetArgs = {
  colors: THEME,
  backdrop: { scene: 'cancha', glass: { blur: 18, opacity: 0.55 } },
}

async function apply($: EngineInterface): Promise<string> {
  const set = await $.theme.set(LOOK)
  const surfaces = await $.session.surfaces()
  const drawn = set.isDrawn ? 'se está dibujando' : `no se dibuja (${set.reason})`

  return `${drawn}; pantallas: ${surfaces.join(', ') || 'ninguna'}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'azulgrana', description: 'Vuelve a aplicar el tema azulgrana y muestra su estado' })
    await apply($)

    return next(e)
  })

  on('command.run', { command: 'azulgrana' }, async $ => ({ text: `Azulgrana: ${await apply($)}` }))

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    if (e.props.scene !== 'cancha') {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    return <Svg source={SCENE} alt="Cancha de noche con torres de luz, tribuna azulgrana llena con humo de bengalas, trapos que dicen Boedo 1908, El Ciclón y Los Cuervos, y cuervos cruzando el cielo" isInteractive />
  })
}
