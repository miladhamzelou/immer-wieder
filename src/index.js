import React, { Component, PureComponent } from 'react'
import immer from 'immer'

class RenderPure extends PureComponent {
  render() {
    const { children, ...props } = this.props
    return typeof children === 'function' ? children(props) : children
  }
}

export default function(actions) {
  const Context = React.createContext()
  const res = {
    Consumer: ({ select = props => props, children }) => {
      const fn = ({ __obj, ...rest }) => children(__obj ? rest : rest.pick)
      return (
        <Context.Consumer
          children={store => {
            const pick = select(store)
            const isObject = pick === Object(pick) && !Array.isArray(pick)
            const props = isObject ? pick : { pick }
            return <RenderPure __obj={isObject} {...props} children={fn} />
          }}
        />
      )
    },
    Provider: class Provider extends Component {
      constructor({ value }) {
        super()
        const input = value || actions
        this.state =
          typeof input === 'function'
            ? input(this.setState, this.getState)
            : input
      }
      componentDidMount() {
        this.mounted = true
      }
      componentWillUnmount() {
        this.mounted = true
      }
      getState = fn => this.mounted && super.setState({}, () => fn(this.state))
      setState = (fn, cb) =>
        this.mounted &&
        super.setState(s => (typeof fn === 'function' ? immer(s, fn) : fn), cb)
      render() {
        return (
          <Context.Provider
            value={this.state}
            children={<RenderPure children={this.props.children} />}
          />
        )
      }
    },
    hoc: (select = props => props) => Component => props => (
      <res.Consumer
        select={state => select(state, props)}
        children={selectedProps => <Component {...props} {...selectedProps} />}
      />
    ),
  }
  return res
}
