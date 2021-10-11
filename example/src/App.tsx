import React, { useReducer } from 'react'

import useIFrame, { HeadElements } from 'react-use-iframe'

type Action =
  | { type: 'count' }
  | { type: 'loadCSS' }
  | { type: 'reset' }
  | { type: 'show'; payload: boolean }

type State = {
  count: number
  loadCSS: boolean
  show: boolean
}

const initialState = { count: 0, loadCSS: false, show: false }

const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { IFrame, getIFrame } = useIFrame()
  const click = () => {
    const body = getIFrame.document?.querySelector('body')
    if (!body) return
    body.style.background = state.count % 2 === 0 ? '#36d6fe' : '#38c593'
    dispatch({ type: 'count' })
  }
  const useSrc = state.count % 3 === 0 && state.count !== 0
  const headElements: HeadElements = [
    {
      type: 'inlineStyle',
      values: {
        text: 'body { background: #fed136 }'
      }
    }
  ]
  if (state.loadCSS) {
    headElements.push({
      type: 'link' as const,
      values: {
        url: 'https://cdn.jsdelivr.net/npm/picnic'
      }
    })
  }

  return (
    <div>
      {state.show && (
        <IFrame
          src={useSrc ? 'https://www.youtube.com/embed/G393z8s8nFY' : undefined}
          headElements={headElements}
          title='Test'
        >
          <div>
            <p>{`${state.count} button click${
              state.count === 1 ? '' : 's'
            }`}</p>
            <button onClick={click}>Continue Clicking</button>
          </div>
        </IFrame>
      )}
      <section>
        {!state.show ? (
          <button onClick={() => dispatch({ type: 'show', payload: true })}>
            Load iFrame
          </button>
        ) : (
          <>
            <p>{`Count: ${state.count} | CSS loaded in iFrame: ${
              state.loadCSS ? 'TRUE' : 'FALSE'
            }`}</p>
            <button onClick={click}>Continue Clicking</button>{' '}
            <button onClick={() => dispatch({ type: 'loadCSS' })}>
              Toggle CSS
            </button>{' '}
            <button
              className='error'
              onClick={() => {
                dispatch({ type: 'reset' })
              }}
            >
              Reset
            </button>
          </>
        )}
      </section>
    </div>
  )
}

function reducer(state: State, action: Action) {
  switch (action.type) {
    case 'count':
      return {
        ...state,
        count: state.count + 1
      }
    case 'loadCSS':
      return {
        ...state,
        loadCSS: !state.loadCSS
      }
    case 'reset':
      return {
        ...state,
        show: false,
        count: 0
      }
    case 'show':
      return {
        ...state,
        show: action.payload
      }
    default:
      return state
  }
}

export default App
