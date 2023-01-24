import React, { Component } from 'react'

export class TextOutput extends Component {
  render() {
        return (
            <div className="output my-3">
                <h3 className="w-100 text-center">{this.props.label}</h3>
                <textarea id={this.props.id} className="form-control" readOnly value={this.props.text}></textarea>
            </div>
        )
    }
}

export default TextOutput