import React, { Component } from 'react'

import FileInput from './components/FileInput'
import NumberInput from './components/NumberInput'
import CheckboxInput from './components/CheckboxInput'
import TextOutput from './components/TextOutput'

import { SITE_HOST, FILE_INPUTS, NUMBER_INPUTS, CHECKBOX_INPUTS, PATH_TO_PYODIDE_ROOT } from './Constants'
import './App.scss';

export class App extends Component {
	constructor(props) {
		super(props)

		this.state = {
			pyodide: undefined,
			gemfModule: undefined,
			consoleText: '',
			finalResultsText: '',
			transNetworkText: '',
			allTransText: '',
		}

		this.runGEMFFavites = this.runGEMFFavites.bind(this);
		this.initializePyodide = this.initializePyodide.bind(this);
	}
	
	initializeGEMF = () => {
		return new Promise((resolve, reject) => {
			this.setState(prevState => ({consoleText: prevState.consoleText += "Initializing GEMF...\n"}))
			window.createModule({
				print: (text) => {
					this.setState(prevState => ({consoleText: prevState.consoleText += "GEMF stdout: \t" + text + "\n"}))
					// on GEMF finish
					if (text.includes("simulation success!")) {
						const FS = this.state.gemfModule.FS;
						const pyodide = this.state.pyodide;
						const finalResults = new TextDecoder().decode(FS.readFile('output.txt'));
						this.setState({finalResultsText: finalResults})
						pyodide.FS.writeFile(PATH_TO_PYODIDE_ROOT + "/output/output.txt", finalResults);
					}
				},
				printErr: (text) => {
					this.setState(prevState => ({consoleText: prevState.consoleText += "GEMF stderr: \t" + text + "\n"}))
				}
			}).then((Module) => {
				this.setState({gemfModule: Module}, resolve)
			})
		})
	}

	initializePyodide = () => {
		return new Promise(async (resolve, reject) => {
			this.setState(prevState => ({consoleText: prevState.consoleText += "Initializing Pyodide...\n"}))
			this.setState({pyodide: await window.loadPyodide({
				indexURL : "https://cdn.jsdelivr.net/pyodide/v0.22.0/full/",
				stdout: (text) => {
					this.setState(prevState => ({consoleText: prevState.consoleText += "GEMF_FAVITES stdout: \t" + text + "\n"}))
				},
				stderr: (text) => {
					this.setState(prevState => ({consoleText: prevState.consoleText += "GEMF_FAVITES stderr: \t" + text + "\n"}))
				}
			})}, resolve);
		})
	}

