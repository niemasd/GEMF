import React, { Component } from 'react'

export class CheckboxInput extends Component {
    render() {
        return (
        <div className="form-check mb-3">
            <input className="form-check-input" type="checkbox" value="" id={this.props.id} />
            <label className="form-check-label" htmlFor={this.props.id}>
                {this.props.label}
            </label>
        </div>
        )
    }
}

export default CheckboxInput