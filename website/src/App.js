import React, { Component } from 'react'

import { saveAs } from 'file-saver';

import FileInput from './components/FileInput'
import NumberInput from './components/NumberInput'
import CheckboxInput from './components/CheckboxInput'
import TextOutput from './components/TextOutput'
import HelpGuide from './components/HelpGuide'

import { SITE_HOST, FILE_INPUTS, FILE_OUTPUTS, NUMBER_INPUTS, CHECKBOX_INPUTS, PATH_TO_PYODIDE_ROOT } from './Constants'
import './App.scss';
import 'github-markdown-css/github-markdown-light.css'

export class App extends Component {
	constructor(props) {
		super(props)

		this.state = {
			pyodide: undefined,
			gemfModule: undefined,
			timeElapsed: undefined,
		}

		for (const fileInput of FILE_INPUTS) {
			this.state[fileInput.id + "Text"] = undefined;
			this.state[fileInput.id + "Data"] = undefined;
		}

		for (const fileOutput of FILE_OUTPUTS) {
			this.state[fileOutput.id + 'Text'] = undefined;
			this.state[fileOutput.id + 'Full'] = undefined;
			this.state[fileOutput.id + 'Download'] = fileOutput.download;
		}

		this.runGEMFFavites = this.runGEMFFavites.bind(this);
		this.initializePyodide = this.initializePyodide.bind(this);
	}
	
	initializeGEMF = () => {
		return new Promise((resolve, reject) => {
			this.logMessage("Initializing GEMF...")
			window.createModule({
				print: (text) => {
					this.logMessage(text, "GEMF stdout: \t")
					// on GEMF finish
					if (text.includes("simulation success!")) {
						const FS = this.state.gemfModule.FS;
						const pyodide = this.state.pyodide;
						const finalResults = new TextDecoder().decode(FS.readFile('output.txt'));
						this.setState({finalResultsText: finalResults, finalResultsFull: finalResults})
						this.logMessage("Writing output from GEMF WASM to Pyodide..." )
						pyodide.FS.writeFile(PATH_TO_PYODIDE_ROOT + "/output/output.txt", finalResults);
					}
				},
				printErr: (text) => {
					this.logMessage(text, "GEMF stderr: \t")
				}
			}).then((Module) => {
				this.setState({gemfModule: Module}, resolve)
			})
		})
	}

	initializePyodide = () => {
		return new Promise(async (resolve, reject) => {
			this.logMessage("Initializing Pyodide...")
			if (this.state.pyodide) {
				return resolve();
			}

			this.setState({pyodide: await window.loadPyodide({
				indexURL : "https://cdn.jsdelivr.net/pyodide/v0.22.0/full/",
				stdout: (text) => {
					this.logMessage(text, "GEMF_FAVITES stdout: ", true)
				},
				stderr: (text) => {
					this.logMessage(text, "GEMF_FAVITES stderr: ", true)
				}
			})}, resolve);
		})
	}

	deleteFolder = (path, inPyodide = true, onlyContents = true) => {
		const FS = inPyodide ? this.state.pyodide.FS : this.state.gemfModule.FS; 

		if (!FS.analyzePath(path).object.isFolder) {
			return;
		}

		for (const file of FS.readdir(path)) {
			if (file === "." || file === "..") {
				continue; 
			}

			if (FS.analyzePath(path + file).object.isFolder) {
				this.deleteFolder(path + file + "/", inPyodide, false);
				continue;
			}

			FS.unlink(path + file);
		}

		if (!onlyContents) {
			FS.rmdir(path);
		}
	}