	async runGEMFFavites() {
		const writeFile = this.writeFile;

		if (!this.allInputsValid()) {
			return;
		}

		// reset text / output
		this.setState({
			consoleText: "Running GEMF_FAVITES...\n",
			finalResultsText: '',
			transNetworkText: '',
			allTransText: ''
		})

		this.initializeGEMF()
		.then(await this.initializePyodide())
		.then(async () => {
			const FS = this.state.gemfModule.FS;
			const pyodide = this.state.pyodide;

			if (pyodide.FS.readdir(PATH_TO_PYODIDE_ROOT).includes("output")) {
				for (const file of pyodide.FS.readdir(PATH_TO_PYODIDE_ROOT + "output")) {
					if (file === "." || file === "..") {
						continue; 
					}
					pyodide.FS.unlink(PATH_TO_PYODIDE_ROOT + "output/" + file);
				}
				pyodide.FS.rmdir(PATH_TO_PYODIDE_ROOT + "output")
				FS.unlink("para.txt")
				FS.unlink("status.txt")
				FS.unlink("network.txt")
			}
	
			// sets args variable, which will replace sys.argv when running GEMF_FAVITES on the browser
			let args = './GEMF_FAVITES.py -c contact_network.tsv -s initial_states.tsv -i infected_states.txt -r rates.tsv -o output';
			// add time argument
			args += ' -t ' + document.getElementById("endTime").value;
			// add max events
			const maxEvents = document.getElementById("maxEvents").value;
			if (maxEvents !== '') {
				args += ' --max_events ' + maxEvents; 
			}
			// add rng seed
			const rngSeed = document.getElementById("rngSeed").value;
			if (rngSeed !== '') {
				args += ' --rng_seed ' + rngSeed; 
			}
			// add output all transitions flag
			if (document.getElementById("outputAll").checked) {
				args += ' --output_all_transitions';
			}
			// add quiet flag
			if (document.getElementById("quiet").checked) {
				args += " --quiet";
			}
			pyodide.globals.set("arguments", args);
			pyodide.globals.set("runGEMF", this.runGEMF);
	
			// creating appropriate files to run GEMF_FAVITES
			writeFile("contactNetwork", "contact_network.tsv", true)();
			writeFile("initialStates", "initial_states.tsv", true)();
			writeFile("infectedStates", "infected_states.txt", true)();
			writeFile("rates", "rates.tsv", true)();
			FS.writeFile('output.txt', '');
			pyodide.FS.writeFile(PATH_TO_PYODIDE_ROOT + 'GEMF_FAVITES.py', await (await fetch(SITE_HOST + 'GEMF_FAVITES.py')).text(), {encoding: "utf8"});
	
			// run GEMF_FAVITES 
			try {
				pyodide.runPython(await (await fetch(SITE_HOST + "GEMF_FAVITES_WEB.py")).text())
	
				if (pyodide.FS.readdir(PATH_TO_PYODIDE_ROOT + '/output').includes('all_state_transitions.txt')) {
					const allTransitions = new TextDecoder().decode(pyodide.FS.readFile(PATH_TO_PYODIDE_ROOT + '/output/all_state_transitions.txt'));
					this.setState({allTransText: allTransitions})
				}
	
				const transNetwork = new TextDecoder().decode(pyodide.FS.readFile(PATH_TO_PYODIDE_ROOT + '/output/transmission_network.txt'));
				this.setState({transNetworkText: transNetwork})
			} catch (e) {
				console.log(e);
			}
		})

	}

	runGEMF = () => {
		const FS = this.state.gemfModule.FS;
		const pyodide = this.state.pyodide;

		try {
			// TODO: copy files
			FS.writeFile("para.txt", pyodide.FS.readFile(PATH_TO_PYODIDE_ROOT + "output/para.txt"));
			FS.writeFile("network.txt", pyodide.FS.readFile(PATH_TO_PYODIDE_ROOT + "output/network.txt"));
			FS.writeFile("status.txt", pyodide.FS.readFile(PATH_TO_PYODIDE_ROOT + "output/status.txt"));

			this.state.gemfModule.ccall('run_gemf', 'number', ['number', 'string'], [0, ""]);
		} catch (err) {
			console.log(err);
		}
	}

	// closure function for writing text to files
	writeFile = (id, fileName, toPyodide = false) => {
		const FS = this.state.gemfModule.FS;
		const pyodide = this.state.pyodide;

		return () => {
			const input = document.getElementById(id).files[0];
			const reader = new FileReader();
			reader.onload = function() {
				toPyodide ? 
				pyodide.FS.writeFile(PATH_TO_PYODIDE_ROOT + fileName, reader.result) :
				FS.writeFile(fileName, reader.result)
			}
			reader.readAsText(input);
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
				<TextOutput id="console" label="Console" text={this.state.consoleText}/>
				<TextOutput id="finalResults" label="Final Results (Output.txt)" text={this.state.finalResultsText}/>
				<TextOutput id="transNetwork" label="Transmission Network Results" text={this.state.transNetworkText}/>
				<TextOutput id="allTransitions" label="All State Transitions Results" text={this.state.allTransText}/>
			</div>
		</div>
		)
  	}
}

export default App;