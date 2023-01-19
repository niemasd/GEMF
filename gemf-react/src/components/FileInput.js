import React, { Component } from 'react'

export class FileInput extends Component {
    constructor(props) {
      super(props)
    
        this.state = {
        }
    }

    render() {
        return (
        <div className="mb-3 mx-3 file-input" style={{minWidth: "35%"}}>
            <label htmlFor={this.props.id} className="form-label">{this.props.label} File *</label>
            <input onChange={() => this.props.validInput(this.props.id)} type="file" id={this.props.id} name={this.props.id} className="form-control fileUpload" />
        </div>
        )
    }
}

export default FileInput