import React, { Component } from 'react'

export class NumberInput extends Component {
    constructor(props) {
      super(props)
    
      this.state = {
      }
    }

    render() {
        return (
            <div className="mb-3 mx-3" style={{width: "50%"}}>
                <label className="form-label" htmlFor={this.props.id}>{this.props.label} {this.props.required ? '*' : ''}</label>
                <div className="input-group number-input">
                    <input onChange={() => this.props.validInput(this.props.id)} id={this.props.id} type="number" className="form-control" placeholder={this.props.placeholder ?? this.props.label} aria-label={this.props.label} />
                </div>
            </div>
        )
    }
}

export default NumberInput