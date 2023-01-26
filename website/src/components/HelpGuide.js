import React, { Component } from 'react'

import * as DOMPurify from 'dompurify';
import { marked } from 'marked'

export class HelpGuide extends Component {
    constructor(props) {
        super(props)

        this.state = {
            helpGuide: undefined,
        }
    }

    componentDidMount() {
        fetch('https://raw.githubusercontent.com/niemasd/GEMF/master/README.md')
        .then(result => result.text())
        .then(text => {
            const splitREADME = text.replace(/(?=(\n##\s|\n#\s))/g, "--SPLIT--").split("--SPLIT--");
            let helpGuide = splitREADME.filter(section => section.startsWith("\n## Input File Formats") || section.startsWith("\n## Output File Formats"))
            helpGuide = DOMPurify.sanitize(marked.parse(helpGuide.join("")))
            helpGuide = helpGuide.replace(/<a href="((?!https).[^>]{0,})">/, '<a href="https://github.com/niemasd/GEMF/blob/master/$1">');
            helpGuide = helpGuide.replace(/<a (href=".[^>]{0,}")>/, '<a target="_blank" $1>')
            this.setState({helpGuide})
        }) 
    }

    render() {
        return (
            <div id="help-guide">
                {this.state.helpGuide &&
                <div>
                    <h1 className="mb-5 w-100 text-center">About This Tool</h1>
                    <div className="markdown markdown-body" dangerouslySetInnerHTML={{ __html: this.state.helpGuide }} />
                </div>
                }
            </div>
        )
    }
}

export default HelpGuide