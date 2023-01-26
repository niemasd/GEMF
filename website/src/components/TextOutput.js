import React, { Component } from 'react'

export class TextOutput extends Component {
    getText = () => {
        if (!this.props.text) {
            return '';
        }

        if (this.props.text.length <= 10000) {
            return this.props.text;
        }

        return `${this.props.text.substring(0, 10000)} ...\n10,000 characters displayed, ${this.props.text.length - 10000} characters more`;
    }


    render() {
        const text = this.getText();
        
        return (
            <div className="output my-3">
                {this.props.label && 
                <h3 className="w-100 text-center">{this.props.label} &nbsp;
                    <input className="form-check-input my-1" type="checkbox" checked={this.props.downloadFile} id={this.props.id} onChange={this.props.toggleDownloadFile} />
                </h3>
                }
                <textarea id={this.props.id} className="form-control" readOnly value={text} />
            </div>
        )
    }
}

export default TextOutput