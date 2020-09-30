import React from 'react'
import Frame, { FrameContextConsumer } from 'react-frame-component'

import ComponentRenderer from './component-renderer'

import Editor from './editor'

window.component = null

class Wrapper extends React.Component {
  constructor(props) {
    super(props)
    window.component = window.component || {}
    this.iframeRef = React.createRef()
    this.handleChange = this.handleChange.bind(this)
    let { example } = props
    example = example || 'return (<div>Example</div>)'
    this.state = {
      example,
      height: 200,
    }
    this.executeScript(example)
  }

  componentDidMount() {
    this.heightInterval = setInterval(() => {
      this.computeHeight()
    }, 1000)
  }

  componentDidUpdate() {
    this.computeHeight()
  }

  componentWillUnmount() {
    clearInterval(this.heightInterval)
  }

  executeScript(source) {
    const { uniqId } = this.props
    const script = document.createElement('script')
    const self = this
    script.onload = script.onerror = function () {
      this.remove()
      self.setState(state => ({
        ...state,
        component: window.component[uniqId] || '',
      }))
    }
    const wrapper = `window.component['${uniqId}'] = (() => {
      ${Object.keys(reactComponents).map(k => `const ${k} = reactComponents['${k}'];`).join('\n')}
      ${Object.keys(Components).map(k => `const ${k} = Components['${k}'];`).join('\n')}
      try {
        ${source}
      } catch (error) {
        console.log(error)
      }
    })()`
    try {
      const src = Babel.transform(wrapper, { presets: ['react', 'es2015'] }).code
      script.src = `data:text/plain;base64,${btoa(src)}`
    } catch (error) {
      console.log(error)
    }

    document.body.appendChild(script)
  }

  handleChange(code) {
    this.executeScript(code)
    this.setState(state => ({
      ...state,
      example: code,
    }))
  }

  computeHeight() {
    const { height } = this.state
    const padding = 5 // buffer for any unstyled margins
    if (
      this.iframeRef.current
      && this.iframeRef.current.node.contentDocument
      && this.iframeRef.current.node.contentDocument.body.offsetHeight !== 0
      && this.iframeRef.current.node.contentDocument.body.offsetHeight !== (height - padding)
    ) {
      this.setState({
        height: this.iframeRef.current.node.contentDocument.body.offsetHeight + padding,
      })
    }
  }

  render() {
    const { component, height } = this.state
    return (
      <div>
        <Frame
          className="component-wrapper"
          ref={this.iframeRef}
          style={{ width: '100%', height }}
          onLoad={this.computeHeight()}
        >
          <link type="text/css" rel="stylesheet" href="./build/entry.css" />
          <FrameContextConsumer>
            {
              frameContext => (
                <ComponentRenderer frameContext={frameContext}>
                  {component}
                </ComponentRenderer>
              )
            }
          </FrameContextConsumer>
        </Frame>
        <div className="field editor-preview">
          <Editor value={this.state.example} onChange={code => this.handleChange(code)} />
        </div>
      </div>
    )
  }
}

export default props => (
  <Wrapper {...props} />
)
