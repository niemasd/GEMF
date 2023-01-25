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
            this.props.setFileText(this.props.id, e.target.result);
        }

        fileReader.readAsText(e.target.files[0])

        this.props.validInput(this.props.id);
    }

    toggleFileText = () => {
        if (this.props.fileText) {
            this.setState(prevState => {return {fileTextShown: !prevState.fileTextShown}})
        }
    }

    render() {
        return (
        <div className="mb-3 mx-3 file-input" style={{minWidth: "60%"}}>
            <label htmlFor={this.props.id} className="form-label">{this.props.label} File *</label>
            <div className="input-group">
                <input id={this.props.id} className="form-control fileUpload" type="file" name={this.props.id} onClick={(e) => e.target.value = null} onChange={this.updateFile}/>
                <div className="input-group-append">
                    <button className="btn btn-outline-secondary" type="button" onClick={this.toggleFileText}>
                        File Preview &nbsp;
                        <i className={`bi bi-caret-${this.state.fileTextShown ? 'up' : 'down'}`} />
                    </button>
                </div>
            </div>
            {this.props.fileText && this.state.fileTextShown && <textarea id={this.props.id + "File"} className="form-control my-3 file-preview" readOnly value={this.props.fileText} />}
        </div>
        )
    }
}

export default FileInput