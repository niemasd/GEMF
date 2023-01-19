import React, { Component } from 'react'
import FileInput from './components/FileInput'
import NumberInput from './components/NumberInput'
import CheckboxInput from './components/CheckboxInput'
import TextOutput from './components/TextOutput'

import { SITE_HOST, FILE_INPUTS, NUMBER_INPUTS, CHECKBOX_INPUTS } from './Constants'

import './App.scss';

export class App extends Component {
	constructor(props) {
		super(props)

		this.state = {
		}
	}

	componentDidMount() {
	}

	runGEMFFavites = () => {
		if (!this.allInputsValid()) {
			return;
		}
	}

	allInputsValid = () => {
		let valid = true;

		for (const input of [...FILE_INPUTS, ...NUMBER_INPUTS]) {
			if (!this.validInput(input.id)) {
				valid = false;
			}
		}

		return valid;
	}

	validInput = (id) => {
		// checking if file is valid
		if (FILE_INPUTS.map(input => input.id).includes(id)) {
			const input = document.getElementById(id);
			if (input.value !== "") {
				input.classList.remove("border");
				input.classList.remove("border-danger");
				return true;
			} else {
				input.classList.add("border");
				input.classList.add("border-danger");
				return false;
			}
		}
		// checking if number is valid
		else {
			const input = document.getElementById(id);
			const inputData = NUMBER_INPUTS.find(input => input.id === id);
			if ((input.value === "" && !inputData.required) || (input.value !== "" && parseInt(input.value) >= 0)) {
				input.classList.remove("border");
				input.classList.remove("border-danger");
				return true;
			} else {
				input.classList.add("border");
				input.classList.add("border-danger");
				return false;
			}
		}
	}

  	render() {
		return (
		<div className="App">
			<h1 className="my-5 text-center">GEMF FAVITES Online Tool</h1>
			<div id="input-container" className="mb-5 d-flex flex-column align-items-center">
				<div className="d-flex flex-wrap justify-content-center">
					{FILE_INPUTS.map(input => 
					<FileInput
					key={input.id}
					id={input.id}
					label={input.label}
					validInput={this.validInput}
					/>)}
				</div>
				<div className="d-flex flex-wrap justify-content-center">
					{NUMBER_INPUTS.map(input => 
					<NumberInput
					key={input.id}
					id={input.id}
					label={input.label}
					required={input.required}
					placeholder={input.placeholder}
					validInput={this.validInput}
					/>)}
				</div>
				<div className="d-flex flex-column align-items-center mt-4">
					{CHECKBOX_INPUTS.map(input => 
					<CheckboxInput
					key={input.id}
					id={input.id}
					label={input.label}
					/>)}
				</div>
				<p>* Required</p>
			</div>
			<div id="action-container" className="d-flex flex-column align-items-center">
				<button type="button" className="btn btn-primary mb-4" onClick={this.runGEMFFavites}>RUN GEMF_FAVITES</button>
				<button type="button" className="btn btn-success" onClick={this.downloadResults}>Download Results</button>
			</div>
			<div id="output-container" className="d-flex flex-wrap justify-content-around mt-5 mb-5 w-100">
				<TextOutput id="console" label="Console"/>
				<TextOutput id="finalResults" label="Final Results (Output.txt)"/>
				<TextOutput id="transNetwork" label="Transmission Network Results"/>
				<TextOutput id="allTransitions" label="All State Transitions Results"/>
			</div>
		</div>
		)
  	}
}

export default App;