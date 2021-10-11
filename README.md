# react-use-iframe

> iframe hook

[![NPM](https://img.shields.io/npm/v/react-use-iframe.svg)](https://www.npmjs.com/package/react-use-iframe) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save react-use-iframe
```

## Usage

```tsx
import React from 'react'

import useIFrame from 'react-use-iframe'

const App = () => {
  const { IFrame, getIFrame } = useIFrame()
  console.log({
    iFrameWindow: getIFrame.window,
    iFrameDocument: getIFrame.document
  })

  return (
    <IFrame
      headElements={[
        {
          type: 'inlineStyle',
          values: {
            text: 'body { background: #fed136 }'
          }
        }
      ]}
      title='Test'
    >
      <p>iFrame</p>
    </IFrame>
  )
}
```

## License

MIT © [marcoSven](https://github.com/marcoSven)