	async runGEMFFavites() {
		if (!this.allInputsValid()) {
			return;
		}
		
		const startTime = Date.now();

		this.setState({timeElapsed: undefined})

		// reset text / output
		const newState = {};
		for (const fileOutput of FILE_OUTPUTS) {
			newState[fileOutput.id + "Text"] = '';
			newState[fileOutput.id + "Data"] = '';
		}
		this.setState(newState)

		this.initializeGEMF()
		.then(await this.initializePyodide())
		.then(async () => {
			const FS = this.state.gemfModule.FS;
			const pyodide = this.state.pyodide;

			this.deleteFolder(PATH_TO_PYODIDE_ROOT);

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

			// keeps track of the number of files that were uploaded
			let fileCounter = 0;
	
			// creating appropriate files to run GEMF_FAVITES
			for (const fileInput of FILE_INPUTS) {
				if (this.state[fileInput.id + "Data"]) {
					pyodide.FS.writeFile(PATH_TO_PYODIDE_ROOT + fileInput.pyodideFileName, this.state[fileInput.id + "Data"]);
					this.logMessage("Writing " + fileInput.label + " to Pyodide...");
					fileCounter++;
				} else {
					const fileReader = new FileReader();
					fileReader.onload = (e) => {
						pyodide.FS.writeFile(PATH_TO_PYODIDE_ROOT + fileInput.pyodideFileName, e.target.result);
						this.logMessage("Writing " + fileInput.label + " to Pyodide...")
						fileCounter++;
					}
					fileReader.readAsText(document.getElementById(fileInput.id).files[0])
				}
			}
			FS.writeFile('output.txt', '');
			pyodide.FS.writeFile(PATH_TO_PYODIDE_ROOT + 'GEMF_FAVITES.py', await (await fetch(SITE_HOST + 'GEMF_FAVITES.py')).text(), {encoding: "utf8"});
	
			// run GEMF_FAVITES 
			const runPython = setInterval(async () => {
				if (fileCounter === 4) {
					clearInterval(runPython);
					this.logMessage("Running GEMF_FAVITES...")

					try {
						pyodide.runPython(await (await fetch(SITE_HOST + "GEMF_FAVITES_WEB.py")).text())
					}  catch (e) {
						this.logMessage(e, "GEMF_FAVITES stderr: ")
					}

					if (pyodide.FS.readdir(PATH_TO_PYODIDE_ROOT + '/output').includes('all_state_transitions.txt')) {
						const allTransitions = new TextDecoder().decode(pyodide.FS.readFile(PATH_TO_PYODIDE_ROOT + '/output/all_state_transitions.txt'));
						const allTransitionsSplit = allTransitions.split('\n');
						allTransitionsSplit.pop();
						let individualsCount = 0;
						let individuals = {};
						let stateTransitionsCount = {};
						
						for (let i = 0; i < allTransitionsSplit.length; i++) {
							if (allTransitionsSplit[i].includes('None')) {
								individualsCount++;
							} else {
								const lineSplit = allTransitionsSplit[i].split('\t');
								individuals[lineSplit[0]] = lineSplit[2];
								if (stateTransitionsCount[lineSplit[1]] === undefined) {
									stateTransitionsCount[lineSplit[1]] = {};
								}
								if (stateTransitionsCount[lineSplit[1]][lineSplit[2]] === undefined) {
									stateTransitionsCount[lineSplit[1]][lineSplit[2]] = 0;
								}
								stateTransitionsCount[lineSplit[1]][lineSplit[2]]++;
							}
						}

						let individualsSummary = "Final States of (Transitioned) Individuals:\n";
						let states = {};
						for (const [key, value] of Object.entries(individuals)) {
							if (states[value] === undefined) {
								states[value] = 0;
							}
							states[value]++;
						}
						for (const [key, value] of Object.entries(states)) {
							individualsSummary += key + ': ' + value + '\n';
						}
						individualsSummary += '\n';
						
						let stateTransitionsSummary = "State Transitions Summary:\n";
						for (const [initialState, finalStates] of Object.entries(stateTransitionsCount)) {
							for (const [finalState, count] of Object.entries(finalStates)) {
								stateTransitionsSummary += initialState + ' to ' + finalState + ': ' + count + '\n';
							}
						}
						stateTransitionsSummary += '\n';

						const totalTransitionsCount = allTransitionsSplit.length - individualsCount;

						const allTransitionsText = 'Total number of state transitions: ' + totalTransitionsCount + '\n\n' + individualsSummary + stateTransitionsSummary;
						this.setState({allTransitionsText, allTransitionsFull: allTransitions})
					}
		
					const transmissionNetwork = new TextDecoder().decode(pyodide.FS.readFile(PATH_TO_PYODIDE_ROOT + '/output/transmission_network.txt'));
					// summarize transmission network
					const transmissionNetworkSplit = transmissionNetwork.split('\n');
					transmissionNetworkSplit.pop();
					let transmissionEventsCount = 0;
					for (let i = transmissionNetworkSplit.length - 1; i >= 0; i--) {
						if (transmissionNetworkSplit[i].startsWith('None')) {
							break;
						}
						transmissionEventsCount++;
					}
					const transmissionNetworkText = `Total number of (non-seed) transmission events: ${transmissionEventsCount}\nTotal number of infected individuals: ${transmissionNetworkSplit.length}`;
					this.setState({transmissionNetworkText, transmissionNetworkFull: transmissionNetwork, timeElapsed: (Date.now() - startTime) / 1000})

					this.logMessage('Done!');
					this.setState({gemfModule: undefined});
				}
			}, 500)
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
			this.logMessage("Copying GEMF WASM files to Pyodide...")

			this.state.gemfModule.ccall('run_gemf', 'number', ['number', 'string'], [0, ""]);

			FS.unlink("para.txt");
			FS.unlink("network.txt");
			FS.unlink("status.txt");
			FS.unlink("output.txt");
		} catch (err) {
			console.log(err);
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
			if (input !== "" || this.state[id + "Data"]) {
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
			if ((input.value === "" && !inputData.required) || (input.value !== "" && parseFloat(input.value) > 0)) {
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

	logMessage = (message, prefix = "", fromFAVITES = false) => {
		const date = new Date();
		const dateStr =
		("00" + (date.getMonth() + 1)).slice(-2) + "-" +
		("00" + date.getDate()).slice(-2) + "-" +
		date.getFullYear() + " " +
		("00" + date.getHours()).slice(-2) + ":" +
		("00" + date.getMinutes()).slice(-2) + ":" +
		("00" + date.getSeconds()).slice(-2);
		const timeStamp = "[" + dateStr + "] ";
		if (fromFAVITES) {
			const splitMessage = message.substring(message.indexOf(']')+2); 
			this.setState(prevState => ({consoleText: (prevState.consoleText ?? '') + timeStamp + prefix + splitMessage + "\n"}))
		} else {
			this.setState(prevState => ({consoleText: (prevState.consoleText ?? '') + timeStamp + prefix + message + "\n"}))
		}
	}

	downloadResults = () => {
		for (const fileOutput of FILE_OUTPUTS) {
			if (this.state[fileOutput.id + "Full"]?.length > 0 && this.state[fileOutput.id + "Download"]) {
				if ((this.state[fileOutput.id + "Full"]?.length > 0)) {
					saveAs(new Blob([this.state[fileOutput.id + "Full"]]), fileOutput.id + ".txt");
				} else {
					saveAs(new Blob([this.state[fileOutput.id + "Data"]]), fileOutput.id + ".txt");
				}
			}
		}
	}

	loadExample = () => {
		for (const fileInput of FILE_INPUTS) {
			fetch(fileInput.exampleFile)
			.then(response => response.text())
			.then((text) => {
				for (const fileInput of FILE_INPUTS) {
					document.getElementById(fileInput.id).value = null;
				}
				
				if (fileInput.summary) {
					this.setFileText(fileInput.id, text, fileInput.summary(text));
				} else {
					this.setFileText(fileInput.id, text);
				}
			})
		}
	}

	setFileText = (id, text, summary) => {
		this.setState({[id + "Text"]: summary ?? text});
		this.setState({[id + "Data"]: text});
	}

	toggleDownloadFile = (id) => {
		this.setState(prevState => {return {[id + "Download"]: !prevState[id + "Download"]}})
	}

	goToAbout = () => {
		document.getElementById("help-guide").scrollIntoView({behavior: 'smooth'});
	}

  	render() {
		return (
		<div className="App d-flex flex-column align-items-center">
			<h1 className="my-5 text-center">GEMF FAVITES Online Tool</h1>
			
			<div id="input-container" className="d-flex flex-column align-items-center">
				<div className="d-flex flex-wrap justify-content-center w-100">
					{FILE_INPUTS.map(input => 
					<FileInput
					key={input.id}
					id={input.id}
					label={input.label}
					validInput={this.validInput}
					fileText={this.state[input.id + "Text"]}
					setFileText={this.setFileText}
					preview={input.preview}
					summary={input.summary}
					/>)}
				</div>
				<div className="d-flex flex-wrap justify-content-center w-100">
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
				<div className="d-flex justify-content-center mt-4 w-100">
					{CHECKBOX_INPUTS.map(input => 
					<CheckboxInput
					key={input.id}
					id={input.id}
					label={input.label}
					/>)}
				</div>
				<p>* Required</p>
			</div>
			<div id="action-container" className="d-flex justify-content-center my-4">
				<button className="mx-3 btn btn-warning" onClick={this.loadExample}>Load Example Dataset</button>
				<button type="button" className="btn btn-primary mx-3" onClick={this.runGEMFFavites}>RUN GEMF_FAVITES</button>
				<button type="button" className="btn btn-success mx-3" onClick={this.downloadResults}>Download Results</button>
				<button type="button" className="btn btn-secondary mx-3" onClick={this.goToAbout}>About This Tool</button>
			</div>
			<h5 className="mt-3">Total Runtime: {this.state.timeElapsed !== undefined && this.state.timeElapsed + ' seconds'}</h5>
			<br />
			<p>Note: Larger contact networks may take longer to run or may make the page unresponsive, please visit <a href="https://github.com/niemasd/GEMF" target="_blank" rel="noreferrer">https://github.com/niemasd/GEMF</a> to setup an environment on a computer to run GEMF.</p>
			<div id="output-container" className="d-flex flex-wrap justify-content-around mt-3 mb-5 w-100">
				{FILE_OUTPUTS.map(fileOutput => 
				<TextOutput 
				key={fileOutput.id}
				id={fileOutput.id}
				label={fileOutput.label}
				text={this.state[fileOutput.id + "Text"]}
				downloadFile={this.state[fileOutput.id + "Download"]}
				toggleDownloadFile={() => this.toggleDownloadFile(fileOutput.id)}
				/>)}
			</div>
			<HelpGuide />
			<p className="w-100 text-center my-5">Created by Daniel Ji and Helena Hundhausen under Professor <a href="https://www.niema.net" target="_blank" rel="noreferrer">Niema Moshiri</a>.</p>
		</div>
		)
  	}
}

export default App;