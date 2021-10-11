import React, { useCallback, useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'

type MapHeadElementTypes = {
  inlineScript: { text: string }
  inlineStyle: { text: string }
  link: { rel?: string; type?: string; url: string }
  script: { url: string }
}

export type HeadElement<
  T extends 'link' | 'script' | 'inlineStyle' | 'inlineScript'
> = {
  type: T
  values: MapHeadElementTypes[T]
}

export type HeadElements = (
  | HeadElement<'link' | 'script'>
  | HeadElement<'inlineStyle' | 'inlineScript'>
)[]

type Props = Omit<React.IframeHTMLAttributes<HTMLIFrameElement>, 'srcDoc'> & {
  children?: React.ReactNode
  headElements?: HeadElements
  title: string
}

type IFrameObjects = {
  document: Document | null
  window: Window | null
}

let refCallback: (node: HTMLIFrameElement | null) => void

const state = new Map<HTMLIFrameElement | null, IFrameObjects>()

export default function useIFrame(): {
  IFrame: typeof IFrameElement
  getIFrame: {
    readonly document: Document | null
    readonly window: Window | null
  }
} {
  const ref = useRef<HTMLIFrameElement | null>(null)
  const [, setState] = useState(false)
  refCallback = useCallback((node) => {
    ref.current = node
    setState((val) => !val)
  }, [])

  return {
    getIFrame: {
      get document() {
        return state.get(ref.current)?.document || null
      },
      get window() {
        return state.get(ref.current)?.window || null
      }
    },
    IFrame: IFrameElement
  }
}

function IFrameElement({ children, headElements, title, ...props }: Props) {
  const [mounted, setMounted] = useState(false)
  const [iFrameLoaded, setIFrameLoaded] = useState(false)
  const ref = useRef<HTMLIFrameElement | null>()
  const srcDoc = useRef('')
  const previousSrc = useRef<string | null | undefined>()
  const previousHeadEl = useRef<HeadElements | undefined>()
  const getDocument = (): Document | null =>
    ref.current ? ref.current.contentDocument : null
  const getWindow = (): Window | null =>
    ref.current ? ref.current.contentWindow : null
  const renderIFrameContent = (): null | React.ReactPortal[] => {
    const iFrameDoc = getDocument()
    const iFrameWin = getWindow()

    state.set(ref.current || null, {
      document: iFrameDoc,
      window: iFrameWin
    })

    if (!mounted || !iFrameDoc || !iFrameWin || props.src) return null

    const target = iFrameDoc.querySelector('main')

    if (!target) return null

    return [ReactDOM.createPortal(children, target)]
  }
  const sort = (
    obj:
      | HeadElement<'link' | 'script'>
      | HeadElement<'inlineStyle' | 'inlineScript'>
  ) => Object.fromEntries(Object.entries(obj).sort(([, a], [, b]) => a - b))
  const isSameHeadElements = () => {
    const prev = JSON.stringify(
      previousHeadEl.current?.map((headEl) => sort(headEl))
    )
    const current = JSON.stringify(headElements?.map((headEl) => sort(headEl)))

    return prev === current
  }

  if (!mounted && !props.src) {
    const newDocument =
      document.implementation.createHTMLDocument('New Document')
    try {
      newDocument.body.appendChild(newDocument.createElement('main'))
      if (headElements) {
        headElements
          .filter((item): item is HeadElement<'link' | 'script'> =>
            ['link', 'script'].includes(item.type)
          )
          .forEach((asset) => {
            const { url } = asset.values
            const element = document.createElement(asset.type)
            if (element instanceof HTMLScriptElement) {
              element.src = url
            } else if (element instanceof HTMLLinkElement) {
              element.rel =
                (asset as HeadElement<'link'>).values.rel || 'stylesheet'
              element.type =
                (asset as HeadElement<'link'>).values.type || 'text/css'
              element.href = url
            }
            newDocument.head.appendChild(element)
          })
        headElements
          .filter(
            (item): item is HeadElement<'inlineStyle'> =>
              item.type === 'inlineStyle'
          )
          .forEach(({ values: { text } }) => {
            const element = document.createElement('style')
            element.textContent = text
            newDocument.head.appendChild(element)
          })
        headElements
          .filter(
            (item): item is HeadElement<'inlineScript'> =>
              item.type === 'inlineScript'
          )
          .forEach(({ values: { text } }) => {
            const element = document.createElement('script')
            element.textContent = text
            newDocument.head.appendChild(element)
          })
      }
    } catch (error) {
      console.warn('Error: iFrame -', error)
    }

    srcDoc.current = newDocument.documentElement.innerHTML
  }

  useEffect(() => {
    let reload = false
    if (typeof previousSrc.current === 'string' && !props.src) reload = true
    if (!isSameHeadElements()) reload = true
    if (reload) {
      setMounted(false)
      setIFrameLoaded(false)
    }
    previousHeadEl.current = headElements
    previousSrc.current = props.src
  }, [props.src, headElements])

  useEffect(() => {
    const handler = () => setIFrameLoaded(true)
    const { current } = ref
    const iFrameDoc = getDocument()

    if (mounted) return

    if (iFrameDoc && iFrameDoc.readyState !== 'complete' && current) {
      current.addEventListener('load', handler)
    }

    setMounted(true)

    return () => {
      current && current.removeEventListener('load', handler)
    }
  }, [mounted])

  return (
    <iframe
      title={title}
      {...{
        ...props,
        children: undefined,
        srcDoc: props.src ? undefined : srcDoc.current
      }}
      ref={(node) => {
        ref.current = node
        if (typeof refCallback === 'function') {
          refCallback(node)
        }
      }}
      onLoad={() => !iFrameLoaded && setIFrameLoaded(true)}
    >
      {iFrameLoaded && renderIFrameContent()}
    </iframe>
  )
}

IFrameElement.displayName = 'IFrame'
