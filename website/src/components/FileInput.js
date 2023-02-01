import React, { Component } from 'react'

export class FileInput extends Component {
    constructor(props) {
      super(props)
    
        this.state = {
            fileTextShown: false,
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.fileText !== undefined && prevProps.fileText === undefined) {
            this.setState({fileTextShown: true})
        }
    } 

    updateFile = (e) => {
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
            if (this.props.summary) { 
                this.props.setFileText(this.props.id, this.props.summary(e.target.result));
            } else {
                this.props.setFileText(this.props.id, e.target.result);
            }
        }

        fileReader.readAsText(e.target.files[0])

        this.props.validInput(this.props.id);
    }

    toggleFileText = () => {
        if (this.props.fileText) {
            this.setState(prevState => {return {fileTextShown: !prevState.fileTextShown}})
        }
    }

    getFileText = () => {
        if (!this.props.fileText) {
            return '';
        }

        if (this.props.fileText.length <= 1000) {
            return this.props.fileText;
        }

        return `${this.props.fileText.substring(0, 1000)} ...\n1,000 characters displayed, ${this.props.fileText.length - 1000} characters more`;
    }

    render() {
        const fileText = this.getFileText();

        return (
        <div className="mb-3 mx-3 file-input" style={{minWidth: "60%"}}>
            <label htmlFor={this.props.id} className="form-label">{this.props.label} File *</label>
            <div className="input-group">
                <input id={this.props.id} className="form-control fileUpload" type="file" name={this.props.id} onClick={(e) => e.target.value = null} onChange={this.updateFile}/>
                {(this.props.preview || this.props.summary) &&
                <div className="input-group-append">
                    <button className="btn btn-outline-secondary" type="button" onClick={this.toggleFileText}>
                        File {this.props.preview ? 'Preview' : 'Summary'} &nbsp;
                        <i className={`bi bi-caret-${this.state.fileTextShown ? 'up' : 'down'}`} />
                    </button>
                </div>}
            </div>
            <textarea style={{display: this.props.fileText && this.state.fileTextShown ? 'block': 'none'}} id={this.props.id + "File"} className="form-control my-3 file-preview" readOnly value={fileText} />
        </div>
        )
    }
}

export default FileInput